CREATE OR REPLACE FUNCTION public.get_approved_college_requests()
RETURNS TABLE (
  college_name text,
  city text,
  state text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    college_requests.college_name,
    college_requests.city,
    college_requests.state
  FROM public.college_requests
  WHERE college_requests.status = 'approved'
  ORDER BY college_requests.college_name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_approved_college_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_approved_college_requests() TO anon;
GRANT EXECUTE ON FUNCTION public.get_approved_college_requests() TO authenticated;
