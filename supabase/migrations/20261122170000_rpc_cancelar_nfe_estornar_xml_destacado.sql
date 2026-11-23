-- Etapa 58: cancelamento/evento estorna creditos xml_destacado e marca
-- a nota como cancelada. Regra: creditos de origem 'xml_destacado' so sao
-- validos enquanto a NF-e esta autorizada; cancelamento os invalida.

CREATE OR REPLACE FUNCTION public.cancelar_nfe_estornar_xml_destacado(
  p_nota_id    uuid,
  p_protocolo  text,
  p_chave_acesso text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_empresa_id uuid;
  v_status     text;
  v_estornados integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT empresa_id, status
    INTO v_empresa_id, v_status
    FROM public.notas_fiscais
   WHERE id = p_nota_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'nota_nao_encontrada' USING ERRCODE = '02000';
  END IF;

  IF NOT public.empresa_acessivel(v_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF v_status = 'cancelada' THEN
    RAISE EXCEPTION 'nota_ja_cancelada' USING ERRCODE = '23505';
  END IF;

  -- Zera os campos IBS/CBS destacados no XML e marca como cancelada
  UPDATE public.notas_fiscais
     SET status         = 'cancelada',
         v_bc_ibscbs    = NULL,
         v_ibs          = NULL,
         v_ibs_uf       = NULL,
         v_ibs_mun      = NULL,
         v_cbs          = NULL,
         v_is           = NULL,
         updated_at     = now()
   WHERE id = p_nota_id;

  -- Estorna creditos tributarios de origem xml_destacado (unica vez que
  -- creditos destacados precisam ser invalidados; estimados e manuais
  -- seguem politica propria de estorno e nao sao tocados aqui)
  UPDATE public.creditos_tributarios
     SET status         = 'estornado',
         updated_at     = now()
   WHERE nota_fiscal_id = p_nota_id
     AND origem         = 'xml_destacado'::public.origem_credito_tributario
     AND status        <> 'estornado';

  GET DIAGNOSTICS v_estornados = ROW_COUNT;

  RETURN jsonb_build_object(
    'nota_id',           p_nota_id,
    'protocolo',         p_protocolo,
    'chave_acesso',      p_chave_acesso,
    'creditos_estornados', v_estornados,
    'cancelado_em',      now()
  );
END
$function$;

COMMENT ON FUNCTION public.cancelar_nfe_estornar_xml_destacado(uuid, text, text) IS
  'Cancela a NF-e, zera campos IBS/CBS destacados e estorna creditos de origem xml_destacado (etapa 58).';

REVOKE ALL ON FUNCTION public.cancelar_nfe_estornar_xml_destacado(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_nfe_estornar_xml_destacado(uuid, text, text) TO authenticated, service_role;