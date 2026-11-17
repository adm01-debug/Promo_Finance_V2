-- Contabilização automática de movimentações financeiras (regras do usuário).
--
-- Problemas corrigidos:
--  1. `partidas_contabeis` tem duas colunas de conta: `conta_contabil_id` (FK para
--     plano_contas, lida pelos demonstrativos e pelo livro razão) e `conta_id`
--     (sem FK, gravada pela tela de lançamentos e lida pelo balancete). Cada
--     caminho gravava numa e lia de outra. Agora as duas ficam sempre iguais.
--  2. Tipo da partida chegava como 'D'/'C' (contabilizar-evento) e era recusado
--     pela constraint ('debito'/'credito'). Normalização passa a aceitar
--     D/C/DEBITO/CREDITO/débito/crédito.
--  3. Nenhuma movimentação virava lançamento: o trigger antigo
--     (gerar_lancamento_contabil_automatico) estava desligado e gravava em
--     colunas inexistentes. Substituído por contabilizar_movimentacao(), que
--     aplica as regras de "Contabilização automática" (mesma lógica da edge
--     function contabilizar-evento) dentro da própria transação.
--
-- Garantias: idempotente por movimentação; transferências ignoradas; falha na
-- contabilização NUNCA bloqueia a gravação da movimentação (vai para o log).

-- 1) Conta da partida: sincroniza conta_id <-> conta_contabil_id
CREATE OR REPLACE FUNCTION public.sincronizar_conta_partida()
 RETURNS trigger LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.conta_contabil_id := COALESCE(NEW.conta_contabil_id, NEW.conta_id);
  NEW.conta_id := COALESCE(NEW.conta_id, NEW.conta_contabil_id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sincronizar_conta_partida ON public.partidas_contabeis;
CREATE TRIGGER trg_sincronizar_conta_partida
  BEFORE INSERT OR UPDATE OF conta_id, conta_contabil_id ON public.partidas_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_conta_partida();

UPDATE public.partidas_contabeis
   SET conta_id = conta_contabil_id
 WHERE conta_id IS NULL AND conta_contabil_id IS NOT NULL;

-- 2) Tipo da partida: aceita abreviações e acentos
CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
 RETURNS trigger LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- A constraint partidas_contabeis_tipo_check só aceita 'debito'/'credito'.
  IF NEW.tipo IS NOT NULL THEN
    NEW.tipo := CASE LOWER(BTRIM(NEW.tipo))
      WHEN 'd' THEN 'debito'   WHEN 'débito' THEN 'debito'
      WHEN 'c' THEN 'credito'  WHEN 'crédito' THEN 'credito'
      ELSE LOWER(BTRIM(NEW.tipo))
    END;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Contabilização automática de movimentações
CREATE OR REPLACE FUNCTION public.contabilizar_movimentacao()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_categoria uuid;
  v_regra public.regras_contabilizacao_automatica%ROWTYPE;
  v_lanc uuid;
  v_hist text;
BEGIN
  IF NEW.deleted_at IS NOT NULL OR NEW.transferencia_id IS NOT NULL
     OR NEW.origem = 'transferencia' OR NEW.empresa_id IS NULL
     OR COALESCE(NEW.valor, 0) <= 0 THEN
    RETURN NULL;
  END IF;

  -- Idempotência: uma movimentação gera no máximo um lançamento.
  IF EXISTS (SELECT 1 FROM public.lancamentos_contabeis
              WHERE origem = 'movimentacao' AND origem_id = NEW.id) THEN
    RETURN NULL;
  END IF;

  BEGIN
    SELECT COALESCE(
             (SELECT categoria_id FROM public.contas_pagar   WHERE id = NEW.conta_pagar_id),
             (SELECT categoria_id FROM public.contas_receber WHERE id = NEW.conta_receber_id))
      INTO v_categoria;

    -- Mesma escolha da edge function: regra da categoria; senão regra genérica.
    SELECT * INTO v_regra
      FROM public.regras_contabilizacao_automatica r
     WHERE r.empresa_id = NEW.empresa_id AND r.tipo_evento = 'movimentacao' AND r.ativo
       AND (r.categoria_id = v_categoria OR r.categoria_id IS NULL)
     ORDER BY (r.categoria_id IS NOT NULL AND r.categoria_id = v_categoria) DESC,
              r.prioridade ASC NULLS LAST, r.created_at
     LIMIT 1;

    IF NOT FOUND THEN
      INSERT INTO public.eventos_contabilizacao_log
        (empresa_id, tipo_evento, evento, evento_id, status, detalhe)
      VALUES (NEW.empresa_id, 'movimentacao', 'movimentacao.criada', NEW.id,
              'sem_regra', 'Nenhuma regra ativa encontrada');
      RETURN NULL;
    END IF;

    v_hist := replace(replace(replace(v_regra.historico_template,
                '{descricao}', COALESCE(NEW.descricao, '')),
                '{valor}', to_char(NEW.valor, 'FM999999999990.00')),
                '{data}', NEW.data_movimentacao::date::text);

    INSERT INTO public.lancamentos_contabeis
      (empresa_id, data_lancamento, historico, origem, origem_id, valor_total, status, created_by)
    VALUES (NEW.empresa_id, NEW.data_movimentacao::date, v_hist, 'movimentacao', NEW.id,
            NEW.valor, 'confirmado', NEW.created_by)
    RETURNING id INTO v_lanc;

    INSERT INTO public.partidas_contabeis
      (lancamento_id, empresa_id, conta_contabil_id, tipo, valor, historico_complementar, ordem)
    VALUES
      (v_lanc, NEW.empresa_id, v_regra.conta_debito_id,  'debito',  NEW.valor, v_hist, 1),
      (v_lanc, NEW.empresa_id, v_regra.conta_credito_id, 'credito', NEW.valor, v_hist, 2);

    INSERT INTO public.eventos_contabilizacao_log
      (empresa_id, tipo_evento, evento, evento_id, regra_id, lancamento_id, status)
    VALUES (NEW.empresa_id, 'movimentacao', 'movimentacao.criada', NEW.id,
            v_regra.id, v_lanc, 'sucesso');
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear a movimentação financeira por causa da contabilidade.
    INSERT INTO public.eventos_contabilizacao_log
      (empresa_id, tipo_evento, evento, evento_id, regra_id, status, detalhe)
    VALUES (NEW.empresa_id, 'movimentacao', 'movimentacao.criada', NEW.id,
            v_regra.id, 'erro', left(SQLERRM, 500));
  END;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.contabilizar_movimentacao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_contabilizar_movimentacao ON public.movimentacoes;
CREATE TRIGGER trg_contabilizar_movimentacao
  AFTER INSERT ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.contabilizar_movimentacao();

-- Trigger antigo: desligado, gravava em colunas inexistentes.
-- Num banco recriado do zero o gatilho trigger_gerar_contabilidade
-- (20260509132924:89) ainda depende da funcao neste ponto da cadeia, e o DROP
-- sem CASCADE falha. Em producao esse gatilho nao existe: o comando e no-op.
DROP TRIGGER IF EXISTS trigger_gerar_contabilidade ON public.movimentacoes;
DROP FUNCTION IF EXISTS public.gerar_lancamento_contabil_automatico();
