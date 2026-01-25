-- 1. Assigner un rôle 'agent' aux utilisateurs orphelins (ont un profil mais pas de rôle)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'agent'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.id IS NULL AND p.entreprise_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Créer une fonction atomique pour créer un utilisateur avec son rôle
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  _user_id UUID,
  _entreprise_id UUID,
  _role app_role,
  _client_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile with entreprise_id
  UPDATE public.profiles 
  SET entreprise_id = _entreprise_id 
  WHERE id = _user_id;
  
  -- Delete any existing role (cleanup)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (_user_id, _role);
  
  -- Insert client account if role is client
  IF _role = 'client' AND _client_id IS NOT NULL THEN
    INSERT INTO public.client_accounts (user_id, client_id) 
    VALUES (_user_id, _client_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;