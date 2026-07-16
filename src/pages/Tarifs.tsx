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

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: plan.id,
        billing_cycle: cycle,
        status: "pending_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("entreprise_id", entrepriseId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Demande enregistrée",
      description: `Nous vous contacterons pour finaliser le paiement du forfait ${plan.name}.`,
    });
    refetch();
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
        <section className="px-4 pb-24">
          <div className="max-w-5xl mx-auto">
            <PaymentMethodsStrip />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-14 text-center rounded-3xl p-10 sm:p-14 border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
              <div className="relative">
                <h2 className="font-display text-3xl sm:text-5xl tracking-tight leading-[1.05] mb-6">
                  Prêt à digitaliser votre <span className="italic text-primary">agence immobilière</span> ?
                </h2>
                <Link to={user ? "/dashboard" : "/inscription"}>
                  <Button size="lg" className="rounded-xl font-semibold h-13 px-8 gap-2 shadow-lg shadow-primary/30">
                    Commencer mon essai gratuit de 14 jours
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
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
