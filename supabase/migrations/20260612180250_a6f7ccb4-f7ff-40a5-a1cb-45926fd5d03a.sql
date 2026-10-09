
-- Fix profiles UPDATE: replace self-referencing subquery with SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND entreprise_id IS NOT DISTINCT FROM get_user_entreprise_id(auth.uid())
);

-- Restrict depenses DELETE to admins only
DROP POLICY IF EXISTS "Role-based depenses delete" ON public.depenses;

CREATE POLICY "Admins can delete depenses"
ON public.depenses
FOR DELETE
USING (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND get_user_role(auth.uid()) = 'admin'
);
