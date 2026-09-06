-- 1. Enable RLS on tables
ALTER TABLE public.anomalias_detectadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalia_toast_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive policies if any
DROP POLICY IF EXISTS "Public Select" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Public Select" ON public.anomalia_toast_eventos;
DROP POLICY IF EXISTS "Public Select" ON public.centros_custo;
DROP POLICY IF EXISTS "Authenticated can insert anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Authenticated can update anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Authenticated can insert toast eventos" ON public.anomalia_toast_eventos;
DROP POLICY IF EXISTS "auth modify centros_custo" ON public.centros_custo;

-- 3. Create new RLS Policies

-- anomalias_detectadas
CREATE POLICY "Users can view anomalias" ON public.anomalias_detectadas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage anomalias" ON public.anomalias_detectadas
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

-- anomalia_toast_eventos
CREATE POLICY "Users can view their own toast events" ON public.anomalia_toast_eventos
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert toast events" ON public.anomalia_toast_eventos
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- centros_custo
CREATE POLICY "Users can view centros de custo" ON public.centros_custo
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage centros de custo" ON public.centros_custo
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

-- contas_pagar
CREATE POLICY "Users can view contas pagar" ON public.contas_pagar
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage contas pagar" ON public.contas_pagar
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

-- contas_receber
CREATE POLICY "Users can view contas receber" ON public.contas_receber
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage contas receber" ON public.contas_receber
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));


-- 4. Restrict SECURITY DEFINER functions
-- Use oid::regprocedure for full signature (avoids SQLSTATE 42725 when overloads exist)
DO $$
DECLARE
    func_sig text;
BEGIN
    FOR func_sig IN
        SELECT p.oid::regprocedure::text
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM public, anon', func_sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', func_sig);
    END LOOP;
END $$;


-- 5. Improve/Implement RPCs

-- Update has_role to be more robust
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND COALESCE(is_active, true) = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Implement get_cron_jobs
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    jobs jsonb;
BEGIN
    -- Check if pg_cron extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        SELECT jsonb_agg(jsonb_build_object(
            'jobid', jobid,
            'jobname', jobname,
            'schedule', schedule,
            'active', active,
            'command', command
        )) INTO jobs FROM cron.job;
    ELSE
        -- Return mock data if extension is missing
        jobs := '[
            {"jobid": 1, "jobname": "p13-health-score-diario", "schedule": "0 7 * * *", "active": true, "command": "select calculate_health_score()"},
            {"jobid": 2, "jobname": "p13-detectar-anomalias", "schedule": "*/30 * * * *", "active": true, "command": "select detect_anomalias()"}
        ]'::jsonb;
    END IF;
    
    RETURN COALESCE(jobs, '[]'::jsonb);
END;
$$;

-- Implement get_cron_run_history
-- Guard: 42P13 fires when get_cron_run_history(text,integer) exists with TABLE return type
-- (defined in 20260417194817). DROP first to allow return type change to jsonb.
DROP FUNCTION IF EXISTS public.get_cron_run_history(text, integer);
CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text DEFAULT NULL, p_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    runs jsonb;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        SELECT jsonb_agg(t) INTO runs
        FROM (
            SELECT 
                r.jobid,
                j.jobname,
                r.runid,
                r.status,
                r.return_message,
                r.start_time,
                r.end_time
            FROM cron.job_run_details r
            JOIN cron.job j ON r.jobid = j.jobid
            WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
            ORDER BY r.start_time DESC
            LIMIT p_limit
        ) t;
    ELSE
        runs := '[]'::jsonb;
    END IF;
    
    RETURN COALESCE(runs, '[]'::jsonb);
END;
$$;
