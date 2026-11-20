-- Quorum de aprovação por assinaturas (achado #6 do inventário).
--
-- Antes: aprovadores_obrigatorios > 1 na tela era um controle fantasma — a RPC
-- aprovar_solicitacao_pagamento ignorava o quorum e a primeira assinatura
-- aprovava. Agora cada "aprovar" grava uma assinatura em aprovacao_assinaturas
-- e a RPC só aprova de fato quando COUNT(DISTINCT user_id) >= quorum da menor
-- faixa ativa da empresa.
--
-- Regressão zero de comportamento quando quorum = 1 (padrão de hoje): a
-- primeira assinatura já atinge o quorum e o fluxo fica idêntico ao atual.
--
-- DDL de produção → PR aberta aguardando ok do dono (regra 8).

CREATE TABLE IF NOT EXISTS public.aprovacao_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes_aprovacao(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assinado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aprovacao_assinaturas_unica UNIQUE (solicitacao_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_aprovacao_assinaturas_solicitacao
  ON public.aprovacao_assinaturas (solicitacao_id);

ALTER TABLE public.aprovacao_assinaturas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aprovacao_assinaturas' AND policyname='Assinante registra propria assinatura') THEN
    CREATE POLICY "Assinante registra propria assinatura"
      ON public.aprovacao_assinaturas FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aprovacao_assinaturas' AND policyname='Aprovacoes visiveis para envolvidos e admins') THEN
    CREATE POLICY "Aprovacoes visiveis para envolvidos e admins"
      ON public.aprovacao_assinaturas FOR SELECT TO authenticated
      USING (
        auth.uid() = user_id
        OR auth.uid() = (SELECT user_id FROM public.solicitacoes_aprovacao WHERE id = solicitacao_id)
        OR public.has_role(auth.uid(), 'admin')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RPC com quorum
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_pagamento(p_solicitacao_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_conta_pagar_id uuid;
  v_empresa_id uuid;
  v_fornecedor text;
  v_linhas integer;
  v_assinaturas integer;
  v_quorum integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  -- FOR UPDATE serializa aprovações concorrentes da mesma solicitação: a
  -- segunda transação só enxerga a linha depois do commit da primeira, já fora
  -- do filtro `status = 'pendente'` (ou já com o quorum atingido no status
  -- 'aprovado').
  SELECT s.conta_pagar_id, cp.empresa_id
    INTO v_conta_pagar_id, v_empresa_id
  FROM public.solicitacoes_aprovacao s
  LEFT JOIN public.contas_pagar cp ON cp.id = s.conta_pagar_id
  WHERE s.id = p_solicitacao_id
    AND s.status = 'pendente'
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'solicitacao_nao_pendente' USING ERRCODE = 'P0002';
  END IF;

  IF v_conta_pagar_id IS NULL THEN
    RAISE EXCEPTION 'solicitacao_sem_conta_pagar' USING ERRCODE = '22023';
  END IF;

  -- Quorum = aprovadores_obrigatorios da menor faixa ativa da empresa
  -- (mesma regra de leitura do painel de alçada).
  SELECT COALESCE(
    (SELECT cf.aprovadores_obrigatorios
       FROM public.configuracoes_aprovacao cf
      WHERE cf.ativo
        AND (cf.empresa_id IS NULL OR cf.empresa_id = v_empresa_id)
      ORDER BY cf.valor_minimo_aprovacao ASC NULLS LAST
      LIMIT 1),
    1
  ) INTO v_quorum;

  -- Registra a assinatura (idempotente por usuário).
  INSERT INTO public.aprovacao_assinaturas (solicitacao_id, user_id)
  VALUES (p_solicitacao_id, v_uid)
  ON CONFLICT (solicitacao_id, user_id) DO NOTHING;

  SELECT COUNT(DISTINCT user_id)::int
    INTO v_assinaturas
  FROM public.aprovacao_assinaturas
  WHERE solicitacao_id = p_solicitacao_id;

  IF v_assinaturas < v_quorum THEN
    RETURN jsonb_build_object(
      'solicitacao_id', p_solicitacao_id,
      'status', 'pendente',
      'assinaturas', v_assinaturas,
      'quorum', v_quorum
    );
  END IF;

  -- Quorum atingido: aprova de fato, na mesma transação.
  UPDATE public.contas_pagar
     SET aprovado_por = v_uid,
         updated_at = now()
   WHERE id = v_conta_pagar_id
  RETURNING fornecedor_nome INTO v_fornecedor;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'conta_pagar_inacessivel' USING ERRCODE = '42501';
  END IF;

  UPDATE public.solicitacoes_aprovacao
     SET status = 'aprovado',
         aprovado_por = v_uid,
         aprovado_em = now()
   WHERE id = p_solicitacao_id;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'solicitacao_inacessivel' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'solicitacao_id', p_solicitacao_id,
    'conta_pagar_id', v_conta_pagar_id,
    'fornecedor_nome', v_fornecedor,
    'status', 'aprovado',
    'aprovado_por', v_uid,
    'assinaturas', v_assinaturas,
    'quorum', v_quorum
  );
END
$function$;

COMMENT ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) IS
  'Registra assinatura e aprova a solicitação apenas ao atingir o quorum '
  'configurado (achado #6). Quorum = 1 mantém o comportamento anterior. '
  'SECURITY INVOKER + RLS: o isolamento continua nas policies.';

REVOKE ALL ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) TO authenticated, service_role;