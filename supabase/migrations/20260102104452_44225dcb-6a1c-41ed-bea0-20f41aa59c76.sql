-- Add assigned_to column to clients table (for assigning clients to users/agents)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);

-- Add created_by column to devis table
ALTER TABLE public.devis 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Add created_by column to factures table
ALTER TABLE public.factures 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Add assigned_to column to taches table (for task delegation)
ALTER TABLE public.taches 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);

-- Create client_accounts table to link auth users with client role to clients table
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(client_id)
);

-- Enable RLS on client_accounts
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own client account link
CREATE POLICY "Users can view their own client account"
ON public.client_accounts
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admins can manage client accounts
CREATE POLICY "Admins can insert client accounts"
ON public.client_accounts
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete client accounts"
ON public.client_accounts
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get client_id for a client user
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.client_accounts WHERE user_id = _user_id LIMIT 1
$$;

-- Update RLS policies for devis to handle roles (using 'agent' as 'utilisateur')
DROP POLICY IF EXISTS "Users can view their entreprise devis" ON public.devis;
CREATE POLICY "Role-based devis access"
ON public.devis
FOR SELECT
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    WHEN 'client' THEN client_id = public.get_user_client_id(auth.uid())
    ELSE false
  END
);

-- Update RLS policies for factures to handle roles
DROP POLICY IF EXISTS "Users can view their entreprise factures" ON public.factures;
CREATE POLICY "Role-based factures access"
ON public.factures
FOR SELECT
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    WHEN 'client' THEN client_id = public.get_user_client_id(auth.uid())
    ELSE false
  END
);

-- Update RLS policies for clients to handle roles
DROP POLICY IF EXISTS "Users can view their entreprise clients" ON public.clients;
CREATE POLICY "Role-based clients access"
ON public.clients
FOR SELECT
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND assigned_to = auth.uid()
    WHEN 'client' THEN id = public.get_user_client_id(auth.uid())
    ELSE false
  END
);

-- Update RLS policies for taches to handle roles
DROP POLICY IF EXISTS "Users can view their entreprise taches" ON public.taches;
CREATE POLICY "Role-based taches access"
ON public.taches
FOR SELECT
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND assigned_to = auth.uid()
    ELSE false
  END
);

-- Update insert policies
DROP POLICY IF EXISTS "Users can insert devis for their entreprise" ON public.devis;
CREATE POLICY "Users can insert devis for their entreprise"
ON public.devis
FOR INSERT
WITH CHECK (
  entreprise_id = get_user_entreprise_id(auth.uid()) 
  AND public.get_user_role(auth.uid()) IN ('admin', 'agent')
);

DROP POLICY IF EXISTS "Users can insert factures for their entreprise" ON public.factures;
CREATE POLICY "Users can insert factures for their entreprise"
ON public.factures
FOR INSERT
WITH CHECK (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('admin', 'agent')
);

-- Update delete/update policies for role-based access
DROP POLICY IF EXISTS "Users can update their entreprise devis" ON public.devis;
CREATE POLICY "Role-based devis update"
ON public.devis
FOR UPDATE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can delete their entreprise devis" ON public.devis;
CREATE POLICY "Role-based devis delete"
ON public.devis
FOR DELETE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can update their entreprise factures" ON public.factures;
CREATE POLICY "Role-based factures update"
ON public.factures
FOR UPDATE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can delete their entreprise factures" ON public.factures;
CREATE POLICY "Role-based factures delete"
ON public.factures
FOR DELETE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
    ELSE false
  END
);

-- Update taches policies
DROP POLICY IF EXISTS "Users can update their entreprise taches" ON public.taches;
CREATE POLICY "Role-based taches update"
ON public.taches
FOR UPDATE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND assigned_to = auth.uid()
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can delete their entreprise taches" ON public.taches;
CREATE POLICY "Role-based taches delete"
ON public.taches
FOR DELETE
USING (
  CASE public.get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND assigned_to = auth.uid()
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can insert taches for their entreprise" ON public.taches;
CREATE POLICY "Users can insert taches for their entreprise"
ON public.taches
FOR INSERT
WITH CHECK (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('admin', 'agent')
);

-- Update clients policies for mutations (admin only)
DROP POLICY IF EXISTS "Users can update their entreprise clients" ON public.clients;
CREATE POLICY "Role-based clients update"
ON public.clients
FOR UPDATE
USING (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can delete their entreprise clients" ON public.clients;
CREATE POLICY "Role-based clients delete"
ON public.clients
FOR DELETE
USING (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can insert clients for their entreprise" ON public.clients;
CREATE POLICY "Role-based clients insert"
ON public.clients
FOR INSERT
WITH CHECK (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'admin'
);