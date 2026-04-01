## Permanent Account Deletion Setup

The app now includes a `Delete Account` button in the user dashboard.

To make permanent deletion work in Supabase, run this SQL in your current project:

```sql
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users
  WHERE id = current_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
```

What it does:

- Deletes the signed-in user from `auth.users`
- Automatically removes linked `profiles` and `listings` rows through cascade delete
- Signs the user out in the app after deletion
