DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;

CREATE POLICY "Authenticated users can insert rate limit logs"
ON public.rate_limit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);