
-- 1) Tabela de versionamento das cargas de catálogos fiscais
CREATE TABLE IF NOT EXISTS public.catalogos_fiscais_cargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL DEFAULT 'cron' CHECK (origem IN ('cron','manual','ci','migration')),
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','erro','sem_alteracao')),
  checksum text NOT NULL,
  contagens jsonb NOT NULL DEFAULT '{}'::jsonb,
  houve_alteracao boolean NOT NULL DEFAULT false,
  vinculos_normalizados integer NOT NULL DEFAULT 0,
  criticos integer NOT NULL DEFAULT 0,
  duracao_ms integer NOT NULL DEFAULT 0,
  mensagem text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS catalogos_fiscais_cargas_checksum_key
  ON public.catalogos_fiscais_cargas (checksum);
CREATE INDEX IF NOT EXISTS catalogos_fiscais_cargas_last_updated_idx
  ON public.catalogos_fiscais_cargas (last_updated DESC);

GRANT SELECT ON public.catalogos_fiscais_cargas TO authenticated;
GRANT ALL ON public.catalogos_fiscais_cargas TO service_role;

ALTER TABLE public.catalogos_fiscais_cargas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas;
CREATE POLICY "Admins leem cargas de catalogos fiscais"
  ON public.catalogos_fiscais_cargas
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS set_updated_at_catalogos_fiscais_cargas ON public.catalogos_fiscais_cargas;
CREATE TRIGGER set_updated_at_catalogos_fiscais_cargas
  BEFORE UPDATE ON public.catalogos_fiscais_cargas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) Rotina idempotente de recarga/revalidação dos seeds fiscais
CREATE OR REPLACE FUNCTION public.recarregar_seeds_fiscais(p_origem text DEFAULT 'cron')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio timestamptz := clock_timestamp();
  v_contagens jsonb;
  v_checksum text;
  v_vinculos integer := 0;
  v_criticos integer := 0;
  v_health jsonb;
  v_existente public.catalogos_fiscais_cargas%ROWTYPE;
  v_id uuid;
  v_status text;
BEGIN
  IF p_origem NOT IN ('cron','manual','ci','migration') THEN
    RAISE EXCEPTION 'Origem inválida: %', p_origem USING ERRCODE = '22023';
  END IF;

  -- Chamadas manuais exigem papel admin; execuções internas (cron/service_role) seguem.
  IF p_origem = 'manual' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  -- Serializa execuções concorrentes (idempotência sob cron + disparo manual)
  IF NOT pg_try_advisory_xact_lock(hashtext('recarregar_seeds_fiscais')) THEN
    RETURN jsonb_build_object('status','sem_alteracao','mensagem','Recarga já em execução');
  END IF;

  -- 2.1) Normalização idempotente: vincula itens de protocolo ST ao NCM correspondente
  WITH atualizados AS (
    UPDATE public.protocolos_st_ncms pn
       SET ncm_id = n.id,
           updated_at = now()
      FROM public.ncms n
     WHERE pn.ncm_id IS NULL
       AND n.codigo = pn.ncm_codigo
    RETURNING 1
  )
  SELECT count(*)::int INTO v_vinculos FROM atualizados;

  -- 2.2) Revalidação das invariantes (gera/auto-resolve alertas)
  BEGIN
    v_health := public.check_catalogos_tributarios_invariants();
    v_criticos := COALESCE((v_health->>'criticos')::int, 0);
  EXCEPTION WHEN OTHERS THEN
    v_criticos := 0;
    v_health := jsonb_build_object('erro', SQLERRM);
  END;

  -- 2.3) Fotografia determinística do estado dos catálogos
  SELECT jsonb_build_object(
    'ufs', (SELECT count(*) FROM public.ufs),
    'cnaes', (SELECT count(*) FROM public.cnaes),
    'ncms', (SELECT count(*) FROM public.ncms),
    'itens_lista_iss', (SELECT count(*) FROM public.itens_lista_iss),
    'aliquotas_iss_municipal', (SELECT count(*) FROM public.aliquotas_iss_municipal),
    'aliquotas_internas_uf', (SELECT count(*) FROM public.aliquotas_internas_uf),
    'aliquotas_interestaduais', (SELECT count(*) FROM public.aliquotas_interestaduais),
    'protocolos_st', (SELECT count(*) FROM public.protocolos_st),
    'protocolos_st_ufs', (SELECT count(*) FROM public.protocolos_st_ufs),
    'protocolos_st_ncms', (SELECT count(*) FROM public.protocolos_st_ncms),
    'faixas_simples_nacional', (SELECT count(*) FROM public.faixas_simples_nacional),
    'beneficios_fiscais', (SELECT count(*) FROM public.beneficios_fiscais)
  ) INTO v_contagens;

  v_checksum := md5(v_contagens::text);

  SELECT * INTO v_existente
    FROM public.catalogos_fiscais_cargas
   WHERE checksum = v_checksum
   LIMIT 1;

  IF v_existente.id IS NOT NULL THEN
    -- Idempotente: mesmo estado → apenas atualiza a data da última verificação
    UPDATE public.catalogos_fiscais_cargas
       SET last_updated = now(),
           origem = p_origem,
           status = 'sem_alteracao',
           criticos = v_criticos,
           vinculos_normalizados = v_vinculos,
           duracao_ms = (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
     WHERE id = v_existente.id;
    v_id := v_existente.id;
    v_status := 'sem_alteracao';
  ELSE
    INSERT INTO public.catalogos_fiscais_cargas (
      origem, status, checksum, contagens, houve_alteracao,
      vinculos_normalizados, criticos, duracao_ms, mensagem
    ) VALUES (
      p_origem, 'ok', v_checksum, v_contagens, true,
      v_vinculos, v_criticos,
      (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int,
      format('Nova versão dos catálogos fiscais (%s vínculos normalizados)', v_vinculos)
    )
    RETURNING id INTO v_id;
    v_status := 'ok';
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'status', v_status,
    'checksum', v_checksum,
    'contagens', v_contagens,
    'vinculos_normalizados', v_vinculos,
    'criticos', v_criticos,
    'last_updated', now(),
    'duracao_ms', (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recarregar_seeds_fiscais(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recarregar_seeds_fiscais(text) TO authenticated, service_role;

-- 3) Leitura resumida da última carga (admin-only)
CREATE OR REPLACE FUNCTION public.get_ultima_carga_fiscal()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(c) INTO v
    FROM public.catalogos_fiscais_cargas c
   ORDER BY c.last_updated DESC
   LIMIT 1;

  RETURN COALESCE(v, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_ultima_carga_fiscal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ultima_carga_fiscal() TO authenticated, service_role;
