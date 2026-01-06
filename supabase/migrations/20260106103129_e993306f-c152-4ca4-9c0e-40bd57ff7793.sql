
-- Create permissions enum with all actions
CREATE TYPE public.app_permission AS ENUM (
  -- Clients
  'creer_client',
  'voir_client',
  'modifier_client',
  'supprimer_client',
  
  -- Devis
  'creer_devis',
  'voir_devis',
  'modifier_devis',
  'supprimer_devis',
  'envoyer_devis',
  
  -- Factures
  'creer_facture',
  'voir_facture',
  'modifier_facture',
  'supprimer_facture',
  'generer_pdf_facture',
  
  -- Revenus
  'voir_revenus',
  'ajouter_revenu',
  
  -- Dépenses
  'voir_depenses',
  'ajouter_depense',
  
  -- Documents IA
  'creer_document_ia',
  'voir_document_ia',
  'telecharger_document_ia',
  
  -- Tâches
  'creer_tache',
  'assigner_tache',
  'voir_tache',
  'modifier_tache',
  'cloturer_tache',
  
  -- Statistiques
  'voir_statistiques_globales',
  'voir_statistiques_personnelles',
  
  -- Utilisateurs
  'gerer_utilisateurs',
  'gerer_parametres'
);

-- Default permissions per role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

-- Custom user permissions (overrides)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission app_permission NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS for role_permissions (readable by authenticated users)
CREATE POLICY "Authenticated users can read role permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

-- Only admins can manage role_permissions
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for user_permissions
CREATE POLICY "Users can read their own permissions"
ON public.user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default permissions for ADMIN (all permissions)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'creer_client'),
  ('admin', 'voir_client'),
  ('admin', 'modifier_client'),
  ('admin', 'supprimer_client'),
  ('admin', 'creer_devis'),
  ('admin', 'voir_devis'),
  ('admin', 'modifier_devis'),
  ('admin', 'supprimer_devis'),
  ('admin', 'envoyer_devis'),
  ('admin', 'creer_facture'),
  ('admin', 'voir_facture'),
  ('admin', 'modifier_facture'),
  ('admin', 'supprimer_facture'),
  ('admin', 'generer_pdf_facture'),
  ('admin', 'voir_revenus'),
  ('admin', 'ajouter_revenu'),
  ('admin', 'voir_depenses'),
  ('admin', 'ajouter_depense'),
  ('admin', 'creer_document_ia'),
  ('admin', 'voir_document_ia'),
  ('admin', 'telecharger_document_ia'),
  ('admin', 'creer_tache'),
  ('admin', 'assigner_tache'),
  ('admin', 'voir_tache'),
  ('admin', 'modifier_tache'),
  ('admin', 'cloturer_tache'),
  ('admin', 'voir_statistiques_globales'),
  ('admin', 'voir_statistiques_personnelles'),
  ('admin', 'gerer_utilisateurs'),
  ('admin', 'gerer_parametres');

-- Insert default permissions for AGENT (limited)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('agent', 'voir_client'),
  ('agent', 'creer_client'),
  ('agent', 'modifier_client'),
  ('agent', 'creer_devis'),
  ('agent', 'voir_devis'),
  ('agent', 'modifier_devis'),
  ('agent', 'envoyer_devis'),
  ('agent', 'creer_facture'),
  ('agent', 'voir_facture'),
  ('agent', 'modifier_facture'),
  ('agent', 'generer_pdf_facture'),
  ('agent', 'voir_revenus'),
  ('agent', 'voir_depenses'),
  ('agent', 'creer_document_ia'),
  ('agent', 'voir_document_ia'),
  ('agent', 'telecharger_document_ia'),
  ('agent', 'voir_tache'),
  ('agent', 'modifier_tache'),
  ('agent', 'cloturer_tache'),
  ('agent', 'voir_statistiques_personnelles');

-- Insert default permissions for CLIENT (very limited)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('client', 'voir_devis'),
  ('client', 'voir_facture'),
  ('client', 'telecharger_document_ia'),
  ('client', 'generer_pdf_facture');

-- Security definer function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  custom_permission BOOLEAN;
  role_has_permission BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for custom user permission override
  SELECT granted INTO custom_permission 
  FROM public.user_permissions 
  WHERE user_id = _user_id AND permission = _permission;
  
  -- If custom permission exists, use it
  IF custom_permission IS NOT NULL THEN
    RETURN custom_permission;
  END IF;
  
  -- Otherwise, check role default permissions
  SELECT EXISTS(
    SELECT 1 FROM public.role_permissions 
    WHERE role = user_role AND permission = _permission
  ) INTO role_has_permission;
  
  RETURN role_has_permission;
END;
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS app_permission[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  permissions app_permission[];
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN ARRAY[]::app_permission[];
  END IF;
  
  -- Get all permissions: role defaults + custom grants - custom revokes
  SELECT ARRAY_AGG(DISTINCT perm) INTO permissions
  FROM (
    -- Role default permissions
    SELECT permission AS perm FROM public.role_permissions WHERE role = user_role
    UNION
    -- Custom granted permissions
    SELECT permission AS perm FROM public.user_permissions 
    WHERE user_id = _user_id AND granted = true
    EXCEPT
    -- Remove custom revoked permissions
    SELECT permission AS perm FROM public.user_permissions 
    WHERE user_id = _user_id AND granted = false
  ) AS all_perms;
  
  RETURN COALESCE(permissions, ARRAY[]::app_permission[]);
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
