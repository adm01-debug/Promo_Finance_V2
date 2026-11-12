-- Liga de fato a validação de partidas dobradas (débito = crédito).
-- Antes: validar_partidas_dobradas comparava tipo='DEBITO'/'CREDITO', mas a
-- constraint partidas_contabeis_tipo_check só aceita 'debito'/'credito' —
-- somava 0 = 0 e nunca barrava nada (10 de 31 lançamentos estão desbalanceados).
-- Agora: compara em minúsculo e roda como CONSTRAINT TRIGGER adiado para o
-- COMMIT, permitindo gravar débito e crédito em comandos separados na mesma
-- transação. Exclusão do lançamento inteiro (cascade) não é bloqueada.
-- Efeito nos 10 desbalanceados (todos de 28/07/2026, "Lançamento #1..#5",
-- origem nula): continuam como estão; editar um deles só salva se ficar
-- balanceado. Idempotente.
CREATE OR REPLACE FUNCTION public.validar_partidas_dobradas()
 RETURNS trigger LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE v_deb numeric; v_cre numeric; v_lanc uuid := COALESCE(NEW.lancamento_id, OLD.lancamento_id);
BEGIN
  -- Lançamento apagado por inteiro (cascade): nada a validar.
  IF NOT EXISTS (SELECT 1 FROM public.lancamentos_contabeis WHERE id = v_lanc) THEN
    RETURN NULL;
  END IF;
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'debito'), 0),
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'credito'), 0)
  INTO v_deb, v_cre
  FROM public.partidas_contabeis
  WHERE lancamento_id = v_lanc;
  IF ABS(v_deb - v_cre) > 0.01 THEN
    RAISE EXCEPTION 'Partidas não balanceadas no lançamento %: Débitos=% Créditos=%', v_lanc, v_deb, v_cre
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$function$;

-- Validação no COMMIT: permite gravar débito e crédito em comandos separados
-- dentro da mesma transação.
DROP TRIGGER IF EXISTS trg_validar_partidas_dobradas ON public.partidas_contabeis;
CREATE CONSTRAINT TRIGGER trg_validar_partidas_dobradas
  AFTER INSERT OR UPDATE OR DELETE ON public.partidas_contabeis
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validar_partidas_dobradas();
