-- SECURITY FIX: RPCs nfe_* sem checagem de posse — IDOR ativo e explorável.
--
-- supabase/functions/nfe-vinculo-proxy/index.ts só valida que o chamador
-- está autenticado (JWT válido), NUNCA verifica se o usuário tem vínculo
-- com a empresa dona da NFe antes de invocar estas 4 RPCs via client
-- service_role (que ignora RLS por completo). As RPCs, por sua vez,
-- também não checavam empresa_id/posse internamente. Resultado: qualquer
-- usuário autenticado do sistema, informando um nfe_id de OUTRA empresa,
-- conseguia:
--   - suggest: ler sugestões de contas_pagar de outra empresa (leitura)
--   - link/unlink: vincular/desvincular NFe de outra empresa a uma
--     contas_pagar arbitrária (escrita cross-tenant)
--   - create_from_nfe: criar uma nova contas_pagar DENTRO de outra
--     empresa, com dados extraídos da NFe alheia (escrita cross-tenant)
-- Diferente dos achados de RLS já corrigidos (que dependiam de GRANT),
-- este é explorável HOJE independente de qualquer policy, porque o
-- caminho é via service_role.
--
-- Corrige na própria função (não só no proxy), para blindar qualquer
-- caminho de chamada presente ou futuro: exige empresa_acessivel() sobre
-- a empresa_id da NFe antes de prosseguir, e em nfe_link_conta_pagar
-- também confere que a contas_pagar pertence à MESMA empresa da NFe.

BEGIN;

