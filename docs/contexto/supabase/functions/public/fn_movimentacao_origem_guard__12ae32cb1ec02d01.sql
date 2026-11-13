CREATE OR REPLACE FUNCTION public.fn_movimentacao_origem_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Linhas vinculadas a transferência: o marcador é do sistema em AMBAS as
  -- direções — o cliente não pode forjar 'transferencia' (sumiria dos
  -- totais/razão) nem rebaixar para 'manual' (o par interno voltaria a
  -- contar como receita/despesa sem lançamento novo, já que o gatilho
  -- contábil só reage a INSERT). Fora disso, forjar os marcadores em
  -- INSERT/UPDATE comum é igualmente rebaixado.
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' AND OLD.transferencia_id IS NOT NULL THEN
      -- vínculo imutável: sem isto o cliente poderia NULLar
      -- transferencia_id numa 1ª requisição (fora do UPDATE OF origem) e
      -- rebaixar o marcador na 2ª — a perna inflaria totais e escaparia
      -- do cancelamento, que remove linhas por transferencia_id.
      NEW.origem := OLD.origem;
      NEW.transferencia_id := OLD.transferencia_id;
    ELSIF TG_OP IN ('INSERT', 'UPDATE') AND NEW.transferencia_id IS NOT NULL THEN
      -- o único escritor legítimo do vínculo é o gatilho de
      -- transferências (definer): vínculo forjado pelo cliente é anulado
      -- — também em UPDATE de linha não vinculada (o cancelamento da
      -- transferência apagaria a movimentação forjada e estornaria saldo).
      NEW.transferencia_id := NULL;
    END IF;
    IF NEW.origem IN ('transferencia', 'transferencia_externa')
       AND (TG_OP = 'INSERT' OR OLD.transferencia_id IS NULL) THEN
      NEW.origem := 'manual';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
