
-- 1. Add missing columns for Chariow integration (idempotent)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_start timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Backfill trial_start / trial_end from existing data
UPDATE public.subscriptions
SET trial_start = COALESCE(trial_start, start_date),
    trial_end   = COALESCE(trial_end, trial_ends_at)
WHERE trial_start IS NULL OR trial_end IS NULL;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_entreprise_id ON public.subscriptions(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id ON public.subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer_id ON public.subscriptions(provider_customer_id);

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Update provisioning function: new entreprise -> 14-day Starter trial
CREATE OR REPLACE FUNCTION public.provision_trial_on_entreprise()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (
    entreprise_id, plan, status, billing_cycle,
    start_date, end_date, trial_ends_at,
    trial_start, trial_end
  )
  VALUES (
    NEW.id, 'starter', 'trial', 'monthly',
    now(), now() + interval '14 days', now() + interval '14 days',
    now(), now() + interval '14 days'
  )
  ON CONFLICT (entreprise_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on entreprises
DROP TRIGGER IF EXISTS trg_provision_trial_on_entreprise ON public.entreprises;
CREATE TRIGGER trg_provision_trial_on_entreprise
  AFTER INSERT ON public.entreprises
  FOR EACH ROW EXECUTE FUNCTION public.provision_trial_on_entreprise();
