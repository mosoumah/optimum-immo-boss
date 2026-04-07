CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _result jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object(
      'user_id', NULL,
      'nom', NULL,
      'email', NULL,
      'entreprise_id', NULL,
      'role', NULL
    );
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.id,
    'nom', p.nom,
    'email', p.email,
    'entreprise_id', p.entreprise_id,
    'role', ur.role
  )
  INTO _result
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  LIMIT 1;

  RETURN COALESCE(
    _result,
    jsonb_build_object(
      'user_id', _user_id,
      'nom', NULL,
      'email', NULL,
      'entreprise_id', NULL,
      'role', NULL
    )
  );
END;
$$;