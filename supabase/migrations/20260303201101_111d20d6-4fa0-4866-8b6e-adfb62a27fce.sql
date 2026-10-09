
-- Add 12 new values to app_permission enum
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'creer_bien';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'voir_bien';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'modifier_bien';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'supprimer_bien';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'creer_reservation';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'voir_reservation';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'modifier_reservation';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'supprimer_reservation';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'generer_image_ia';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'voir_image_ia';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'redesigner_bien_ia';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'envoyer_message';
