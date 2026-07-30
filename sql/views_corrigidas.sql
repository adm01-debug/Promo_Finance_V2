-- ============================================================
-- Views corrigidas — drop + recreate para garantir schema
-- Execute APÓS sql/tabelas_ausentes_r5.sql
-- ============================================================

-- vw_contas_pagar_painel
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
CREATE VIEW public.vw_contas_pagar_painel AS
SELECT
  cp.id,
  cp.empresa_id,
  cp.fornecedor_id,
  cp.descricao,
  cp.valor AS valor_total,
  cp.data_vencimento,
  cp.data_pagamento,
  cp.status,
  cp.categoria,
  cp.parcela_atual AS parcela,
  cp.total_parcelas,
  cp.fornecedor_nome,
  CASE WHEN cp.status = 'pago' THEN 0
       WHEN cp.data_vencimento < CURRENT_DATE THEN cp.valor ELSE 0 END AS valor_vencido,
  CASE WHEN cp.data_vencimento >= CURRENT_DATE AND cp.status != 'pago' THEN cp.valor ELSE 0 END AS valor_vencimento
FROM public.contas_pagar cp;

-- vw_contas_receber_painel
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE VIEW public.vw_contas_receber_painel AS
SELECT
  cr.id,
  cr.empresa_id,
  cr.cliente_id,
  cr.descricao,
  cr.valor AS valor_total,
  cr.data_vencimento,
  cr.data_recebimento AS data_pagamento,
  cr.status,
  cr.cliente_nome,
  CASE WHEN cr.status = 'recebido' THEN 0
       WHEN cr.data_vencimento < CURRENT_DATE THEN cr.valor ELSE 0 END AS valor_vencido,
  CASE WHEN cr.data_vencimento >= CURRENT_DATE AND cr.status != 'recebido' THEN cr.valor ELSE 0 END AS valor_vencimento
FROM public.contas_receber cr;

-- vw_dre_mensal — faturamento_mensal tem: empresa_id,ano,mes,receita_bruta,valor_impostos,impostos_federais,impostos_municipais,receita_servicos,receita_vendas
DROP VIEW IF EXISTS public.vw_dre_mensal;
CREATE VIEW public.vw_dre_mensal AS
SELECT
  fm.empresa_id,
  fm.ano,
  fm.mes,
  fm.receita_bruta,
  fm.receita_servicos,
  fm.receita_vendas,
  fm.valor_impostos AS total_tributos,
  fm.impostos_federais,
  fm.impostos_municipais,
  ROUND(
    CASE WHEN fm.receita_bruta > 0
      THEN (fm.valor_impostos / fm.receita_bruta * 100)
      ELSE 0 END, 2
  ) AS carga_tributaria_pct
FROM public.faturamento_mensal fm;

-- vw_fluxo_caixa (baseado em movimentacoes — empresa_id disponível)
DROP VIEW IF EXISTS public.vw_fluxo_caixa;
CREATE VIEW public.vw_fluxo_caixa AS
SELECT
  m.empresa_id,
  DATE(m.data_movimentacao) AS data,
  SUM(m.valor) FILTER (WHERE m.tipo = 'credito') AS total_creditos,
  SUM(m.valor) FILTER (WHERE m.tipo = 'debito') AS total_debitos,
  SUM(m.valor) AS saldo_dia
FROM public.movimentacoes m
GROUP BY m.empresa_id, DATE(m.data_movimentacao);

-- vw_saldos_contas
DROP VIEW IF EXISTS public.vw_saldos_contas;
CREATE VIEW public.vw_saldos_contas AS
SELECT
  e.id AS empresa_id,
  cb.id AS conta_bancaria_id,
  cb.banco,
  cb.agencia,
  cb.numero_conta,
  cb.tipo_conta,
  cb.saldo_atual
FROM public.empresas e
JOIN public.contas_bancarias cb ON cb.empresa_id = e.id;

-- vw_dso_aging
DROP VIEW IF EXISTS public.vw_dso_aging;
CREATE VIEW public.vw_dso_aging AS
SELECT
  sub.empresa_id,
  sub.cliente_id,
  sub.cliente_nome,
  SUM(sub.valor) AS valor_total,
  COUNT(*) AS qtd_titulos,
  AVG(sub.dias_vencido) AS dias_vencido_medio,
  sub.faixa_aging
FROM (
  SELECT
    cr.empresa_id,
    cr.cliente_id,
    cr.cliente_nome,
    cr.valor,
    (CURRENT_DATE - cr.data_vencimento)::integer AS dias_vencido,
    CASE
      WHEN (CURRENT_DATE - cr.data_vencimento)::integer <= 30 THEN '0-30'
      WHEN (CURRENT_DATE - cr.data_vencimento)::integer <= 60 THEN '31-60'
      WHEN (CURRENT_DATE - cr.data_vencimento)::integer <= 90 THEN '61-90'
      ELSE '90+'
    END AS faixa_aging
  FROM public.contas_receber cr
  WHERE cr.status != 'recebido'
) sub
GROUP BY sub.empresa_id, sub.cliente_id, sub.cliente_nome, sub.faixa_aging;

-- vw_gastos_centro_custo
DROP VIEW IF EXISTS public.vw_gastos_centro_custo;
CREATE VIEW public.vw_gastos_centro_custo AS
SELECT
  cp.empresa_id,
  cp.categoria,
  DATE_TRUNC('month', cp.data_vencimento) AS mes,
  SUM(cp.valor) AS total_gasto
FROM public.contas_pagar cp
WHERE cp.status = 'pago'
GROUP BY cp.empresa_id, cp.categoria, DATE_TRUNC('month', cp.data_vencimento);

-- vw_metricas_cobranca
DROP VIEW IF EXISTS public.vw_metricas_cobranca;
CREATE VIEW public.vw_metricas_cobranca AS
SELECT
  cr.empresa_id,
  DATE_TRUNC('month', cr.data_vencimento) AS mes,
  COUNT(*) AS total_titulos,
  COUNT(*) FILTER (WHERE cr.status = 'recebido') AS titulos_recebidos,
  COUNT(*) FILTER (WHERE cr.status != 'recebido') AS titulos_pendentes,
  ROUND(
    COUNT(*) FILTER (WHERE cr.status = 'recebido') * 100.0 / NULLIF(COUNT(*), 0), 2
  ) AS taxa_recebimento_pct,
  SUM(cr.valor) AS valor_total,
  SUM(cr.valor) FILTER (WHERE cr.status = 'recebido') AS valor_recebido,
  AVG((COALESCE(cr.data_recebimento, CURRENT_DATE) - cr.data_vencimento)::integer)
    FILTER (WHERE cr.status = 'recebido') AS prazo_medio_recebimento
FROM public.contas_receber cr
GROUP BY cr.empresa_id, DATE_TRUNC('month', cr.data_vencimento);

-- vw_webhooks_recentes
DROP VIEW IF EXISTS public.vw_webhooks_recentes;
CREATE VIEW public.vw_webhooks_recentes AS
SELECT
  wl.id,
  wl.source AS endpoint,
  wl.event_type AS evento,
  wl.status AS status_code,
  wl.created_at,
  wl.error_message,
  wl.attempts
FROM public.webhooks_log wl
ORDER BY wl.created_at DESC
LIMIT 100;
