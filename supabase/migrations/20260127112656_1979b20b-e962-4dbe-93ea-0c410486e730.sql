-- 1) Ajouter created_at à user_roles si absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2) Nettoyer les doublons: garder admin > agent > client, supprimer le reste
WITH ranked_roles AS (
  SELECT id, user_id, role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'agent' THEN 2 
          WHEN 'client' THEN 3 
        END
    ) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- 3) Supprimer l'ancienne contrainte (user_id, role) si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_role_key;
  END IF;
END $$;

-- 4) Ajouter la contrainte UNIQUE(user_id) si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 5) Créer la fonction bootstrap_current_user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.bootstrap_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _user_nom text;
  _profile_exists boolean;
  _entreprise_id uuid;
  _new_entreprise_id uuid;
  _role_exists boolean;
  _has_admin boolean;
  _assigned_role app_role;
  _result jsonb;
BEGIN
  -- Récupérer l'utilisateur courant
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Récupérer email et nom depuis auth.users
  SELECT 
    COALESCE(raw_user_meta_data->>'email', email),
    COALESCE(raw_user_meta_data->>'nom', split_part(email, '@', 1))
  INTO _user_email, _user_nom
  FROM auth.users
  WHERE id = _user_id;

  -- Vérifier si le profil existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = _user_id) INTO _profile_exists;
  
  -- Récupérer entreprise_id du profil (si existe)
  IF _profile_exists THEN
    SELECT entreprise_id INTO _entreprise_id FROM profiles WHERE id = _user_id;
  END IF;

  -- Si pas d'entreprise_id, en créer une
  IF _entreprise_id IS NULL THEN
    INSERT INTO entreprises (nom)
    VALUES (COALESCE(_user_nom, 'Mon Entreprise') || ' - Entreprise')
    RETURNING id INTO _new_entreprise_id;
    
    _entreprise_id := _new_entreprise_id;
  END IF;

  -- Créer ou mettre à jour le profil
  IF NOT _profile_exists THEN
    INSERT INTO profiles (id, email, nom, entreprise_id)
    VALUES (_user_id, _user_email, _user_nom, _entreprise_id);
  ELSIF _new_entreprise_id IS NOT NULL THEN
    -- Mettre à jour entreprise_id si on vient de la créer
    UPDATE profiles SET entreprise_id = _entreprise_id WHERE id = _user_id;
  END IF;

  -- Vérifier si un rôle existe déjà
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id) INTO _role_exists;

  IF NOT _role_exists THEN
    -- Déterminer le rôle: admin si aucun admin dans cette entreprise, sinon agent
    SELECT EXISTS(
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.entreprise_id = _entreprise_id
      AND ur.role = 'admin'
      AND ur.user_id != _user_id
    ) INTO _has_admin;

    IF _has_admin THEN
      _assigned_role := 'agent';
    ELSE
      _assigned_role := 'admin';
    END IF;

    INSERT INTO user_roles (user_id, role)
    VALUES (_user_id, _assigned_role);
  ELSE
    -- Récupérer le rôle existant
    SELECT role INTO _assigned_role FROM user_roles WHERE user_id = _user_id;
  END IF;

  _result := jsonb_build_object(
    'success', true,
    'user_id', _user_id,
    'entreprise_id', _entreprise_id,
    'role', _assigned_role,
    'profile_created', NOT _profile_exists,
    'entreprise_created', _new_entreprise_id IS NOT NULL,
    'role_created', NOT _role_exists
  );

  RETURN _result;
END;
$$;

-- 6) Autoriser les utilisateurs authentifiés à appeler cette fonction
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user() TO authenticated;