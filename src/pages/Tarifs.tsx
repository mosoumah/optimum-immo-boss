import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Building2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingParticles } from "@/components/FloatingParticles";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PlanCard } from "@/components/pricing/PlanCard";
import { ReassuranceBanner } from "@/components/pricing/ReassuranceBanner";
import { WhyOptimum } from "@/components/pricing/WhyOptimum";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PaymentMethodsStrip } from "@/components/pricing/PaymentMethodsStrip";
import { PLANS, type BillingCycle, type Plan } from "@/lib/pricing/plans";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Tarifs = () => {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { user } = useAuth();
  const { entrepriseId } = useEntreprise();
  const { isExpired, isTrial, trialDaysLeft, refetch } = useSubscription();
  const navigate = useNavigate();

  const handleSelect = async (plan: Plan) => {
    if (!user) {
      navigate("/inscription");
      return;
    }
    if (!entrepriseId) return;

    try {
      const { data, error } = await supabase.functions.invoke("chariow-checkout", {
        body: {
          plan: plan.id,
          billing_cycle: cycle,
          success_url: `${window.location.origin}/abonnement?checkout=success`,
        },
      });

      // supabase.functions.invoke ne rejette pas: on lit le message d'erreur renvoyé par l'edge function
      const payload = (data ?? {}) as { checkout_url?: string; error?: string };
      if (error || payload.error) {
        // Tenter d'extraire un message plus précis via le body de la réponse
        let detailedMessage = payload.error ?? "";
        const ctx = (error as unknown as { context?: Response })?.context;
        if (!detailedMessage && ctx && typeof ctx.text === "function") {
          try {
            const raw = await ctx.text();
            const parsed = JSON.parse(raw);
            detailedMessage = parsed?.error ?? raw;
          } catch {
            /* ignore */
          }
        }
        throw new Error(detailedMessage || error?.message || "Erreur inconnue");
      }

      if (!payload.checkout_url) throw new Error("URL de paiement introuvable.");
      window.location.href = payload.checkout_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast({
        title: "Paiement indisponible",
        description: message,
        variant: "destructive",
      });
      refetch();
    }
  };

  return (
    <div className="min-h-screen mesh-gradient relative overflow-x-hidden">
      <FloatingParticles count={20} />
      <Navbar />

      <main className="relative z-10">
        {/* HERO */}
        <section className="pt-28 sm:pt-32 pb-14 px-4">
          <div className="max-w-5xl mx-auto text-center">
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold mb-6"
              >
                Votre essai est terminé — choisissez un forfait pour continuer
              </motion.div>
            )}
            {isTrial && trialDaysLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Essai actif — {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant{trialDaysLeft > 1 ? "s" : ""}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-5 leading-[1.05]"
            >
              Le forfait{" "}
              <span className="italic text-primary">taillé</span> pour<br className="hidden sm:block" />{" "}
              votre agence immobilière
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Commencez gratuitement pendant 14 jours. Sans carte bancaire. Sans engagement.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              {!user && (
                <Link to="/inscription">
                  <Button size="lg" className="rounded-xl font-semibold h-12 px-8 gap-2 shadow-lg shadow-primary/30">
                    Commencer gratuitement
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <BillingToggle value={cycle} onChange={setCycle} />
            </motion.div>
          </div>
        </section>

        {/* PLANS */}
        <section className="px-4 pb-14">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} cycle={cycle} onSelect={handleSelect} index={i} />
            ))}
          </div>
        </section>

        {/* REASSURANCE */}
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <ReassuranceBanner />
          </div>
        </section>

        {/* WHY */}
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <WhyOptimum />
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 pb-20">
          <PricingFAQ />
        </section>

        {/* PAYMENTS + FINAL CTA */}
        <section className="px-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <PaymentMethodsStrip />
          </div>
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-14 relative rounded-[2rem] overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card/80 to-background"
            >
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.08)_1px,transparent_0)] [background-size:32px_32px] opacity-50" />

              <div className="relative px-6 sm:px-12 md:px-20 py-12 sm:py-16 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 mb-6"
                >
                  <Building2 className="w-7 h-7 text-primary" />
                </motion.div>

                <h2 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] max-w-3xl mx-auto">
                  Prêt à transformer{" "}
                  <span className="italic text-primary">votre agence</span> ?
                </h2>
                <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                  Rejoignez les agences immobilières guinéennes qui ont choisi la clarté, la sérénité
                  et un outil moderne pour développer sereinement leur activité.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    to={user ? "/dashboard" : "/inscription"}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3.5 font-medium shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.9)] transition-all"
                  >
                    14 jours d'essai gratuits
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/connexion"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-8 py-3.5 font-medium hover:bg-white/[0.05] hover:border-white/20 transition-all"
                  >
                    J'ai déjà un compte
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" /> Données sécurisées</span>
                  <span className="inline-flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Mise en route immédiate</span>
                  <span className="inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> IA incluse</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Tarifs;
