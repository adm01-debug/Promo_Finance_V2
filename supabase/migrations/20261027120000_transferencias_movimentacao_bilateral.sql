-- Transferências: normalização aditiva do drift + movimentação bilateral
--
-- Contexto (auditoria TS-02/TS-05/TS-07 + Devin Review + Codex):
-- 1) O types.ts canônico mostra que em produção `movimentacoes` tem apenas
--    (id, empresa_id, tipo, descricao, valor, data_movimentacao, created_at,
--    deleted_at) — SEM conta_bancaria_id, origem, transferencia_id, created_by.
--    `transferencias` usa user_id/conta_origem_id, sem created_by/movimentacao_id.
-- 2) O trigger versionado fn_transferencia_movimentacao referencia colunas que
--    não existem nesse schema real e criava só a 'saida': o saldo do destino
--    nunca subia; em prod já renomeado, quebraria todo INSERT 'realizado'.
-- 3) Esta migration NORMALIZA de forma aditiva (AI_RULES: nada de RENAME/DROP
--    de coluna): acrescenta as colunas que o fluxo precisa, recria funções e
--    triggers com corpo conhecido — o resultado é determinístico em qualquer
--    um dos estados de drift possíveis.
-- 4) Os lançamentos usam origem='transferencia' e as agregações os excluem —
--    transferência interna movimenta saldo, não é receita nem despesa.
--
-- Idempotente: pode rodar em schema já normalizado sem efeito colateral.

-- 1) transferencias: colunas canônicas aditivas
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS conta_origem_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS movimentacao_id UUID;

DO $$
BEGIN
  -- backfill a partir do nome legado quando ele ainda existe no banco
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    UPDATE public.transferencias
      SET conta_origem_id = conta_bancaria_id
      WHERE conta_origem_id IS NULL;
  END IF;
END $$;

-- 2) movimentacoes: colunas que o fluxo de transferência precisa
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS transferencia_id UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

-- 2a) Schema versionado cria created_by NOT NULL em contas_pagar/
--     contas_receber/notas_fiscais; o schema real de prod usa user_id e não
--     tem created_by. O frontend envia só user_id — num banco de replay a
--     restrição derrubaria todo INSERT. Normaliza: relaxa o NOT NULL onde
--     a coluna legada existir e dá DEFAULT auth.uid() para preservar a
--     autoria exibida pelas views (em prod é no-op).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_pagar'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.contas_pagar ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.contas_pagar ALTER COLUMN created_by SET DEFAULT auth.uid();
    -- preenche a coluna legada com o autor real quando o insert vier com user_id
    UPDATE public.contas_pagar SET created_by = user_id
      WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_receber'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.contas_receber ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.contas_receber ALTER COLUMN created_by SET DEFAULT auth.uid();
    UPDATE public.contas_receber SET created_by = user_id
      WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notas_fiscais'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.notas_fiscais ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.notas_fiscais ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- 3) Saldo: normaliza o gatilho que move contas_bancarias.saldo_atual.
--    DROP + CREATE garante corpo conhecido em qualquer estado de prod
--    (se uma versão quebrada existia, passa a funcionar; se estava OK,
--    fica equivalente). INSERT/UPDATE/DELETE mantêm o saldo consistente —
--    o cancelamento de transferência remove o par de movimentações, então
--    DELETE precisa reverter o efeito.
--    A função é gerada via format() para embutir o instante de criação do
--    gatilho: é o que separa um soft-delete LEGADO (regime antigo não
--    observava UPDATE de deleted_at — nunca estornou; o hard-delete é a
--    última chance de devolver o saldo) de um soft-delete NOVO (já
--    estornado pelo ramo UPDATE — reverter de novo duplicaria o crédito).
DO $cria_fn_saldo$
DECLARE
  v_corte text;
