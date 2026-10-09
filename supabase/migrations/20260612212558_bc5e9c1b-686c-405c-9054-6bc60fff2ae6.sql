-- Suppression complète du module Devis
ALTER TABLE public.factures DROP COLUMN IF EXISTS devis_id;
DROP TABLE IF EXISTS public.devis CASCADE;
DROP TYPE IF EXISTS public.devis_statut;
-- Nettoyage des permissions personnalisées liées aux devis (sans toucher à l'enum app_permission)
DELETE FROM public.role_permissions WHERE permission::text IN ('creer_devis','voir_devis','modifier_devis','supprimer_devis','envoyer_devis');
DELETE FROM public.user_permissions WHERE permission::text IN ('creer_devis','voir_devis','modifier_devis','supprimer_devis','envoyer_devis');