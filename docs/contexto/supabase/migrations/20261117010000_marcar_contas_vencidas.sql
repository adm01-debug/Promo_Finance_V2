-- Rotina diaria que marca contas a pagar/receber vencidas.
--
-- ORIGEM DESTE TRABALHO: a funcao e o cron abaixo foram escritos por outro
-- agente na branch claude/fix-marcar-contas-vencidas-261113-1920 (PR #345,
-- commit 366b6c645, arquivo 20261113192500_marcar_contas_vencidas.sql,
-- md5 65ef054d2461e292cf8474045bb90e85). O corpo da funcao e do cron esta
-- preservado. O que mudou em relacao ao original esta marcado com "ALTERADO:".
-- A outra metade daquela branch, 20261113181400_contas_pagar_status_constraint_unica.sql,
-- ja esta no main, identica byte a byte (md5 f7068fde9a0f9449806a497253ea3bbc).
--
-- ALTERADO 1 — timestamp. O original era 20261113192500, abaixo do maximo do
-- ledger de producao (20261116230000). O gate de .github/workflows/prod-migrate.yml:168-178
-- conta como DIVERGENTE toda migration local com versao <= MAX_REMOTO que nao
-- consta do ledger e aborta o workflow inteiro com exit 1 — nao so este arquivo,
-- mas qualquer migration futura. Renumerado para o fim da fila.
--
-- POR QUE A ROTINA E NECESSARIA: nenhuma funcao, cron ou tela grava 'vencido'
-- hoje. Conferido no canonico em 16/11: fn_verificar_vencidos AUSENTE, nenhum
-- cron de vencidos (so gerar-alertas-vencimento-diario), e 6 contas a pagar +
-- 8 a receber 'pendente' com vencimento passado sendo contadas como zero
-- vencidas. Todo o front le 'vencido' e sempre mostra zero:
-- filtro 'Vencido' (ContasPagarFilters.tsx:82), totais
-- (useContasPagarLogic.calculos.ts:44, totais_contas_pagar), tesouraria
-- (ConsolidacaoMultiCNPJ.tsx:55-62), cliente (ClienteDetailDialog.tsx:79).
--
-- PRE-REQUISITO JA NO MAIN: os consumidores que tratavam "em aberto" como
-- status='pendente' foram corrigidos antes desta rotina existir
-- (balanco patrimonial, relatorios do EXPERT, seletor de cobranca Asaas,
-- alerta de saldo projetado, contadores do consolidado multi-empresa).
--
-- O QUE A ROTINA NAO FAZ, de proposito:
--   Nao toca em 'parcial'. Uma conta parcialmente paga que vence continua
--   'parcial' e nunca entra nos indicadores de atraso, que filtram
--   status='vencido' (totais_contas_pagar/_receber em
--   20260905000200_add_totais_contas_pagar_receber.sql:27-28 e :59-60).
--   Conferido: hoje sao 0 linhas nas duas tabelas. Trocar 'parcial' por
--   'vencido' destruiria a informacao de pagamento parcial, entao a correcao
--   certa e nos agregados (usar data + saldo remanescente), nao aqui.
--   Fica registrado como divida tecnica, nao resolvido.

CREATE OR REPLACE FUNCTION public.marcar_contas_vencidas()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_pagar_venc int; v_pagar_volta int; v_receber_venc int; v_receber_volta int;
BEGIN
  UPDATE public.contas_pagar SET status = 'vencido'
   WHERE status = 'pendente' AND data_vencimento < v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_pagar_venc = ROW_COUNT;
  UPDATE public.contas_pagar SET status = 'pendente'
   WHERE status = 'vencido' AND data_vencimento >= v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_pagar_volta = ROW_COUNT;
  -- ALTERADO 2: 'atrasado' entra na normalizacao do lado a receber.
  -- O trigger update_contas_receber_status (001_create_tables.sql:220-226,286-288)
  -- grava 'atrasado' em qualquer insert/update de linha pendente com data
  -- passada, e a constraint vigente (20260924193300:17-20) aceita esse valor.
  -- Como o UPDATE original selecionava so 'pendente', essas linhas nunca
  -- chegariam a 'vencido' e ficariam fora de todo KPI que filtra por ele.
  -- Em PRODUCAO isso e no-op: conferido, o trigger NAO existe lá (os unicos
  -- triggers de contas_receber sao set_updated_at_* e trg_anexos_sync_empresa,
  -- este AFTER UPDATE OF empresa_id) e ha 0 linhas 'atrasado'. A mudanca serve
  -- a ambiente novo criado a partir da cadeia, onde o trigger existe.
  UPDATE public.contas_receber SET status = 'vencido'
   WHERE status IN ('pendente', 'atrasado') AND data_vencimento < v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_venc = ROW_COUNT;
  UPDATE public.contas_receber SET status = 'pendente'
   WHERE status = 'vencido' AND data_vencimento >= v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_volta = ROW_COUNT;
  RETURN jsonb_build_object('data_ref', v_hoje,
    'pagar_vencidas', v_pagar_venc, 'pagar_reabertas', v_pagar_volta,
    'receber_vencidas', v_receber_venc, 'receber_reabertas', v_receber_volta);
END;
$$

REVOKE ALL ON FUNCTION public.marcar_contas_vencidas() FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.marcar_contas_vencidas() TO service_role

-- Diariamente às 03:05 UTC (00:05 em Brasília). Idempotente: recria o job se existir.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'marcar-contas-vencidas') THEN
    PERFORM cron.unschedule('marcar-contas-vencidas');
  END IF;
  PERFORM cron.schedule('marcar-contas-vencidas', '5 3 * * *', 'SELECT public.marcar_contas_vencidas();');
END $$

-- ALTERADO 3 (acrescimo): a simulacao da regua de cobranca contava so 'pendente'.
-- processar_regua_cobranca, definicao vencedora em
-- 20260902170000_fix_rpcs_security_definer_sem_escopo.sql:45 (nenhum
-- CREATE OR REPLACE posterior em toda a cadeia), calcula total_enfileirados
-- com status = 'pendente'. useReguaCobranca.ts:136-139 mostra essa contagem como
-- "quantas cobrancas seriam disparadas". Depois desta rotina, uma empresa com a
-- carteira toda vencida veria simulacao de ZERO cobrancas, enquanto a execucao
-- real (supabase/functions/executar-regua-cobranca/index.ts:66) processa
-- ['pendente','vencido','parcial','atrasado']. Corpo preservado do original;
-- so o filtro de status da contagem muda.
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(
  p_empresa_id uuid DEFAULT NULL::uuid,
  p_simulate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    result JSONB;
BEGIN
    IF p_empresa_id IS NULL OR NOT public.empresa_acessivel(p_empresa_id) THEN
        RAISE EXCEPTION 'Sem permissão para esta empresa' USING ERRCODE = '42501';
    END IF;

    IF p_simulate THEN
        result := jsonb_build_object(
            'total_enfileirados', (SELECT count(*) FROM public.contas_receber
                                    WHERE status IN ('pendente', 'vencido', 'parcial', 'atrasado')
                                      AND empresa_id = p_empresa_id),
            'message', 'Simulação concluída com base nos títulos em aberto.'
        );
    ELSE
        result := jsonb_build_object(
            'total_enfileirados', 0,
            'message', 'Lógica de produção: disparos agendados.'
        );
    END IF;
    RETURN result;
END;
$function$