BEGIN
  -- Corte estável entre reaplicações: guardado no COMMENT da própria
  -- função na 1ª instalação. Se o corte fosse regenerado a cada execução,
  -- um soft-delete feito sob o NOVO gatilho seria classificado como
  -- legado numa reaplicação e teria o saldo estornado duas vezes.
  SELECT obj_description(to_regprocedure('public.fn_saldo_movimentacao()')::oid, 'pg_proc')
    INTO v_corte;
  IF v_corte IS NULL OR v_corte !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN
    v_corte := statement_timestamp()::text;
  END IF;
  EXECUTE format($f$
CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
BEGIN
  -- conta_bancaria_id é forjável via PostgREST (a policy de movimentacoes
  -- valida só o empresa_id da própria linha) e este gatilho é SECURITY
  -- DEFINER: sem esta rejeição, uma movimentação apontando para conta de
  -- OUTRO tenant passaria a constar nos totais e no lançamento contábil
  -- sem ter movido saldo algum (o UPDATE escopado abaixo só afetaria 0
  -- linhas). Abortar a escrita é o único comportamento consistente.
  -- IS NOT DISTINCT FROM preserva o par NULL↔NULL de dados legados.
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
     AND NEW.conta_bancaria_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM contas_bancarias cb
       WHERE cb.id = NEW.conta_bancaria_id
         AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
     )
  THEN
    RAISE EXCEPTION 'conta_bancaria_id deve pertencer à mesma empresa da movimentação';
  END IF;

  -- Só linhas ativas (deleted_at IS NULL) movem saldo: exclusão lógica
  -- (useDeleteMovimentacao preenche deleted_at) equivale a estorno.
  IF TG_OP = 'UPDATE' THEN
    -- reverte o efeito da versão anterior (se estava ativa)
    IF OLD.deleted_at IS NULL AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF OLD.deleted_at IS NULL AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    -- reaplica o efeito da versão nova (se ativa)
    IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    END IF;
    -- Estorno contábil do soft-delete: o gatilho contábil só reage a
    -- INSERT — sem este passo o valor volta à conta mas a receita/despesa
    -- fica confirmada no razão. Só lançamentos 'confirmado' são estornados
    -- ('rascunho' continua rascunho, 'cancelado' continua cancelado) e a
    -- marca no histórico identifica o que ESTA transição cancelou —
    -- assim a restauração reconfirma apenas esses, sem promover rascunho
    -- incompleto nem ressuscitar cancelamento anterior.
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'cancelado',
             historico = historico || ' [estornado pela exclusão da movimentação]'
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'confirmado';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'confirmado',
             historico = replace(historico, ' [estornado pela exclusão da movimentação]', '')
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'cancelado'
         AND historico LIKE '%%[estornado pela exclusão da movimentação]%%';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Reversão quando a linha estava ativa OU quando o soft-delete é mais
    -- antigo que este gatilho (o literal embutido = instante da migration): o regime
    -- anterior não observava UPDATE de deleted_at, então essas linhas
    -- nunca estornaram o efeito — sem a reversão o débito ficaria preso
    -- para sempre (p.ex. cancelamento de transferência que remove o par).
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT
  IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$body$;
  $f$, v_corte, v_corte);
  -- persiste o corte para reaplicações futuras (ver DECLARE acima)
  EXECUTE format('COMMENT ON FUNCTION public.fn_saldo_movimentacao() IS %L', v_corte);
END
$cria_fn_saldo$;

DROP TRIGGER IF EXISTS trg_saldo_movimentacao ON public.movimentacoes;
CREATE TRIGGER trg_saldo_movimentacao
  AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_saldo_movimentacao();

-- 4) Trigger bilateral de transferência: 'saida' na origem + 'entrada' no
--    destino; trg_saldo_movimentacao move os saldos. Bilateral interna usa
--    origem='transferencia' (excluída dos totais/lançamentos — não é receita
--    nem despesa). Saída externa (conta_destino_id NULL: pix/ted/boleto para
--    favorecido fora) usa origem='transferencia_externa': é saída real de
--    caixa e PRECISA aparecer nos totais e gerar lançamento contábil.
--    Cancelamento (status='cancelado') remove o par — o gatilho de saldo
--    reverte os efeitos automaticamente.
CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mov_saida_id UUID;
  v_origem UUID;
  v_destino UUID;
  v_autor UUID;
