INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, p::public.app_permission
FROM unnest(ARRAY[
  'voir_bien','creer_bien','modifier_bien','supprimer_bien',
  'voir_reservation','creer_reservation','modifier_reservation','supprimer_reservation',
  'envoyer_message'
]) AS p
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp
  WHERE rp.role = 'admin' AND rp.permission::text = p
);
