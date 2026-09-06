-- Migration: Add 'atrasado' to status_pagamento enum and align contas_pagar.status type
--
-- Context: status_pagamento ENUM created by 20251214170739 lacks 'atrasado'.
-- Views in 20260317125441 use 'atrasado'::status_pagamento which would fail.
-- contas_receber.status is intentionally left as VARCHAR because it uses 'recebido'
-- which is not in the status_pagamento enum; converting it would break view recreations.

-- Add missing value to ENUM (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.status_pagamento'::regtype
      AND enumlabel = 'atrasado'
  ) THEN
    ALTER TYPE public.status_pagamento ADD VALUE 'atrasado';
  END IF;
END
$$;

-- Drop views that depend on contas_pagar.status or contas_receber.status so that
-- ALTER COLUMN TYPE succeeds (PostgreSQL blocks it while views reference the column).
DROP VIEW IF EXISTS public.vw_totals_by_category CASCADE;
DROP VIEW IF EXISTS public.vw_contas_atrasadas CASCADE;
DROP VIEW IF EXISTS public.vw_cash_flow CASCADE;
DROP VIEW IF EXISTS public.vw_monthly_summary CASCADE;

-- contas_pagar.status intentionally left as VARCHAR. Changing it to the ENUM
-- causes SQLSTATE 0A000 because multiple views across later migrations already
-- depend on this column; dropping and recreating all of them is fragile and
-- unnecessary — text comparisons against ENUM values work fine as-is.

-- Recreate dependent views (both contas_pagar.status and contas_receber.status
-- remain VARCHAR, so all text comparisons stay valid).
CREATE OR REPLACE VIEW public.vw_monthly_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', data_vencimento) AS mes,
    'despesa' AS tipo,
    SUM(CASE WHEN status::text = 'pago'     THEN valor ELSE 0 END) AS total_pago,
    SUM(CASE WHEN status::text = 'pendente' THEN valor ELSE 0 END) AS total_pendente,
    SUM(CASE WHEN status::text = 'atrasado' THEN valor ELSE 0 END) AS total_atrasado,
    COUNT(*) AS quantidade
FROM public.contas_pagar
GROUP BY user_id, DATE_TRUNC('month', data_vencimento)
UNION ALL
SELECT
    user_id,
    DATE_TRUNC('month', data_vencimento) AS mes,
    'receita' AS tipo,
    SUM(CASE WHEN status = 'recebido' THEN valor ELSE 0 END) AS total_pago,
    SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS total_pendente,
    SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END) AS total_atrasado,
    COUNT(*) AS quantidade
FROM public.contas_receber
GROUP BY user_id, DATE_TRUNC('month', data_vencimento);

CREATE OR REPLACE VIEW public.vw_cash_flow AS
SELECT
    user_id,
    data_pagamento AS data,
    'saida' AS tipo,
    SUM(valor) AS valor
FROM public.contas_pagar
WHERE status::text = 'pago' AND data_pagamento IS NOT NULL
GROUP BY user_id, data_pagamento
UNION ALL
SELECT
    user_id,
    data_recebimento AS data,
    'entrada' AS tipo,
    SUM(valor) AS valor
FROM public.contas_receber
WHERE status = 'recebido' AND data_recebimento IS NOT NULL
GROUP BY user_id, data_recebimento;

CREATE OR REPLACE VIEW public.vw_contas_atrasadas AS
SELECT
    'pagar' AS tipo_conta,
    cp.id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    CURRENT_DATE - cp.data_vencimento AS dias_atraso,
    f.razao_social AS entidade,
    cp.user_id
FROM public.contas_pagar cp
LEFT JOIN public.fornecedores f ON cp.fornecedor_id = f.id
WHERE cp.status::text = 'atrasado'
UNION ALL
SELECT
    'receber' AS tipo_conta,
    cr.id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    CURRENT_DATE - cr.data_vencimento AS dias_atraso,
    c.nome AS entidade,
    cr.user_id
FROM public.contas_receber cr
LEFT JOIN public.clientes c ON cr.cliente_id = c.id
WHERE cr.status = 'atrasado';

CREATE OR REPLACE VIEW public.vw_totals_by_category AS
SELECT
    user_id,
    categoria,
    'despesa' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM public.contas_pagar
WHERE status::text = 'pago'
GROUP BY user_id, categoria
UNION ALL
SELECT
    user_id,
    categoria,
    'receita' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM public.contas_receber
WHERE status = 'recebido'
GROUP BY user_id, categoria;
