DROP POLICY IF EXISTS "Admins can delete college requests" ON public.college_requests;

CREATE POLICY "Admins can delete college requests"
ON public.college_requests
FOR DELETE
USING (public.is_admin());
