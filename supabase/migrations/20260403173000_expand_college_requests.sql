ALTER TABLE public.college_requests
ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT '';

ALTER TABLE public.college_requests
ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
