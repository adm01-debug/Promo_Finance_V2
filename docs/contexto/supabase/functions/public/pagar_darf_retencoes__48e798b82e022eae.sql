CREATE OR REPLACE FUNCTION public.pagar_darf_retencoes(p_darf_id uuid, p_data_pagamento date)
 RETURNS darfs
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_darf public.darfs;
  v_ids uuid[];
  v_esperadas integer;
  v_linhas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  UPDATE public.darfs
     SET status = 'pago',
         data_pagamento = p_data_pagamento,
         updated_at = now()
   WHERE id = p_darf_id
     AND status IS DISTINCT FROM 'pago'
  RETURNING * INTO v_darf;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'darf_nao_pagavel' USING ERRCODE = 'P0002';
  END IF;

  SELECT array_agg(DISTINCT x) INTO v_ids
  FROM unnest(COALESCE(v_darf.retencoes_ids, '{}')) AS x;
  v_esperadas := COALESCE(cardinality(v_ids), 0);

  IF v_esperadas = 0 THEN
    RETURN v_darf;
  END IF;

  UPDATE public.retencoes_fonte
     SET status = 'recolhido',
         data_recolhimento = p_data_pagamento
   WHERE id = ANY (v_ids);

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> v_esperadas THEN
    RAISE EXCEPTION 'retencoes_nao_recolhidas: % de % linhas afetadas', v_linhas, v_esperadas
      USING ERRCODE = '42501';
  END IF;

  RETURN v_darf;
END
$function$
