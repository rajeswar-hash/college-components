CREATE TABLE IF NOT EXISTS public.listing_likes (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, user_id)
);

ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_likes'
      AND policyname = 'Users can view own listing likes'
  ) THEN
    CREATE POLICY "Users can view own listing likes"
    ON public.listing_likes
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_likes'
      AND policyname = 'Users can insert own listing likes'
  ) THEN
    CREATE POLICY "Users can insert own listing likes"
    ON public.listing_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_likes'
      AND policyname = 'Users can delete own listing likes'
  ) THEN
    CREATE POLICY "Users can delete own listing likes"
    ON public.listing_likes
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_listing_like(listing_id uuid, should_like boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  updated_likes integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF should_like THEN
    INSERT INTO public.listing_likes (listing_id, user_id)
    VALUES (listing_id, current_user_id)
    ON CONFLICT (listing_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM public.listing_likes
    WHERE listing_likes.listing_id = toggle_listing_like.listing_id
      AND listing_likes.user_id = current_user_id;
  END IF;

  UPDATE public.listings
  SET likes = (
    SELECT COUNT(*)
    FROM public.listing_likes
    WHERE public.listing_likes.listing_id = toggle_listing_like.listing_id
  )
  WHERE public.listings.id = toggle_listing_like.listing_id
  RETURNING likes INTO updated_likes;

  IF updated_likes IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  RETURN updated_likes;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_listing_like(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_listing_like(uuid, boolean) TO authenticated;
