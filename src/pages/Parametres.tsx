import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Building2, LogOut, Save, ToggleLeft, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LogoUpload } from "@/components/LogoUpload";
import { useAgencySettings } from "@/hooks/useAgencySettings";
import { SignaturePad } from "@/components/SignaturePad";

interface Profile {
  nom: string;
  email: string;
}

interface Entreprise {
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  logo: string | null;
  signature: string | null;
}

const Parametres = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ nom: "", email: "" });
  const [entreprise, setEntreprise] = useState<Entreprise>({ nom: "", adresse: "", telephone: "", email: "", logo: null, signature: null });
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nom, email, entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({ nom: profileData.nom, email: profileData.email });
        setEntrepriseId(profileData.entreprise_id);

        if (profileData.entreprise_id) {
          const { data: entrepriseData } = await supabase
            .from("entreprises")
            .select("nom, adresse, telephone, email, logo, signature")
            .eq("id", profileData.entreprise_id)
            .maybeSingle();

          if (entrepriseData) {
            setEntreprise({
              nom: entrepriseData.nom,
              adresse: entrepriseData.adresse || "",
              telephone: entrepriseData.telephone || "",
              email: entrepriseData.email || "",
              logo: entrepriseData.logo || null,
              signature: entrepriseData.signature || null,
            });
          }
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user || !entrepriseId) return;

    setIsSaving(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ nom: profile.nom })
      .eq("id", user.id);

    const { error: entrepriseError } = await supabase
      .from("entreprises")
      .update({
        nom: entreprise.nom,
        adresse: entreprise.adresse || null,
        telephone: entreprise.telephone || null,
        email: entreprise.email || null,
      })
      .eq("id", entrepriseId);

    setIsSaving(false);

    if (profileError || entrepriseError) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès",
      });
    }
  };

  const handleLogoUpdated = (newLogoUrl: string) => {
    setEntreprise((prev) => ({ ...prev, logo: newLogoUrl }));
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!entrepriseId) return;
    const { error } = await supabase
      .from("entreprises")
      .update({ signature: dataUrl })
      .eq("id", entrepriseId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder la signature", variant: "destructive" });
    } else {
      setEntreprise((prev) => ({ ...prev, signature: dataUrl }));
      toast({ title: "Succès", description: "Signature enregistrée" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">Gérez vos paramètres</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-border/50 card-gradient"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Profil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  value={profile.nom}
                  onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
              </div>
            </div>
          </motion.div>

          {/* Entreprise Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border border-border/50 card-gradient"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Entreprise</h2>
            </div>
            <div className="space-y-4">
              {/* Logo Upload */}
              {entrepriseId && (
                <LogoUpload
                  entrepriseId={entrepriseId}
                  currentLogo={entreprise.logo}
                  onLogoUpdated={handleLogoUpdated}
                />
              )}

              {/* Signature Section */}
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 mb-3">
                  <PenTool className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Signature de l'entreprise</span>
                </div>
                <SignaturePad
                  currentSignature={entreprise.signature}
                  onSignatureSave={handleSignatureSave}
                />
              </div>
              <div>
                <Label htmlFor="entreprise-nom">Nom de l'entreprise</Label>
                <Input
                  id="entreprise-nom"
                  value={entreprise.nom}
                  onChange={(e) => setEntreprise({ ...entreprise, nom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="entreprise-adresse">Adresse</Label>
                <Input
                  id="entreprise-adresse"
                  value={entreprise.adresse || ""}
                  onChange={(e) => setEntreprise({ ...entreprise, adresse: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entreprise-telephone">Téléphone</Label>
                  <Input
                    id="entreprise-telephone"
                    value={entreprise.telephone || ""}
                    onChange={(e) => setEntreprise({ ...entreprise, telephone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="entreprise-email">Email</Label>
                  <Input
                    id="entreprise-email"
                    value={entreprise.email || ""}
                    onChange={(e) => setEntreprise({ ...entreprise, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Agency Mode Section */}
          <AgencyModeSection />

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AgencyModeSection = () => {
  const { venteEnabled, locationEnabled, updateSettings } = useAgencySettings();
  const { toast } = useToast();

  const handleToggle = (field: "vente_enabled" | "location_enabled", value: boolean) => {
    // At least one must remain active
    if (field === "vente_enabled" && !value && !locationEnabled) {
      toast({ title: "Attention", description: "Au moins un module doit rester actif", variant: "destructive" });
      return;
    }
    if (field === "location_enabled" && !value && !venteEnabled) {
      toast({ title: "Attention", description: "Au moins un module doit rester actif", variant: "destructive" });
      return;
    }
    updateSettings.mutate({ [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-6 rounded-xl border border-border/50 card-gradient"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <ToggleLeft className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Mode d'activité de l'agence</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Vente immobilière</Label>
            <p className="text-xs text-muted-foreground">Active le module Transactions</p>
          </div>
          <Switch checked={venteEnabled} onCheckedChange={(v) => handleToggle("vente_enabled", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Location immobilière</Label>
            <p className="text-xs text-muted-foreground">Active le module Réservations</p>
          </div>
          <Switch checked={locationEnabled} onCheckedChange={(v) => handleToggle("location_enabled", v)} />
        </div>
      </div>
    </motion.div>
  );
};

export default Parametres;
