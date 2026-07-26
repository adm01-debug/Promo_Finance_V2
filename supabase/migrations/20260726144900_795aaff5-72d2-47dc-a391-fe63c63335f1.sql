-- Normaliza tipo da partida para o padrão D/C usado pela aplicação
CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.tipo := CASE upper(btrim(NEW.tipo))
    WHEN 'D' THEN 'D'
    WHEN 'DEBITO' THEN 'D'
    WHEN 'DÉBITO' THEN 'D'
    WHEN 'C' THEN 'C'
    WHEN 'CREDITO' THEN 'C'
    WHEN 'CRÉDITO' THEN 'C'
    ELSE NULL
  END;
  IF NEW.tipo IS NULL THEN
    RAISE EXCEPTION 'Tipo de partida inválido: use D (débito) ou C (crédito)';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.normalizar_tipo_partida() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.partidas_contabeis DROP CONSTRAINT IF EXISTS partidas_contabeis_tipo_check;

UPDATE public.partidas_contabeis SET tipo = 'D' WHERE tipo IN ('debito', 'DEBITO');
UPDATE public.partidas_contabeis SET tipo = 'C' WHERE tipo IN ('credito', 'CREDITO');

DROP TRIGGER IF EXISTS trg_normalizar_tipo_partida ON public.partidas_contabeis;
CREATE TRIGGER trg_normalizar_tipo_partida
  BEFORE INSERT OR UPDATE ON public.partidas_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.normalizar_tipo_partida();

ALTER TABLE public.partidas_contabeis
  ADD CONSTRAINT partidas_contabeis_tipo_check CHECK (tipo IN ('D', 'C'));

ALTER TABLE public.partidas_contabeis
  ADD CONSTRAINT partidas_contabeis_valor_positivo CHECK (valor > 0);