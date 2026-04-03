CREATE TABLE IF NOT EXISTS public.college_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  requester_name text NOT NULL DEFAULT '',
  requester_email text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.college_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can request colleges" ON public.college_requests;
CREATE POLICY "Anyone can request colleges"
ON public.college_requests
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view college requests" ON public.college_requests;
CREATE POLICY "Only admins can view college requests"
ON public.college_requests
FOR SELECT
USING (public.is_admin());
