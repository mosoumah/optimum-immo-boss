INSERT INTO public.role_permissions (role, permission)
SELECT 'agent'::public.app_role, p::public.app_permission
FROM unnest(ARRAY[
  'voir_bien','creer_bien',
  'voir_reservation','creer_reservation','modifier_reservation',
  'envoyer_message'
]) AS p
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp
  WHERE rp.role = 'agent' AND rp.permission::text = p
);