BEGIN
  -- leituras defensivas via to_jsonb: funcionam com ou sem as colunas
  -- legadas/renomeadas no banco de destino.
  v_origem := COALESCE(
    NEW.conta_origem_id,
    (to_jsonb(NEW) ->> 'conta_bancaria_id')::uuid
  );
  v_destino := NEW.conta_destino_id;
  v_autor := COALESCE(
    (to_jsonb(NEW) ->> 'created_by')::uuid,
    (to_jsonb(NEW) ->> 'user_id')::uuid
  );

  -- 'concluido' cobre o estado de drift do schema alternativo.
  IF TG_OP = 'INSERT' AND NEW.status IN ('realizado', 'concluido') THEN
    -- Defesa cross-tenant: a policy de INSERT em transferencias valida só o
    -- papel do usuário; sem esta checagem um cliente poderia apontar
    -- conta_origem_id/conta_destino_id de OUTRA empresa e o gatilho
    -- SECURITY DEFINER mexeria no saldo dela ignorando a RLS.
    IF v_origem IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_origem AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de origem deve pertencer à mesma empresa da transferência';
    END IF;

    -- Saídas externas (pix/ted/boleto_pagamento) usam favorecido externo e
    -- deixam conta_destino_id NULL — a tabela os representa com destino
    -- opcional. O destino interno só é validado quando informado;
    -- exigi-lo abortaria toda transferência externa, que antes criava
    -- apenas a movimentação de saída.
    IF v_destino IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_destino AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de destino deve pertencer à mesma empresa da transferência';
    END IF;

    -- Defesa cross-tenant 2: o próprio empresa_id é forjável — a policy de
    -- INSERT valida só papel. Quando a chamada é de usuário autenticado
    -- (PostgREST), exige que a empresa seja acessível a ele OU que ele seja
    -- admin global (mesma exceção da policy "Empresa-based access" de
    -- transferencias). Service role / migrations (auth.uid() IS NULL) não
    -- passam por essa porta e seguem livres.
    IF auth.uid() IS NOT NULL
       AND to_regprocedure('public.empresa_acessivel(uuid)') IS NOT NULL
       AND NOT public.empresa_acessivel(NEW.empresa_id)
       AND NOT (
         to_regprocedure('public.has_role(uuid,app_role)') IS NOT NULL
         AND public.has_role(auth.uid(), 'admin'::app_role)
       )
    THEN
      RAISE EXCEPTION 'empresa_id deve pertencer a uma empresa acessível ao usuário';
    END IF;

    -- destino NULL = saída para favorecido externo: marcador próprio para
    -- não sumir dos totais nem do razão (ver seção 5).
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor,
            CASE WHEN v_destino IS NULL THEN 'transferencia_externa' ELSE 'transferencia' END)
    RETURNING id INTO v_mov_saida_id;

    -- Destino interno ausente = saída externa (pix/ted/boleto_pagamento):
    -- só a saída é gravada, como no regime anterior.
    IF v_destino IS NOT NULL THEN
      INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
      VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia');
    END IF;

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status IN ('realizado', 'concluido') THEN
    -- Estorna o lançamento da saída externa ANTES de remover a movimentação:
    -- lancamentos_contabeis referencia a movimentação por origem_id sem FK
    -- em cascata e o gatilho contábil só reage a INSERT — sem este passo a
    -- despesa e o crédito bancário ficariam confirmados no razão após o
    -- cancelamento.
    UPDATE public.lancamentos_contabeis
       SET status = 'cancelado'
     WHERE origem = 'financeiro_movimentacao'
       AND origem_id IN (
         SELECT id FROM public.movimentacoes WHERE transferencia_id = NEW.id
       )
       AND status IS DISTINCT FROM 'cancelado';
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transferencia_movimentacao ON public.transferencias;
CREATE TRIGGER trg_transferencia_movimentacao
  AFTER INSERT OR UPDATE ON public.transferencias
  FOR EACH ROW EXECUTE FUNCTION public.fn_transferencia_movimentacao();

