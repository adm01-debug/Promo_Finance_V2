-- 20260825250000: recriar 6 constraints com definições corretas
-- Motivo: versões originais tinham bugs de regex/range/enum/escala

-- ── C1: cnaes_codigo_formato_chk ────────────────────────────────────
-- Bug: regex '^\d{2}\.\d{2}-\d/\d{2}$' esperava ponto (NN.NN-N/NN)
-- Real: 100% dos dados usam formato NNNN-N/NN sem ponto
ALTER TABLE public.cnaes
  ADD CONSTRAINT cnaes_codigo_formato_chk
  CHECK (codigo ~ '^[0-9]{4}-[0-9]/[0-9]{2}$');

-- ── C2: faixas_simples — corrigir função + add NOT VALID ─────────────
-- Bug fn: chaves UPPERCASE + soma esperada 1.00; dados têm lowercase+100.00
-- Dois formatos históricos coexistem; 14 linhas UPPERCASE genuinamente inválidas
CREATE OR REPLACE FUNCTION public.faixa_simples_reparticao_valida(p_reparticao jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE
SECURITY INVOKER SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE((
    SELECT
      (ABS(SUM(COALESCE(v::numeric,0)) - 100.0) < 0.51)
      OR
      (ABS(SUM(COALESCE(v::numeric,0)) -   1.0) < 0.02)
    FROM jsonb_each_text(p_reparticao) j(k,v)
  ), false);
$$;

ALTER TABLE public.faixas_simples_nacional
  ADD CONSTRAINT faixas_simples_reparticao_soma_chk
  CHECK (faixa_simples_reparticao_valida(reparticao))
  NOT VALID;  -- 14 linhas legacy inválidas (soma 1.09+); protege INSERTs futuros

-- ── C3: protocolos_st_ncms_mva_range_chk ────────────────────────────
-- Bug: <= 3 (impossível — todos os 20 registros têm mva_original=40.0)
-- MVA é percentual livre (40% = 40.0); sem limite superior válido na lei BR
ALTER TABLE public.protocolos_st_ncms
  ADD CONSTRAINT protocolos_st_ncms_mva_range_chk
  CHECK (mva_original IS NULL OR mva_original >= 0);

-- ── C4: elisao_creditos_auditoria — recriada na migration anterior ────
-- CHECK status IN ('pendente','aprovado','rejeitado','em_revisao') — já existe ✅

-- ── C5: elisao_regras_creditos_aliquota_check ───────────────────────
-- Bug: <= 1 (esperava decimal). numeric(5,2) guarda percentuais (5.00..18.00)
ALTER TABLE public.elisao_regras_creditos
  ADD CONSTRAINT elisao_regras_creditos_aliquota_check
  CHECK (aliquota IS NULL OR (aliquota >= 0 AND aliquota <= 100));

-- ── C6: elisao_tarefas_acionaveis — recriada na migration anterior ────
-- CHECK bitrix_sync_status IN (..., 'pendente') — já existe ✅
