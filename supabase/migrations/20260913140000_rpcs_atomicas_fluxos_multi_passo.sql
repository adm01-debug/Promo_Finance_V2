-- Etapa 21 — Sequências multi-passo viram uma transação só
--
-- As etapas 16–20 tornaram cada escrita verificável: quando um passo falha, a
-- operação agora falha em vez de reportar sucesso sobre estado parcial. O que
-- nenhuma delas podia resolver do cliente é que a falha do passo 2 não desfaz
-- o passo 1 — o PostgREST abre uma transação por request. O resultado é uma
-- inconsistência visível e recuperável, e não mais silenciosa, mas ainda é uma
-- inconsistência.
--
-- Esta migration move os quatro fluxos em que a consistência é obrigatória
-- para funções Postgres: todos os passos passam a ocorrer na mesma transação e
-- qualquer RAISE desfaz o conjunto inteiro.
--
--   1. confirmar_conciliacao_manual(..., p_metadados)  — sobrecarga de 6 args
--   2. aprovar_solicitacao_pagamento(p_solicitacao_id)
--   3. gerar_darf_retencoes(...)
--   4. pagar_darf_retencoes(p_darf_id, p_data_pagamento)
--   5. registrar_nfe_com_creditos(p_empresa_id, p_nota, p_creditos)
--
-- Exceto a primeira — que continua SECURITY DEFINER porque é chamada pelo
-- proxy `conciliacao-proxy` com service_role, e já valida `user_empresas` no
-- corpo — todas são **SECURITY INVOKER**. Rodando sob o papel do chamador, o
-- isolamento multi-empresa continua sendo o RLS das próprias tabelas: a
-- migration não cria nenhuma superfície nova de bypass de tenant. O que a
-- função acrescenta é a transação e, em cada escrita, um `GET DIAGNOSTICS
-- ROW_COUNT` — o equivalente no servidor ao `exigirLinhas` de
-- `src/lib/supabase-write.ts`, já que um UPDATE barrado pelo RLS também
-- "funciona" e simplesmente não atinge linha alguma.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Conciliação: metadados de compensação dentro da mesma transação
-- ---------------------------------------------------------------------------
-- A versão de 5 args já grava status/conciliada/confirmado_por e o vínculo
-- `contas_receber.transacao_conciliada_id`. O que ficava de fora era o bloco
-- de compensação de centavos (valor, motivo, classificação, regra, evidência)
-- e o `regra_id`, gravados por um UPDATE separado do cliente — depois do
-- commit da RPC. Uma falha ali deixava a transação conciliada sem a
-- justificativa do ajuste, que é exatamente o dado auditável do caso.
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(
  p_transacao_id uuid,
  p_user_id uuid,
  p_conta_pagar_id uuid,
  p_conta_receber_id uuid,
  p_ajuste_centavos numeric,
  p_metadados jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_linhas integer;
BEGIN
  -- Delega toda a validação de tenant e as escritas financeiras à sobrecarga
  -- existente; esta função só acrescenta os metadados na mesma transação.
  PERFORM public.confirmar_conciliacao_manual(
    p_transacao_id,
    p_user_id,
    p_conta_pagar_id,
    p_conta_receber_id,
    COALESCE(p_ajuste_centavos, 0)
  );

  IF p_metadados IS NULL OR p_metadados = '{}'::jsonb THEN
    RETURN;
  END IF;

  UPDATE public.transacoes_bancarias
     SET regra_id = COALESCE((p_metadados ->> 'regra_id')::uuid, regra_id),
         compensacao_valor = COALESCE(
           (p_metadados ->> 'compensacao_valor')::numeric, compensacao_valor
         ),
         compensacao_motivo = COALESCE(
           p_metadados ->> 'compensacao_motivo', compensacao_motivo
         ),
         compensacao_classificacao = COALESCE(
           p_metadados ->> 'compensacao_classificacao', compensacao_classificacao
         ),
         compensacao_regra = COALESCE(
           p_metadados ->> 'compensacao_regra', compensacao_regra
         ),
         compensacao_evidencia_url = COALESCE(
           p_metadados ->> 'compensacao_evidencia_url', compensacao_evidencia_url
         )
   WHERE id = p_transacao_id;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'transacao_nao_atualizada' USING ERRCODE = 'P0002';
  END IF;
END
$function$;

COMMENT ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric, jsonb) IS
  'Conciliação manual + metadados de compensação na mesma transação (Etapa 21). '
  'Chamada apenas pelo proxy conciliacao-proxy com service_role.';

