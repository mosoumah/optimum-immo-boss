-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policy for profiles: admins can see all profiles in their entreprise
CREATE POLICY "Users can view profiles in their entreprise"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR
  (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  )
);

-- Create new policy for user_roles: admins can see roles of users in their entreprise
CREATE POLICY "Users can view roles in their entreprise"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  (
    EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
      AND p.entreprise_id = get_user_entreprise_id(auth.uid())
    )
    AND has_role(auth.uid(), 'admin')
  )
);