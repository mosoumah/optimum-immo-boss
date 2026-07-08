import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthResult = {
  data?: {
    client?: { name?: string; client_name?: string; client_uri?: string; logo_uri?: string };
    redirect_url?: string;
    redirect_to?: string;
    scope?: string;
    scopes?: string[];
    redirect_uri?: string;
  };
  error?: { message: string };
};
type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Identifiant d'autorisation manquant.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/connexion?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data ?? null);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Aucune URL de redirection retournée par le serveur d'autorisation.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "cette application";
  const scopes = details?.scopes ?? (details?.scope ? details.scope.split(" ") : []);
  const scopeLabels: Record<string, string> = {
    openid: "Vérifier votre identité",
    email: "Consulter votre adresse email",
    profile: "Consulter votre profil de base",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pattern-dots opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8">
          <div className="text-center mb-6">
            <Logo size="md" />
          </div>

          {error ? (
            <div className="text-center space-y-4">
              <h1 className="text-xl font-bold">Impossible de charger cette autorisation</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : !details ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-2 text-center">
                Connecter <span className="text-gradient">{clientName}</span> à Optimum Immo
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-6">
                {clientName} pourra utiliser les outils Optimum Immo pendant que vous êtes connecté
                {userEmail ? ` en tant que ${userEmail}` : ""}.
              </p>

              <div className="space-y-2 mb-6">
                {scopes.length > 0 &&
                  scopes.map((s) => (
                    <div key={s} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{scopeLabels[s] ?? `Autorisation supplémentaire : ${s}`}</span>
                    </div>
                  ))}
                <div className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Appeler les outils activés de votre compte en votre nom.</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                Cela ne contourne pas les permissions de l'application ni les politiques d'accès aux données.
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => decide(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="hero"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => decide(true)}
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Approuver"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
