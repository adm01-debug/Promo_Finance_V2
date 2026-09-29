-- ============ Alertas de vencimento ============
DROP FUNCTION IF EXISTS public.gerar_alertas_vencimento();
CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inseridos integer := 0;
BEGIN
  WITH titulos AS (
    SELECT cp.id, cp.empresa_id, cp.descricao AS titulo_desc, cp.valor,
           cp.data_vencimento, 'conta_pagar'::text AS entidade_tipo
    FROM public.contas_pagar cp
    WHERE cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') NOT IN ('pago','cancelado')
      AND cp.data_vencimento <= CURRENT_DATE + 7
    UNION ALL
    SELECT cr.id, cr.empresa_id, COALESCE(cr.numero_documento, 'Título a receber'), cr.valor,
           cr.data_vencimento, 'conta_receber'
    FROM public.contas_receber cr
    WHERE cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') NOT IN ('recebido','pago','cancelado')
      AND cr.data_vencimento <= CURRENT_DATE + 7
  ), destinos AS (
    SELECT t.*, ue.user_id,
      CASE
        WHEN t.data_vencimento < CURRENT_DATE THEN 'critica'
        WHEN t.data_vencimento <= CURRENT_DATE + 3 THEN 'alta'
        ELSE 'media'
      END AS prioridade
    FROM titulos t
    JOIN public.user_empresas ue
      ON ue.empresa_id = t.empresa_id AND COALESCE(ue.ativo, true)
  ), novos AS (
    INSERT INTO public.alertas (user_id, tipo, titulo, mensagem, prioridade, entidade_id, entidade_tipo, acao_url)
    SELECT d.user_id,
           'vencimento',
           CASE WHEN d.data_vencimento < CURRENT_DATE
                THEN 'Título vencido' ELSE 'Vencimento próximo' END,
           format('%s - R$ %s com vencimento em %s',
                  COALESCE(d.titulo_desc, 'Título'),
                  to_char(COALESCE(d.valor, 0), 'FM999G999G990D00'),
                  to_char(d.data_vencimento, 'DD/MM/YYYY')),
           d.prioridade,
           d.id,
           d.entidade_tipo,
           CASE WHEN d.entidade_tipo = 'conta_pagar' THEN '/contas-pagar' ELSE '/contas-receber' END
    FROM destinos d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.alertas a
      WHERE a.user_id = d.user_id
        AND a.entidade_id = d.id
        AND a.tipo = 'vencimento'
        AND a.created_at > now() - INTERVAL '24 hours'
    )
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_inseridos FROM novos;

  RETURN v_inseridos;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.gerar_alertas_vencimento() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_alertas_vencimento() TO service_role;

-- ============ Detecção de duplicidades financeiras ============
DROP FUNCTION IF EXISTS public.detectar_duplicidades_financeiras(uuid, text);
CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(
  p_empresa_id uuid,
  p_tabela text DEFAULT 'contas_pagar'
)
RETURNS TABLE (
  entidade_tipo text,
  contraparte_id uuid,
  numero_documento text,
  valor numeric,
  data_vencimento date,
  ocorrencias bigint,
  valor_total numeric,
  ids uuid[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'empresa_id é obrigatório';
  END IF;
  IF p_tabela NOT IN ('contas_pagar', 'contas_receber') THEN
    RAISE EXCEPTION 'Tabela inválida: %. Use contas_pagar ou contas_receber.', p_tabela;
  END IF;
  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado à empresa informada';
  END IF;

  IF p_tabela = 'contas_pagar' THEN
    RETURN QUERY
    SELECT 'conta_pagar'::text, cp.fornecedor_id, cp.numero_documento, cp.valor,
           cp.data_vencimento::date, count(*)::bigint, sum(cp.valor)::numeric,
           array_agg(cp.id ORDER BY cp.created_at)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
      AND cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') <> 'cancelado'
    GROUP BY cp.fornecedor_id, cp.numero_documento, cp.valor, cp.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cp.valor) DESC;
  ELSE
    RETURN QUERY
    SELECT 'conta_receber'::text, cr.cliente_id, cr.numero_documento, cr.valor,
           cr.data_vencimento::date, count(*)::bigint, sum(cr.valor)::numeric,
           array_agg(cr.id ORDER BY cr.created_at)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
      AND cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') <> 'cancelado'
    GROUP BY cr.cliente_id, cr.numero_documento, cr.valor, cr.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cr.valor) DESC;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(uuid, text) TO authenticated, service_role;

-- ============ Gestão de cron jobs (admin) ============
CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint, is_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem gerenciar tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.alter_job(job_id := job_id, active := is_active);
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.toggle_cron_job(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_cron_job(bigint, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem remover tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.unschedule(v_name);
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_cron_job(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_cron_job(bigint) TO authenticated, service_role;
