ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_admin = true
WHERE lower(email) = 'rajeswarbind39@gmail.com';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or admins can update all"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;

CREATE POLICY "Listings are viewable by everyone"
ON public.listings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create own listings" ON public.listings;

CREATE POLICY "Users can create own listings"
ON public.listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;

CREATE POLICY "Users or admins can update listings"
ON public.listings
FOR UPDATE
USING (auth.uid() = seller_id OR public.is_admin())
WITH CHECK (auth.uid() = seller_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;

CREATE POLICY "Users or admins can delete listings"
ON public.listings
FOR DELETE
USING (auth.uid() = seller_id OR public.is_admin());
