-- Fonction inutilisée par l'app (la création d'utilisateur passe par l'Edge Function admin-create-user).
-- Elle permettait à un admin d'une agence de rattacher n'importe quel utilisateur (autre agence) à la sienne.
REVOKE EXECUTE ON FUNCTION public.admin_create_user_in_entreprise(uuid, uuid, public.app_role, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user_in_entreprise(uuid, uuid, public.app_role, uuid) TO service_role;