CREATE OR REPLACE FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date DEFAULT NULL::date, p_categoria_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_forn_id uuid;
  v_cnpj text;
  v_new_cp uuid;
  v_venc date;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT public.empresa_acessivel(v_nfe.empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta NFe' USING ERRCODE = '42501';
  END IF;

  IF v_nfe.conta_pagar_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', v_nfe.conta_pagar_id);
  END IF;

  IF v_nfe.valor_total IS NULL OR v_nfe.valor_total <= 0 THEN
    RAISE EXCEPTION 'NFe % sem valor_total válido para gerar conta a pagar', p_nfe_id USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  -- Match / cria fornecedor
  SELECT id INTO v_forn_id FROM public.fornecedores
   WHERE regexp_replace(coalesce(cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> ''
   LIMIT 1;

  IF v_forn_id IS NULL AND v_cnpj <> '' THEN
    INSERT INTO public.fornecedores (razao_social, cnpj, empresa_id, user_id)
    VALUES (coalesce(v_nfe.razao_emitente, v_cnpj), v_cnpj, v_nfe.empresa_id, auth.uid())
    RETURNING id INTO v_forn_id;
  END IF;

  v_venc := coalesce(p_data_vencimento, (coalesce(v_nfe.data_emissao, now())::date + INTERVAL '30 days')::date);

  INSERT INTO public.contas_pagar (
    descricao, valor, data_vencimento, status, fornecedor_id, empresa_id,
    numero_documento, categoria_id, metadata, user_id, fornecedor_nome
  )
  VALUES (
    left(concat('NFe ', coalesce(v_nfe.numero, '?'), ' - ', coalesce(v_nfe.razao_emitente, v_cnpj)), 255),
    v_nfe.valor_total,
    v_venc,
    'pendente',
    v_forn_id,
    v_nfe.empresa_id,
    v_nfe.chave_acesso,
    p_categoria_id,
    jsonb_build_object(
      'origem', 'nfe_recebida',
      'nfe_id', p_nfe_id::text,
      'nfe_chave', v_nfe.chave_acesso,
      'nfe_numero', v_nfe.numero,
      'nfe_serie', v_nfe.serie
    ),
    auth.uid(),
    v_nfe.razao_emitente
  )
  RETURNING id INTO v_new_cp;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = v_new_cp, updated_at = now()
  WHERE id = p_nfe_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', v_new_cp, 'fornecedor_id', v_forn_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cp public.contas_pagar%ROWTYPE;
BEGIN
  -- Lock ordenado para evitar deadlock (nfe < conta)
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT public.empresa_acessivel(v_nfe.empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta NFe' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cp FROM public.contas_pagar WHERE id = p_conta_pagar_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar % não encontrada ou removida', p_conta_pagar_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_cp.empresa_id IS DISTINCT FROM v_nfe.empresa_id THEN
    RAISE EXCEPTION 'Conta a pagar % pertence a outra empresa', p_conta_pagar_id USING ERRCODE = '42501';
  END IF;

  -- Idempotente: já vinculada
  IF v_nfe.conta_pagar_id = p_conta_pagar_id THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', p_conta_pagar_id);
  END IF;

  -- NFe já ligada a outra conta
  IF v_nfe.conta_pagar_id IS NOT NULL AND v_nfe.conta_pagar_id <> p_conta_pagar_id THEN
    RAISE EXCEPTION 'NFe já está vinculada à conta %', v_nfe.conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  -- Conta já usada por outra NFe
  IF EXISTS (
    SELECT 1 FROM public.nfe_recebidas nr2
    WHERE nr2.conta_pagar_id = p_conta_pagar_id AND nr2.id <> p_nfe_id
  ) THEN
    RAISE EXCEPTION 'Conta a pagar % já está vinculada a outra NFe', p_conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = p_conta_pagar_id,
      updated_at = now()
  WHERE id = p_nfe_id;

  UPDATE public.contas_pagar
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'nfe_chave', v_nfe.chave_acesso,
        'nfe_id', p_nfe_id::text,
        'nfe_vinculo_em', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ),
      updated_at = now()
  WHERE id = p_conta_pagar_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', p_conta_pagar_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) RETURNS TABLE(conta_pagar_id uuid, descricao text, valor numeric, data_vencimento date, status text, fornecedor_cnpj text, fornecedor_nome text, score numeric, match_motivo text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cnpj text;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT public.empresa_acessivel(v_nfe.empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta NFe' USING ERRCODE = '42501';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  RETURN QUERY
  SELECT
    cp.id,
    cp.descricao::text,
    cp.valor,
    cp.data_vencimento,
    cp.status::text,
    f.cnpj::text,
    coalesce(f.nome_fantasia, f.razao_social)::text,
    -- score: 100 base, +50 se cnpj bate, +30 se valor bate, -0.5 por dia de diferença
    (
      50
      + CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 50 ELSE 0 END
      + CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 30
             WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 15
             ELSE 0 END
      - least(30, abs(extract(day from (cp.data_vencimento::timestamptz - coalesce(v_nfe.data_emissao, now())))) * 0.5)
    )::numeric AS score,
    concat_ws(' | ',
      CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 'CNPJ' END,
      CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 'Valor exato'
           WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 'Valor ~2%' END
    )::text AS match_motivo
  FROM public.contas_pagar cp
  LEFT JOIN public.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.deleted_at IS NULL
    AND cp.status IN ('pendente', 'parcial', 'vencido', 'atrasado')
    AND cp.empresa_id IS NOT DISTINCT FROM v_nfe.empresa_id
    AND NOT EXISTS (
      SELECT 1 FROM public.nfe_recebidas nr2
      WHERE nr2.conta_pagar_id = cp.id AND nr2.id <> p_nfe_id
    )
  ORDER BY score DESC, cp.data_vencimento ASC
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cp uuid;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT public.empresa_acessivel(v_nfe.empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta NFe' USING ERRCODE = '42501';
  END IF;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = NULL, updated_at = now()
  WHERE id = p_nfe_id
  RETURNING conta_pagar_id INTO v_cp;

  RETURN jsonb_build_object('ok', true, 'conta_pagar_id', v_cp);
END;
$$;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902180000','fix_nfe_vinculo_rpcs_sem_escopo')
ON CONFLICT (version) DO NOTHING;
