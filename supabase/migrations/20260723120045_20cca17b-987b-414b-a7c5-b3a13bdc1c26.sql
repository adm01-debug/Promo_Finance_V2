
-- ============================================================
-- Fase 5: Vínculo financeiro NFe ↔ contas_pagar
-- ============================================================

-- Garante unicidade: uma conta_pagar só pode estar vinculada a UMA NFe
CREATE UNIQUE INDEX IF NOT EXISTS uq_nfe_rec_conta_pagar
  ON public.nfe_recebidas(conta_pagar_id)
  WHERE conta_pagar_id IS NOT NULL;

-- ----------------------------------------------------------------
-- 1) Sugerir contas a pagar candidatas para uma NFe
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid)
RETURNS TABLE (
  conta_pagar_id uuid,
  descricao text,
  valor numeric,
  data_vencimento date,
  status text,
  fornecedor_cnpj text,
  fornecedor_nome text,
  score numeric,
  match_motivo text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cnpj text;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
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

REVOKE ALL ON FUNCTION public.nfe_suggest_contas_pagar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nfe_suggest_contas_pagar(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 2) Vincular NFe → conta a pagar (atômico + idempotente)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  SELECT * INTO v_cp FROM public.contas_pagar WHERE id = p_conta_pagar_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar % não encontrada ou removida', p_conta_pagar_id USING ERRCODE = 'no_data_found';
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

REVOKE ALL ON FUNCTION public.nfe_link_conta_pagar(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nfe_link_conta_pagar(uuid, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 3) Desvincular NFe da conta a pagar
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cp uuid;
BEGIN
  UPDATE public.nfe_recebidas
  SET conta_pagar_id = NULL, updated_at = now()
  WHERE id = p_nfe_id
  RETURNING conta_pagar_id INTO v_cp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'conta_pagar_id', v_cp);
END;
$$;

REVOKE ALL ON FUNCTION public.nfe_unlink_conta_pagar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nfe_unlink_conta_pagar(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 4) Criar conta a pagar a partir de uma NFe (atômico)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nfe_create_conta_pagar_from_nfe(
  p_nfe_id uuid,
  p_data_vencimento date DEFAULT NULL,
  p_categoria_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    INSERT INTO public.fornecedores (razao_social, cnpj, user_id)
    VALUES (coalesce(v_nfe.razao_emitente, v_cnpj), v_cnpj, auth.uid())
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

REVOKE ALL ON FUNCTION public.nfe_create_conta_pagar_from_nfe(uuid, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nfe_create_conta_pagar_from_nfe(uuid, date, uuid) TO authenticated, service_role;
