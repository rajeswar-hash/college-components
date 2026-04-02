CREATE OR REPLACE FUNCTION public.toggle_listing_like(listing_id uuid, should_like boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_likes integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.listings
  SET likes = CASE
    WHEN should_like THEN likes + 1
    ELSE GREATEST(likes - 1, 0)
  END
  WHERE id = listing_id
  RETURNING likes INTO updated_likes;

  IF updated_likes IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  RETURN updated_likes;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_listing_like(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_listing_like(uuid, boolean) TO authenticated;
