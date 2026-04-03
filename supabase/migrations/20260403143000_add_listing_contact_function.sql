CREATE OR REPLACE FUNCTION public.get_listing_contact(p_listing_id uuid)
RETURNS TABLE (seller_name text, seller_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    profiles.name::text AS seller_name,
    profiles.phone::text AS seller_phone
  FROM public.listings
  JOIN public.profiles ON profiles.id = listings.seller_id
  WHERE listings.id = p_listing_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;
