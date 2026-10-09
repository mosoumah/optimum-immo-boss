-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert entreprise" ON public.entreprises;

-- Create a restrictive policy that only allows the signup trigger (via SECURITY DEFINER) to insert
-- Since handle_new_user_signup runs as SECURITY DEFINER, it bypasses RLS
-- Normal users should not be able to insert entreprises manually
-- This policy denies all manual inserts from regular users
CREATE POLICY "Entreprises created via signup only"
  ON public.entreprises FOR INSERT
  TO authenticated
  WITH CHECK (false);