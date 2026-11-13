-- Contas a pagar/receber nunca viram 'vencido': nenhuma função, cron ou tela grava esse
-- status (busca em pg_proc e em src/ em 13/11), mas o front inteiro o lê — filtro
-- 'Vencido' (src/components/contas-pagar/ContasPagarFilters.tsx:82), totais
-- (useContasPagarLogic.calculos.ts:44, função totais_contas_pagar), tesouraria
-- (src/components/tesouraria/ConsolidacaoMultiCNPJ.tsx:55-62), cliente
-- (ClienteDetailDialog.tsx:79). Em produção havia 6 contas a pagar e 8 a receber
-- 'pendente' com vencimento passado, contadas como 0 vencidas.
-- Efeito: rotina diária marca como 'vencido' o que está 'pendente' com vencimento
-- anterior a hoje (fuso America/Sao_Paulo) e devolve para 'pendente' o que estiver
-- 'vencido' com vencimento de hoje em diante (vencimento editado). Não toca em pago,
-- parcial, cancelado, recebido, em_acordo nem em linhas excluídas (deleted_at).
-- Depende da 20261113181400 (contas_pagar passa a aceitar 'vencido').
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
  UPDATE public.contas_receber SET status = 'vencido'
   WHERE status = 'pendente' AND data_vencimento < v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_venc = ROW_COUNT;
  UPDATE public.contas_receber SET status = 'pendente'
   WHERE status = 'vencido' AND data_vencimento >= v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_volta = ROW_COUNT;
  RETURN jsonb_build_object('data_ref', v_hoje,
    'pagar_vencidas', v_pagar_venc, 'pagar_reabertas', v_pagar_volta,
    'receber_vencidas', v_receber_venc, 'receber_reabertas', v_receber_volta);
END;
$$;

REVOKE ALL ON FUNCTION public.marcar_contas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_contas_vencidas() TO service_role;

-- Diariamente às 03:05 UTC (00:05 em Brasília). Idempotente: recria o job se existir.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'marcar-contas-vencidas') THEN
    PERFORM cron.unschedule('marcar-contas-vencidas');
  END IF;
  PERFORM cron.schedule('marcar-contas-vencidas', '5 3 * * *', 'SELECT public.marcar_contas_vencidas();');
END $$;
