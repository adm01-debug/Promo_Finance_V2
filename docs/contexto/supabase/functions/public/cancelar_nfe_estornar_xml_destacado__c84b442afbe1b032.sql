CREATE OR REPLACE FUNCTION public.cancelar_nfe_estornar_xml_destacado(p_nota_id uuid, p_protocolo text, p_chave_acesso text DEFAULT NULL::text, p_sefaz_confirmado boolean DEFAULT false)
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

  -- Vínculo ativo apenas permite LER. Cancelar NF-e e estornar crédito é
  -- escrita fiscal: exige papel de escrita (admin/financeiro) na empresa.
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
        FROM public.user_empresas ue
       WHERE ue.user_id = auth.uid()
         AND ue.empresa_id = v_empresa_id
         AND ue.ativo = true
         AND ue.role IN ('admin'::public.app_role, 'financeiro'::public.app_role)
    )
  ) THEN
    RAISE EXCEPTION 'forbidden_escrita' USING ERRCODE = '42501';
  END IF;

  -- Sem protocolo de cancelamento homologado não existe evento fiscal: marcar
  -- a nota como cancelada aqui zeraria crédito legítimo por engano.
  IF p_protocolo IS NULL OR btrim(p_protocolo) = '' THEN
    RAISE EXCEPTION 'protocolo_obrigatorio' USING ERRCODE = '22023';
  END IF;

  IF NOT COALESCE(p_sefaz_confirmado, false) THEN
    RAISE EXCEPTION 'sefaz_nao_confirmado' USING ERRCODE = '22023';
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
  -- seguem politica propria de estorno e nao sao tocados aqui).
  -- Casa por `nota_fiscal_id` OU pela chave do documento: os créditos do
  -- reprocessamento são gravados com `documento_chave` e sem `nota_fiscal_id`,
  -- e antes ficavam fora do estorno.
  UPDATE public.creditos_tributarios
     SET status         = 'estornado',
         updated_at     = now()
   WHERE empresa_id     = v_empresa_id
     AND origem         = 'xml_destacado'::public.origem_credito_tributario
     AND status        <> 'estornado'
     AND (
       nota_fiscal_id = p_nota_id
       OR (
         p_chave_acesso IS NOT NULL
         AND p_chave_acesso <> ''
         AND documento_chave = p_chave_acesso
       )
     );

  GET DIAGNOSTICS v_estornados = ROW_COUNT;

  RETURN jsonb_build_object(
    'nota_id',           p_nota_id,
    'protocolo',         p_protocolo,
    'chave_acesso',      p_chave_acesso,
    'creditos_estornados', v_estornados,
    'cancelado_em',      now()
  );
END
$function$
