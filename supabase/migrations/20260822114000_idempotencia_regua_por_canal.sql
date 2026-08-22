-- Uma etapa pode disparar mais de um canal no mesmo dia sem duplicar cada canal.
DROP INDEX IF EXISTS public.uq_execucoes_regua_dia;
CREATE UNIQUE INDEX uq_execucoes_regua_dia
  ON public.execucoes_regua_cobranca (
    conta_receber_id,
    etapa,
    lower(canal),
    ((created_at AT TIME ZONE 'UTC')::date)
  )
  WHERE conta_receber_id IS NOT NULL AND canal IS NOT NULL;
