-- Modifier le trigger pour gérer correctement les utilisateurs créés par un admin
-- Le trigger ne doit créer une nouvelle entreprise QUE si l'utilisateur s'inscrit lui-même
-- Si entreprise_nom est vide, on ne crée pas d'entreprise ni de rôle admin

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  entreprise_id_new uuid;
  user_nom text;
  entreprise_nom text;
BEGIN
  -- Get user metadata
  user_nom := NEW.raw_user_meta_data ->> 'nom';
  entreprise_nom := NEW.raw_user_meta_data ->> 'entreprise_nom';
  
  -- Si entreprise_nom est vide ou null, c'est un utilisateur créé par un admin
  -- On crée juste le profil sans entreprise ni rôle (sera géré par l'admin)
  IF entreprise_nom IS NULL OR entreprise_nom = '' THEN
    -- Créer un profil de base sans entreprise (sera mis à jour par l'admin)
    INSERT INTO public.profiles (id, nom, email, entreprise_id)
    VALUES (NEW.id, COALESCE(user_nom, ''), NEW.email, NULL);
    
    -- Ne pas créer de rôle - l'admin le fera
    RETURN NEW;
  END IF;
  
  -- Sinon, c'est une inscription normale - créer l'entreprise et le rôle admin
  INSERT INTO public.entreprises (nom)
  VALUES (entreprise_nom)
  RETURNING id INTO entreprise_id_new;
  
  -- Create the profile
  INSERT INTO public.profiles (id, nom, email, entreprise_id)
  VALUES (NEW.id, COALESCE(user_nom, ''), NEW.email, entreprise_id_new);
  
  -- Create the admin role (only for self-signups with entreprise)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;