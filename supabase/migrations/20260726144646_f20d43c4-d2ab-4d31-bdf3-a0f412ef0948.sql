-- ============================================================
-- ETAPA 1 — Fundação Contábil (plano de contas + partidas dobradas)
-- ============================================================

-- ---------- PLANO DE CONTAS ----------
ALTER TABLE public.plano_contas
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.plano_contas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS codigo_referencial text,
  ADD COLUMN IF NOT EXISTS nivel integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS aceita_lancamento boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.plano_contas ALTER COLUMN ativo SET DEFAULT true;
ALTER TABLE public.plano_contas ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE UNIQUE INDEX IF NOT EXISTS plano_contas_empresa_codigo_uidx
  ON public.plano_contas (empresa_id, codigo) WHERE empresa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS plano_contas_parent_idx ON public.plano_contas (parent_id);

-- ---------- LANÇAMENTOS ----------
ALTER TABLE public.lancamentos_contabeis
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS competencia date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.lancamentos_contabeis ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.lancamentos_contabeis ALTER COLUMN status SET DEFAULT 'ativo';

CREATE INDEX IF NOT EXISTS lancamentos_contabeis_empresa_data_idx
  ON public.lancamentos_contabeis (empresa_id, data_lancamento);

-- Numeração sequencial por empresa + competência derivada da data
CREATE OR REPLACE FUNCTION public.lancamento_contabil_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  IF NEW.competencia IS NULL THEN NEW.competencia := date_trunc('month', NEW.data_lancamento)::date; END IF;
  IF NEW.numero_lancamento IS NULL THEN
    SELECT COALESCE(MAX(l.numero_lancamento), 0) + 1
      INTO NEW.numero_lancamento
      FROM public.lancamentos_contabeis l
     WHERE l.empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lancamento_contabil_before_insert ON public.lancamentos_contabeis;
CREATE TRIGGER trg_lancamento_contabil_before_insert
  BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.lancamento_contabil_before_insert();

CREATE OR REPLACE FUNCTION public.lancamento_contabil_before_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'encerrado' THEN
    RAISE EXCEPTION 'Lançamento % está encerrado e não pode ser alterado', OLD.numero_lancamento;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lancamento_contabil_before_update ON public.lancamentos_contabeis;
CREATE TRIGGER trg_lancamento_contabil_before_update
  BEFORE UPDATE ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.lancamento_contabil_before_update();

-- ---------- PARTIDAS ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partidas_contabeis' AND column_name = 'conta_contabil_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partidas_contabeis' AND column_name = 'conta_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.partidas_contabeis RENAME COLUMN conta_contabil_id TO conta_id';
  END IF;
END;
$$;

ALTER TABLE public.partidas_contabeis
  ADD COLUMN IF NOT EXISTS historico_complementar text,
  ADD COLUMN IF NOT EXISTS ordem integer;

ALTER TABLE public.partidas_contabeis ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS partidas_contabeis_lancamento_idx ON public.partidas_contabeis (lancamento_id);
CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_idx ON public.partidas_contabeis (conta_id);

-- Validação de partidas dobradas (deferida para o fim da transação)
CREATE OR REPLACE FUNCTION public.validar_partidas_dobradas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lanc uuid := COALESCE(NEW.lancamento_id, OLD.lancamento_id);
  v_debito numeric;
  v_credito numeric;
  v_qtd integer;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN tipo = 'D' THEN valor ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN tipo = 'C' THEN valor ELSE 0 END), 0),
         COUNT(*)
    INTO v_debito, v_credito, v_qtd
    FROM public.partidas_contabeis
   WHERE lancamento_id = v_lanc;

  -- Lançamento removido por completo (estorno/compensação): nada a validar
  IF v_qtd = 0 THEN RETURN NULL; END IF;

  IF v_qtd < 2 THEN
    RAISE EXCEPTION 'Lançamento contábil exige no mínimo 2 partidas (encontradas: %)', v_qtd;
  END IF;

  IF round(v_debito, 2) <> round(v_credito, 2) THEN
    RAISE EXCEPTION 'Partidas desbalanceadas: débitos % ≠ créditos %', round(v_debito, 2), round(v_credito, 2);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_partidas_dobradas ON public.partidas_contabeis;
CREATE CONSTRAINT TRIGGER trg_validar_partidas_dobradas
  AFTER INSERT OR UPDATE OR DELETE ON public.partidas_contabeis
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validar_partidas_dobradas();

-- ---------- RLS por empresa ----------
DROP POLICY IF EXISTS "Owner manage lancamentos" ON public.lancamentos_contabeis;
CREATE POLICY "Lancamentos scoped by empresa"
  ON public.lancamentos_contabeis FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plano_contas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_contabeis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partidas_contabeis TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;
GRANT ALL ON public.lancamentos_contabeis TO service_role;
GRANT ALL ON public.partidas_contabeis TO service_role;