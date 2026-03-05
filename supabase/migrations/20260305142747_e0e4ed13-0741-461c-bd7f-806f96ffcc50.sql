CREATE POLICY "Admins can delete revenus"
ON public.revenus
FOR DELETE
TO authenticated
USING (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);