REVOKE ALL ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric, jsonb)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Aprovação de pagamento
-- ---------------------------------------------------------------------------
-- Dois call sites faziam a mesma sequência de dois UPDATEs:
-- src/hooks/expert-actions/financial-actions.ts e
-- src/hooks/useAprovacoes.ts (useAprovarSolicitacao). O segundo ainda na ordem
-- perigosa: encerrava a solicitação antes de gravar o aprovador na conta, de
-- modo que a falha do segundo passo deixava a conta sem aprovador e nada
-- pendente para reprocessar.
CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_pagamento(p_solicitacao_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_conta_pagar_id uuid;
  v_fornecedor text;
  v_linhas integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  -- FOR UPDATE serializa duas aprovações concorrentes da mesma solicitação:
  -- a segunda só enxerga a linha depois do commit da primeira, já fora do
  -- filtro `status = 'pendente'`.
  SELECT s.conta_pagar_id
    INTO v_conta_pagar_id
  FROM public.solicitacoes_aprovacao s
  WHERE s.id = p_solicitacao_id
    AND s.status = 'pendente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'solicitacao_nao_pendente' USING ERRCODE = 'P0002';
  END IF;

  IF v_conta_pagar_id IS NULL THEN
    RAISE EXCEPTION 'solicitacao_sem_conta_pagar' USING ERRCODE = '22023';
  END IF;

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
    'aprovado_por', v_uid
  );
END
$function$;

COMMENT ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) IS
  'Aprova a solicitação e grava o aprovador na conta a pagar na mesma '
  'transação (Etapa 21). SECURITY INVOKER: o isolamento continua no RLS.';

