-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entreprise_id_new uuid;
  user_nom text;
  entreprise_nom text;
BEGIN
  -- Get user metadata
  user_nom := NEW.raw_user_meta_data ->> 'nom';
  entreprise_nom := NEW.raw_user_meta_data ->> 'entreprise_nom';
  
  -- Create the entreprise
  INSERT INTO public.entreprises (nom)
  VALUES (COALESCE(entreprise_nom, 'Mon Entreprise'))
  RETURNING id INTO entreprise_id_new;
  
  -- Create the profile
  INSERT INTO public.profiles (id, nom, email, entreprise_id)
  VALUES (NEW.id, COALESCE(user_nom, ''), NEW.email, entreprise_id_new);
  
  -- Create the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();