-- 5) Lançamento contábil automático: exclui origem='transferencia' — o par
--    bilateral movimenta saldo entre bancos da mesma empresa, não é receita
--    nem despesa; sem a guarda cada transferência geraria D+C espúrios.
--    'transferencia_externa' NÃO entra na guarda: saída para favorecido
--    externo é despesa real e gera partida normalmente.
--    A função é recriada com o mesmo corpo da migration original +
--    early return; se o gatilho trigger_gerar_contabilidade existir no
--    banco, passa a usar este corpo.
--    ORDEM IMPORTA: precisa vir ANTES do backfill (seção 6) — onde o
--    gatilho já existir, inserts de backfill disparariam a versão antiga
--    (sem a guarda) e gerariam lançamentos D+C para cada lado, além de
--    poderem quebrar num schema sem categoria_id/plano_conta_id.
CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    -- Transferência interna não é receita/despesa: sai daqui antes de
    -- criar qualquer lançamento.
    IF NEW.origem = 'transferencia' THEN
        RETURN NEW;
    END IF;

    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    -- 1. Resolve as contrapartidas ANTES do cabeçalho: sem as duas pontas
    -- o lançamento sairia 'confirmado' com uma partida só e desequilibraria
    -- o balancete — sai como 'rascunho' até a conta de despesa existir
    -- (saída externa de transferência não carrega categoria_id).
    -- Busca a conta contábil vinculada à categoria da movimentação
    -- Se não houver categoria direta, tenta buscar via plano_conta_id da movimentação
    -- to_jsonb: categoria_id/plano_conta_id existem no schema versionado mas
    -- não no canônico de prod (types.ts) — sem a leitura defensiva qualquer
    -- INSERT em movimentacoes quebraria com "record NEW has no field" num
    -- banco onde essas colunas nunca existiram.
    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = (to_jsonb(NEW)->>'categoria_id')::uuid),
        (to_jsonb(NEW)->>'plano_conta_id')::uuid
    ) INTO v_conta_contabil_id;

    -- Busca a conta contábil vinculada à conta bancária (Ativo Circulante - Disponibilidades)
    SELECT plano_conta_id INTO v_conta_bancaria_contabil_id
    FROM public.contas_bancarias
    WHERE id = NEW.conta_bancaria_id;

    -- Se não encontrar conta bancária vinculada, usa uma conta padrão de 'Caixa/Bancos' se existir
    IF v_conta_bancaria_contabil_id IS NULL THEN
        SELECT id INTO v_conta_bancaria_contabil_id
        FROM public.plano_contas
        WHERE empresa_id = v_empresa_id AND (codigo LIKE '1.1.1%' OR descricao ILIKE '%Banco%')
        LIMIT 1;
    END IF;

    -- 2. Cria o cabeçalho — 'rascunho' quando falta contrapartida (partida
    -- única não é lançamento balanceado e não pode confirmar no razão).
    INSERT INTO public.lancamentos_contabeis (
        empresa_id,
        data_lancamento,
        historico,
        origem,
        origem_id,
        valor_total,
        status
    ) VALUES (
        v_empresa_id,
        NEW.data_movimentacao,
        v_historico,
        'financeiro_movimentacao',
        NEW.id,
        NEW.valor,
        CASE WHEN v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL
             THEN 'confirmado' ELSE 'rascunho' END
    ) RETURNING id INTO v_lancamento_id;

    -- 4. Cria as partidas dobradas (Débito e Crédito)
    IF NEW.tipo = 'entrada' THEN
        -- Entrada de dinheiro: Débito no Banco, Crédito na Categoria (Receita)
        -- Partida 1: Débito (D) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'D', NEW.valor, 'Entrada em conta bancária');
        END IF;

        -- Partida 2: Crédito (C) na Conta de Receita/Recebível
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'C', NEW.valor, 'Receita reconhecida');
        END IF;

    ELSIF NEW.tipo = 'saida' THEN
        -- Saída de dinheiro: Débito na Categoria (Despesa), Crédito no Banco
        -- Partida 1: Débito (D) na Conta de Despesa/Pagar
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;

        -- Partida 2: Crédito (C) no Banco
        -- Correção sobre o corpo original: creditava a categoria, D e C
        -- ficavam na mesma conta e o razão bancário nunca caía.
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Backfill das transferências concluídas históricas: onde o trigger
--    antigo funcionava só a 'saida' foi gravada (destino nunca creditado);
--    onde estava quebrado o par inteiro falta. Insere o lado ausente por
--    transferência — o gatilho de saldo (seção 3) corrige saldo_atual ao
--    inserir. Idempotente pelo NOT EXISTS por (transferencia_id, tipo).
--    Cobre 'realizado' (CHECK canônico) e 'concluido' (estado de drift do
--    schema alternativo, onde a UI gravava esse status).
--    Saídas externas (conta_destino_id NULL) recebem só a 'saida' — mesma
--    regra do gatilho (seção 4) — e ficam com origem='transferencia_externa'
--    para não desaparecerem dos totais/lançamentos.
--    NOTA: se em prod existirem movimentações de transferência sem
--    transferencia_id que já afetaram o saldo, conferir antes de aplicar —
--    não há evidência inequívoca de pertencimento para adotá-las sem risco
--    de confundir movimentações manuais coincidentes.
DO $$
DECLARE
  v_expr text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    v_expr := 'COALESCE(t.conta_origem_id, t.conta_bancaria_id)';
  ELSE
    v_expr := 't.conta_origem_id';
  END IF;

  -- Saídas externas vivas já gravadas com o marcador interno (versão
  -- anterior do gatilho desta migration): DELETE primeiro e o INSERT abaixo
  -- as recria pelo caminho canônico — id novo, origem='transferencia_externa'
  -- e, o mais importante, o lançamento contábil que um UPDATE não
  -- dispararia (trigger_gerar_contabilidade só reage a INSERT).
  -- Saldo: o DELETE reverte o débito via trg_saldo_movimentacao e o
  -- re-INSERT o reaplica — efeito líquido zero.
  -- Restrições do DELETE: (a) mesmo recorte de status do INSERT abaixo —
  -- uma saída de transferência 'estornado'/'erro' não seria recriada e o
  -- saldo ficaria inflado; (b) sem lançamento existente — recriar uma saída
  -- já contabilizada duplicaria a despesa no razão (lancamentos_contabeis
  -- guarda a movimentação em origem_id, sem FK em cascata).
  DELETE FROM movimentacoes m
  USING transferencias t
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND t.conta_destino_id IS NULL
    AND t.status IN ('realizado', 'concluido')
    AND m.origem = 'transferencia'
    AND m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM lancamentos_contabeis l
      WHERE l.origem = 'financeiro_movimentacao' AND l.origem_id = m.id
    );

  EXECUTE format(
    'INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
     SELECT t.empresa_id, %s, ''saida'', t.descricao, t.valor, t.data_transferencia, t.id,
            CASE WHEN t.conta_destino_id IS NULL THEN ''transferencia_externa'' ELSE ''transferencia'' END
     FROM transferencias t
     WHERE t.status IN (''realizado'', ''concluido'')
       AND %s IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM movimentacoes m
         WHERE m.transferencia_id = t.id AND m.tipo = ''saida''
           -- linha soft-deleted TAMBÉM conta como efeito aplicado: o
           -- gatilho de saldo anterior só reagia a INSERT/DELETE, então
           -- um delete lógico legado nunca devolveu o saldo à origem —
           -- recriar a saída debitaria a conta uma segunda vez
       )',
    v_expr,
    v_expr
  );

  INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
  SELECT t.empresa_id, t.conta_destino_id, 'entrada', t.descricao, t.valor, t.data_transferencia, t.id, 'transferencia'
  FROM transferencias t
  WHERE t.status IN ('realizado', 'concluido')
    AND t.conta_destino_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM movimentacoes m
      WHERE m.transferencia_id = t.id AND m.tipo = 'entrada'
        -- idem à saída: entrada soft-deleted já creditou o destino no
        -- regime antigo e o crédito nunca foi revertido
    );

  -- Reponta transferencias.movimentacao_id das saídas recriadas acima (o id
  -- antigo foi removido no DELETE; convenção: aponta para a 'saida').
  UPDATE transferencias t
  SET movimentacao_id = m.id
  FROM movimentacoes m
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND m.deleted_at IS NULL
    AND t.conta_destino_id IS NULL
    AND (t.movimentacao_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM movimentacoes x WHERE x.id = t.movimentacao_id));

  -- Remarca in-place quem não pode ser recriado: saídas soft-deleted
  -- (deletadas não contabilizam — só corrige o marcador) e saídas que JÁ
  -- têm lançamento contábil (o lançamento fica vinculado ao mesmo id —
  -- recriar duplicaria a despesa). Saídas de transferências em outros
  -- status ('estornado', 'erro', ...) ficam intocadas: recriá-las mudaria
  -- saldo/totais de operações não concluídas.
  UPDATE movimentacoes m
  SET origem = 'transferencia_externa'
  FROM transferencias t
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND t.conta_destino_id IS NULL
    AND m.origem = 'transferencia'
    AND (m.deleted_at IS NOT NULL
         OR EXISTS (
           SELECT 1 FROM lancamentos_contabeis l
           WHERE l.origem = 'financeiro_movimentacao' AND l.origem_id = m.id
         ));
