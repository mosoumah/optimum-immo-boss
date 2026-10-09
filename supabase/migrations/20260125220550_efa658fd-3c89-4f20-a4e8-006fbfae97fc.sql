-- Créer une fonction pour permettre aux admins de créer des utilisateurs dans leur entreprise
CREATE OR REPLACE FUNCTION public.admin_create_user_in_entreprise(
  _new_user_id uuid,
  _entreprise_id uuid,
  _role app_role,
  _client_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_role app_role;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT role INTO _caller_role FROM public.user_roles WHERE user_id = auth.uid();
  
  IF _caller_role IS NULL OR _caller_role != 'admin' THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent créer des utilisateurs';
  END IF;

  -- Vérifier que l'admin appartient à la même entreprise
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND entreprise_id = _entreprise_id
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez créer des utilisateurs que dans votre entreprise';
  END IF;

  -- Mettre à jour le profil du nouvel utilisateur avec l'entreprise_id
  UPDATE public.profiles 
  SET entreprise_id = _entreprise_id 
  WHERE id = _new_user_id;

  -- Vérifier si un rôle existe déjà pour cet utilisateur
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _new_user_id) THEN
    -- Mettre à jour le rôle existant
    UPDATE public.user_roles 
    SET role = _role 
    WHERE user_id = _new_user_id;
  ELSE
    -- Insérer un nouveau rôle
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (_new_user_id, _role);
  END IF;

  -- Si c'est un client, créer le lien client_account
  IF _role = 'client' AND _client_id IS NOT NULL THEN
    INSERT INTO public.client_accounts (user_id, client_id)
    VALUES (_new_user_id, _client_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;