REVOKE ALL ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprovar_solicitacao_pagamento(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Geração de DARF
-- ---------------------------------------------------------------------------
-- O cliente gravava o DARF e depois marcava as retenções. A ordem era
-- deliberada (marcar primeiro e falhar esconderia retenções sem guia emitida),
-- mas o resultado ainda era um DARF emitido com retenções pendentes, que
-- voltariam ao DARF seguinte — recolhimento em duplicidade.
--
-- Além da transação, a função corrige duas coisas que o cliente não tinha como
-- garantir: `valor_principal` passa a ser somado no servidor a partir das
-- próprias retenções (o cliente somava a partir do cache), e só entram
-- retenções com `darf_gerado = false`, o que impede incluir uma retenção que
-- outro DARF já levou.
CREATE OR REPLACE FUNCTION public.gerar_darf_retencoes(
  p_empresa_id uuid,
  p_competencia text,
  p_codigo_receita text,
  p_descricao_receita text,
  p_data_vencimento date,
  p_retencoes_ids uuid[]
)
RETURNS public.darfs
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_ids uuid[];
  v_esperadas integer;
  v_disponiveis integer;
  v_total numeric;
  v_darf public.darfs;
  v_linhas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  -- Ids repetidos fariam a contagem de conferência acusar lote parcial sem
  -- haver problema algum.
  SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(COALESCE(p_retencoes_ids, '{}')) AS x;
  v_esperadas := COALESCE(cardinality(v_ids), 0);

  IF v_esperadas = 0 THEN
    RAISE EXCEPTION 'nenhuma_retencao_selecionada' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.retencoes_fonte r
  WHERE r.id = ANY (v_ids)
  FOR UPDATE;

  SELECT count(*), COALESCE(sum(r.valor_retido), 0)
    INTO v_disponiveis, v_total
  FROM public.retencoes_fonte r
  WHERE r.id = ANY (v_ids)
    AND r.empresa_id = p_empresa_id
    AND COALESCE(r.darf_gerado, false) = false;

  IF v_disponiveis <> v_esperadas THEN
    RAISE EXCEPTION
      'retencoes_indisponiveis: % de % retenções estão disponíveis para esta empresa e ainda sem DARF',
      v_disponiveis, v_esperadas
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.darfs (
    empresa_id, codigo_receita, descricao_receita, competencia,
    valor_principal, valor_multa, valor_juros, valor_total,
    data_vencimento, status, retencoes_ids
  )
  VALUES (
    p_empresa_id, p_codigo_receita, p_descricao_receita, p_competencia,
    v_total, 0, 0, v_total,
    p_data_vencimento, 'gerado', v_ids
  )
  RETURNING * INTO v_darf;

  UPDATE public.retencoes_fonte
     SET darf_gerado = true
   WHERE id = ANY (v_ids);

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> v_esperadas THEN
    RAISE EXCEPTION 'retencoes_nao_marcadas: % de % linhas afetadas', v_linhas, v_esperadas
      USING ERRCODE = '42501';
  END IF;

  RETURN v_darf;
END
$function$;

COMMENT ON FUNCTION public.gerar_darf_retencoes(uuid, text, text, text, date, uuid[]) IS
  'Emite o DARF e marca as retenções na mesma transação (Etapa 21). Soma o '
  'valor no servidor e recusa retenções já incluídas em outro DARF.';

REVOKE ALL ON FUNCTION public.gerar_darf_retencoes(uuid, text, text, text, date, uuid[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gerar_darf_retencoes(uuid, text, text, text, date, uuid[])
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) Pagamento de DARF
-- ---------------------------------------------------------------------------
-- Mesma inconsistência do outro lado: DARF pago e retenções ainda pendentes,
-- que voltariam ao próximo DARF. O filtro `status <> 'pago'` torna a chamada
-- idempotente contra duplo clique.
CREATE OR REPLACE FUNCTION public.pagar_darf_retencoes(
  p_darf_id uuid,
  p_data_pagamento date
)
RETURNS public.darfs
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

  -- DARFs gravados antes da Etapa 21 podem carregar ids repetidos em
  -- `retencoes_ids`; a contagem exata os leria como lote parcial.
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
$function$;

COMMENT ON FUNCTION public.pagar_darf_retencoes(uuid, date) IS
  'Registra o pagamento do DARF e marca as retenções como recolhidas na mesma '
  'transação (Etapa 21). Idempotente: recusa um DARF já pago.';

REVOKE ALL ON FUNCTION public.pagar_darf_retencoes(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pagar_darf_retencoes(uuid, date) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) Importação de NF-e com créditos CBS/IBS
-- ---------------------------------------------------------------------------
-- `notas_fiscais.chave_acesso` é UNIQUE: um crédito que falhava depois da nota
-- gravada deixava a nota travada — reimportar devolvia 23505. A Etapa 19
-- resolveu com um delete compensatório; aqui a nota simplesmente não existe se
-- o crédito não entrar.
--
-- O payload da nota chega como jsonb e é materializado por
-- `jsonb_populate_record`, de modo que a função acompanha a tabela real em vez
-- de uma lista de colunas congelada aqui. Chave que não corresponda a coluna
-- existente aborta a chamada: o modo de falha a evitar é justamente o
-- silencioso, em que o campo seria descartado sem aviso.
CREATE OR REPLACE FUNCTION public.registrar_nfe_com_creditos(
  p_empresa_id uuid,
  p_nota jsonb,
  p_creditos jsonb DEFAULT '[]'::jsonb
)
RETURNS public.notas_fiscais
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_nota public.notas_fiscais;
  v_desconhecidas text;
  v_colunas text;
  v_esperados integer := COALESCE(jsonb_array_length(COALESCE(p_creditos, '[]'::jsonb)), 0);
  v_linhas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_nota IS NULL OR jsonb_typeof(p_nota) <> 'object' THEN
    RAISE EXCEPTION 'nota_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT string_agg(k.chave, ', ' ORDER BY k.chave)
    INTO v_desconhecidas
  FROM jsonb_object_keys(p_nota) AS k(chave)
  WHERE k.chave NOT IN ('id', 'empresa_id')
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'notas_fiscais'
        AND c.column_name = k.chave
    );

  IF v_desconhecidas IS NOT NULL THEN
    RAISE EXCEPTION 'colunas_inexistentes_em_notas_fiscais: %', v_desconhecidas
      USING ERRCODE = '42703';
  END IF;

  -- `id` e `empresa_id` são descartados do payload: o primeiro vem do DEFAULT
  -- da tabela, o segundo do parâmetro já validado contra empresa_acessivel().
  SELECT string_agg(quote_ident(k.chave), ', ' ORDER BY k.chave)
    INTO v_colunas
  FROM jsonb_object_keys(p_nota) AS k(chave)
  WHERE k.chave NOT IN ('id', 'empresa_id');

  IF v_colunas IS NULL THEN
    RAISE EXCEPTION 'nota_sem_campos' USING ERRCODE = '22023';
  END IF;

  -- Os identificadores vêm de quote_ident() sobre nomes já conferidos contra
  -- information_schema acima; os valores seguem parametrizados via USING.
  EXECUTE format(
    'INSERT INTO public.notas_fiscais (empresa_id, %1$s) '
    'SELECT $1, %1$s FROM jsonb_populate_record(NULL::public.notas_fiscais, $2) '
    'RETURNING *',
    v_colunas
  )
  INTO v_nota
  USING p_empresa_id, p_nota;

  IF v_esperados = 0 THEN
    RETURN v_nota;
  END IF;

  INSERT INTO public.creditos_tributarios (
    empresa_id, nota_fiscal_id, tipo_tributo, valor_credito,
    saldo_disponivel, data_origem, competencia_origem, status
  )
  SELECT
    p_empresa_id,
    v_nota.id,
    c.tipo_tributo,
    c.valor_credito,
    COALESCE(c.saldo_disponivel, c.valor_credito),
    c.data_origem,
    c.competencia_origem,
    COALESCE(c.status, 'disponivel')
  FROM jsonb_to_recordset(p_creditos) AS c(
    tipo_tributo text,
    valor_credito numeric,
    saldo_disponivel numeric,
    data_origem date,
    competencia_origem text,
    status text
  );

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> v_esperados THEN
    RAISE EXCEPTION 'creditos_nao_gravados: % de % linhas', v_linhas, v_esperados
      USING ERRCODE = '42501';
  END IF;

  RETURN v_nota;
END
$function$;

COMMENT ON FUNCTION public.registrar_nfe_com_creditos(uuid, jsonb, jsonb) IS
  'Grava a NF-e e seus créditos CBS/IBS na mesma transação (Etapa 21). '
  'Sem crédito não há nota: elimina o delete compensatório do cliente.';

REVOKE ALL ON FUNCTION public.registrar_nfe_com_creditos(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_nfe_com_creditos(uuid, jsonb, jsonb)
  TO authenticated, service_role;

COMMIT;
