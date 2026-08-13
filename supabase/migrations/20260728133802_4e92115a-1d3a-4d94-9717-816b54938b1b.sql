
CREATE OR REPLACE FUNCTION public.get_cobertura_fiscal_uf()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ufs jsonb;
  v_globais jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(x ORDER BY x->>'uf')
  INTO v_ufs
  FROM (
    SELECT jsonb_build_object(
      'uf', u.sigla::text,
      'nome', u.nome,
      'regiao', u.regiao::text,
      'uf_atualizado_em', u.updated_at,
      'aliquotas_internas', COALESCE(ai.total, 0),
      'aliquotas_internas_atualizado_em', ai.ultima,
      'iss_municipios', COALESCE(iss.municipios, 0),
      'iss_registros', COALESCE(iss.total, 0),
      'iss_atualizado_em', iss.ultima,
      'protocolos_st', COALESCE(st.total, 0),
      'protocolos_st_atualizado_em', st.ultima,
      'beneficios_fiscais', COALESCE(bf.total, 0),
      'beneficios_atualizado_em', bf.ultima
    ) AS x
    FROM public.ufs u
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.aliquotas_internas_uf GROUP BY uf
    ) ai ON ai.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total,
             count(DISTINCT codigo_ibge)::int AS municipios,
             max(updated_at) AS ultima
      FROM public.aliquotas_iss_municipal GROUP BY uf
    ) iss ON iss.uf = u.sigla
    LEFT JOIN (
      SELECT su.uf, count(DISTINCT su.protocolo_id)::int AS total, max(p.updated_at) AS ultima
      FROM public.protocolos_st_ufs su
      JOIN public.protocolos_st p ON p.id = su.protocolo_id
      GROUP BY su.uf
    ) st ON st.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.beneficios_fiscais WHERE uf IS NOT NULL GROUP BY uf
    ) bf ON bf.uf = u.sigla
  ) s;

  SELECT jsonb_build_object(
    'cnaes', (SELECT count(*)::int FROM public.cnaes),
    'cnaes_atualizado_em', (SELECT max(updated_at) FROM public.cnaes),
    'ncms', (SELECT count(*)::int FROM public.ncms),
    'ncms_atualizado_em', (SELECT max(updated_at) FROM public.ncms),
    'ncms_st', (SELECT count(*)::int FROM public.ncms WHERE sujeito_st),
    'protocolos_st', (SELECT count(*)::int FROM public.protocolos_st),
    'protocolos_st_ncms', (SELECT count(*)::int FROM public.protocolos_st_ncms),
    'itens_lista_iss', (SELECT count(*)::int FROM public.itens_lista_iss),
    'ufs_total', (SELECT count(*)::int FROM public.ufs)
  ) INTO v_globais;

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'globais', v_globais,
    'ufs', COALESCE(v_ufs, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_cobertura_fiscal_uf() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cobertura_fiscal_uf() TO authenticated, service_role;
