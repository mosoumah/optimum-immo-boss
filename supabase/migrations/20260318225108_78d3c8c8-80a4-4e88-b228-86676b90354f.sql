-- =============================================
-- SECURITY FIX: Harden RLS policies
-- =============================================

-- 1. DEPENSES: Add role check (admin/agent only)
DROP POLICY IF EXISTS "Users can view their entreprise depenses" ON public.depenses;
DROP POLICY IF EXISTS "Users can insert depenses for their entreprise" ON public.depenses;
DROP POLICY IF EXISTS "Users can update their entreprise depenses" ON public.depenses;
DROP POLICY IF EXISTS "Users can delete their entreprise depenses" ON public.depenses;

CREATE POLICY "Role-based depenses access" ON public.depenses
  FOR SELECT TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based depenses insert" ON public.depenses
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based depenses update" ON public.depenses
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based depenses delete" ON public.depenses
  FOR DELETE TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

-- 2. REVENUS: Add role check to SELECT and INSERT
DROP POLICY IF EXISTS "Users can view their entreprise revenus" ON public.revenus;
DROP POLICY IF EXISTS "Users can insert revenus for their entreprise" ON public.revenus;

CREATE POLICY "Role-based revenus access" ON public.revenus
  FOR SELECT TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based revenus insert" ON public.revenus
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

-- 3. DOCUMENTS: Add role-based policies
DROP POLICY IF EXISTS "Users can view their entreprise documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents for their entreprise" ON public.documents;
DROP POLICY IF EXISTS "Users can update their entreprise documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their entreprise documents" ON public.documents;

CREATE POLICY "Role-based documents access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based documents insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based documents update" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based documents delete" ON public.documents
  FOR DELETE TO authenticated
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

-- 4. CLIENT_ACCOUNTS: Add entreprise scope
DROP POLICY IF EXISTS "Admins can insert client accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Admins can delete client accounts" ON public.client_accounts;

CREATE POLICY "Admins can insert client accounts scoped" ON public.client_accounts
  FOR INSERT TO public
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_accounts.client_id
      AND c.entreprise_id = get_user_entreprise_id(auth.uid())
    )
  );

CREATE POLICY "Admins can delete client accounts scoped" ON public.client_accounts
  FOR DELETE TO public
  USING (
    has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_accounts.client_id
      AND c.entreprise_id = get_user_entreprise_id(auth.uid())
    )
  );

-- 5. ROLE_PERMISSIONS: Restrict SELECT to authenticated users with a role
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON public.role_permissions;

CREATE POLICY "Users can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) IS NOT NULL
  );