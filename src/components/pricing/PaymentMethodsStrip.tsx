import { Smartphone } from "lucide-react";

/**
 * Bande des moyens de paiement acceptés.
 * Un seul moyen : MTN Mobile Money (le paiement passe par SasPay).
 */
export const PaymentMethodsStrip = () => (
  <div className="text-center">
    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-5 font-semibold">
      Moyen de paiement accepté
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-sm text-sm font-semibold bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
        <Smartphone className="w-4 h-4" />
        MTN Mobile Money
      </div>
    </div>
    <p className="mt-5 text-xs text-muted-foreground">
      Vous n'avez pas de compte Mobile Money ? Contactez-nous.
    </p>
  </div>
);
