CREATE OR REPLACE FUNCTION public.toggle_listing_report(p_listing_id uuid, p_reason text)
RETURNS TABLE (
  has_reported boolean,
  report_count integer,
  moderation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  existing_report_id uuid;
  next_count integer;
  next_status text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id
  INTO existing_report_id
  FROM public.listing_reports
  WHERE listing_id = p_listing_id
    AND reporter_id = current_user_id
  LIMIT 1;

  IF existing_report_id IS NOT NULL THEN
    DELETE FROM public.listing_reports
    WHERE id = existing_report_id;
    has_reported := false;
  ELSE
    INSERT INTO public.listing_reports (listing_id, reporter_id, reason)
    VALUES (p_listing_id, current_user_id, p_reason)
    ON CONFLICT (listing_id, reporter_id) DO NOTHING;
    has_reported := true;
  END IF;

  SELECT COUNT(*)
  INTO next_count
  FROM public.listing_reports
  WHERE listing_id = p_listing_id;

  next_status := CASE
    WHEN next_count >= 3 THEN 'hidden'
    WHEN next_count > 0 THEN 'flagged'
    ELSE 'active'
  END;

  UPDATE public.listings
  SET
    report_count = next_count,
    moderation_status = next_status,
    hidden_at = CASE WHEN next_count >= 3 THEN now() ELSE NULL END
  WHERE id = p_listing_id;

  report_count := next_count;
  moderation_status := next_status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_listing_report(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_listing_report(uuid, text) TO authenticated;
