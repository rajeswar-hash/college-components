ALTER TABLE public.college_requests
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.college_requests
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

DROP POLICY IF EXISTS "Admins can update college requests" ON public.college_requests;
CREATE POLICY "Admins can update college requests"
ON public.college_requests
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());