END $$;

-- 7) Agregações de receita/despesa excluem transferências internas.
CREATE OR REPLACE FUNCTION obter_totais_movimentacoes(
  p_start date,
  p_end date,
  p_tipo text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (total_entradas numeric, total_saidas numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS total_saidas
  FROM movimentacoes
  WHERE deleted_at IS NULL
    AND origem IS DISTINCT FROM 'transferencia'
    AND data_movimentacao >= p_start
    AND data_movimentacao <= p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR descricao ILIKE '%' || p_search || '%');
$$;

COMMENT ON FUNCTION obter_totais_movimentacoes IS
  'Agregação server-side dos totais de Movimentações (Entradas/Saídas/Saldo). Exclui origem=transferencia: transferências internas movimentam saldo, não são receita/despesa. origem=transferencia_externa é contada normalmente (saída real a favorecido externo). SECURITY INVOKER: respeita a RLS de movimentacoes por empresa.';

-- 8) Integridade do marcador `origem`: origem='transferencia' esconde a
--    movimentação de obter_totais_movimentacoes e do lançamento contábil, e
--    a coluna é gravável pelo cliente via RLS — um usuário autenticado
--    poderia suprimir uma saída/entrada dos relatórios forjando o marcador.
--    Só os gatilhos SECURITY DEFINER (rodam como o owner, não como papel de
--    API) podem gravá-lo: escrita direta de authenticated/anon é rebaixada
--    para 'manual', mantendo a movimentação visível e contabilizada.
CREATE OR REPLACE FUNCTION public.fn_movimentacao_origem_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Linhas vinculadas a transferência: o marcador é do sistema em AMBAS as
  -- direções — o cliente não pode forjar 'transferencia' (sumiria dos
  -- totais/razão) nem rebaixar para 'manual' (o par interno voltaria a
  -- contar como receita/despesa sem lançamento novo, já que o gatilho
  -- contábil só reage a INSERT). Fora disso, forjar os marcadores em
  -- INSERT/UPDATE comum é igualmente rebaixado.
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' AND OLD.transferencia_id IS NOT NULL THEN
      NEW.origem := OLD.origem;
    ELSIF NEW.origem IN ('transferencia', 'transferencia_externa') THEN
      NEW.origem := 'manual';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- UPDATE OF origem: só dispara quando o cliente altera a coluna — um
-- soft-delete (deleted_at) em movimentação legítima de transferência não
-- toca origem e preserva o marcador.
DROP TRIGGER IF EXISTS trg_movimentacao_origem_guard ON public.movimentacoes;
CREATE TRIGGER trg_movimentacao_origem_guard
  BEFORE INSERT OR UPDATE OF origem ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_movimentacao_origem_guard();
