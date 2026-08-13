
-- 1) darfs: add minimal policies (table had RLS enabled without policies = fully locked)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.darfs TO authenticated;
GRANT ALL ON public.darfs TO service_role;

CREATE POLICY "Authenticated users can view darfs"
  ON public.darfs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage darfs"
  ON public.darfs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Tighten "always true" insert policies to authenticated only
DROP POLICY IF EXISTS "Anyone can insert performance logs" ON public.frontend_performance_logs;
CREATE POLICY "Authenticated users can insert performance logs"
  ON public.frontend_performance_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert security logs" ON public.security_audit_logs;
CREATE POLICY "Authenticated users can insert security logs"
  ON public.security_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
