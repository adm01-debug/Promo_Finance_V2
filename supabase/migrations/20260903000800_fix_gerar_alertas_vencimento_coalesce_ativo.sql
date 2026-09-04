-- Migration 20260903000800
-- PROBLEMA: gerar_alertas_vencimento() usa COALESCE(ue.ativo, true) no CTE "destinos"
-- para selecionar destinatários de alertas de vencimento. Um user_empresas com ativo=NULL
-- recebe alertas mesmo sem ter acesso à empresa (empresa_acessivel() agora falha-fechado).
-- FIX: substituir COALESCE(ue.ativo, true) por ue.ativo = true.

BEGIN;

DROP FUNCTION IF EXISTS public.gerar_alertas_vencimento() CASCADE;
CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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
      ON ue.empresa_id = t.empresa_id AND ue.ativo = true
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
$_$;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260903000800',
  'fix_gerar_alertas_vencimento_coalesce_ativo',
  ARRAY[
    'DROP FUNCTION IF EXISTS public.gerar_alertas_vencimento() CASCADE',
    'CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento() RETURNS integer — substitui COALESCE(ue.ativo, true) por ue.ativo = true no CTE destinos (alinha com empresa_acessivel)'
  ]
)
ON CONFLICT (version) DO NOTHING;
