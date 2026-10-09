
-- Fix 1: Restrict notifications INSERT to only allow users to insert for themselves or via SECURITY DEFINER functions
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix 2: Allow agents to see profiles in their entreprise (for messaging)
DROP POLICY IF EXISTS "Users can view profiles in their entreprise" ON public.profiles;
CREATE POLICY "Users can view profiles in their entreprise" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR (
      entreprise_id = get_user_entreprise_id(auth.uid())
      AND get_user_role(auth.uid()) IN ('admin', 'agent')
    )
  );
