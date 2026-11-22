-- ============================================================
-- pgTAP: trigger de conferência de totais IBS/CBS/IS (etapa 35 RT/RFB)
-- ------------------------------------------------------------
-- Cobre:
--   * Nota sem o grupo IBS/CBS/IS preenchido não é afetada
--   * Header = soma dos itens é aceito
--   * Alterar só o item (sem tocar no cabeçalho) revalida a nota e
--     rejeita a divergência (achado do Devin Review na PR #514 — o
--     trigger original só disparava em UPDATE do próprio cabeçalho)
--   * Corrigir o item de volta é aceito
--
-- Como rodar:
--   psql "$DATABASE_URL" -f supabase/tests/sql/notas_fiscais_totais_ibscbs.test.sql
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(5);

CREATE TEMP TABLE _t AS
SELECT gen_random_uuid() AS nota_id;

-- 1) Nota sem totais IBS/CBS/IS não é afetada pelo trigger
SELECT lives_ok(
  $$INSERT INTO public.notas_fiscais (id, numero, serie, chave_acesso, valor_total)
    SELECT nota_id, '_t_ibscbs', '1', 'chave_teste_pgtap_ibscbs', 100
    FROM _t$$,
  'nota sem o grupo IBS/CBS/IS preenchido deve ser aceita'
);

-- 2) Item com v_cbs preenchido é aceito enquanto o header não tem total
SELECT lives_ok(
  $$INSERT INTO public.notas_fiscais_itens
      (nota_fiscal_id, n_item, c_prod, ncm, cfop, v_prod, v_cbs)
    SELECT nota_id, 1, 'PROD1', '12345678', '5102', 100, 9
    FROM _t$$,
  'item com v_cbs = 9 deve ser aceito (header ainda sem total)'
);

-- 3) Header = soma dos itens (9 = 9) é aceito
SELECT lives_ok(
  $$UPDATE public.notas_fiscais
      SET v_cbs = 9
    FROM _t
    WHERE notas_fiscais.id = _t.nota_id$$,
  'header com v_cbs = soma dos itens deve ser aceito'
);

-- 4) Alterar só o item (sem tocar no cabeçalho) deve revalidar e rejeitar
--    a divergência introduzida — achado do Devin Review na PR #514.
SELECT throws_ok(
  $$UPDATE public.notas_fiscais_itens
      SET v_cbs = 12
    FROM _t
    WHERE nota_fiscal_id = _t.nota_id AND n_item = 1$$,
  '22023',
  NULL,
  'alterar só o item para um valor que diverge do header deve ser rejeitado'
);

-- 5) Corrigir o item de volta (9 = 9) é aceito
SELECT lives_ok(
  $$UPDATE public.notas_fiscais_itens
      SET v_cbs = 9
    FROM _t
    WHERE nota_fiscal_id = _t.nota_id AND n_item = 1$$,
  'corrigir o item para bater com o header deve ser aceito'
);

SELECT * FROM finish();

ROLLBACK;
