CREATE OR REPLACE FUNCTION public.admin_delete_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admin accounts cannot delete themselves from member snapshot';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = target_user_id
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted from member snapshot';
  END IF;

  DELETE FROM auth.users
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(uuid) TO authenticated;
