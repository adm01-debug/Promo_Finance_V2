import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// Re-export types
export type { ExpertActionType, ExpertAction, ActionResult } from './expert-actions/types';

// Import action modules
import { gerarRelatorio } from './expert-actions/report-actions';
import { criarAlerta, listarAprovacoes, aprovarPagamento, criarContaPagar, criarContaReceber, agendarCobranca, atualizarScoreCliente, gerarBoleto } from './expert-actions/financial-actions';
import { consultarSaldos, consultarCliente, consultarFornecedor, analisarFluxo, consultarVencimentos } from './expert-actions/query-actions';
import type { ExpertAction, ActionResult } from './expert-actions/types';

export function useExpertActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const executeAction = async (action: ExpertAction): Promise<ActionResult> => {
    try {
      switch (action.type) {
        case 'criar_alerta':
          return await criarAlerta(action, queryClient);
        case 'gerar_relatorio':
          return await gerarRelatorio(action.relatorio || 'fluxo_caixa');
        case 'listar_aprovacoes':
          return await listarAprovacoes();
        case 'aprovar_pagamento':
          return await aprovarPagamento(action.id || '', queryClient);
        case 'navegar':
          navigate(action.pagina || '/');
          return { success: true, message: `Navegando para ${action.pagina}` };
        case 'consultar_saldos':
          return await consultarSaldos();
        case 'criar_conta_pagar':
          return await criarContaPagar(action, queryClient);
        case 'criar_conta_receber':
          return await criarContaReceber(action, queryClient);
        case 'consultar_cliente':
          return await consultarCliente(action.cliente_nome || '');
        case 'consultar_fornecedor':
          return await consultarFornecedor(action.fornecedor_nome || '');
        case 'analisar_fluxo':
          return await analisarFluxo(action.periodo || '30');
        case 'agendar_cobranca':
          return await agendarCobranca(action.id || '');
        case 'consultar_vencimentos':
          return await consultarVencimentos(action.periodo || '7');
        case 'gerar_boleto':
          return await gerarBoleto(action.id || '');
        case 'atualizar_score_cliente':
          return await atualizarScoreCliente(action.id || '', action.novo_score || 0, queryClient);
        default:
          return { success: false, message: 'Ação não reconhecida' };
      }
    } catch (error: unknown) {
      logger.error('Erro ao executar ação:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Erro ao executar ação' };
    }
  };

  const parseActionsFromMessage = (content: string): ExpertAction[] => {
    const actions: ExpertAction[] = [];
    const actionRegex = /\[ACTION\](.*?)\[\/ACTION\]/gs;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      try { actions.push(JSON.parse(match[1].trim())); } catch { /* ignore */ }
    }
    return actions;
  };

  const getCleanContent = (content: string): string => {
    return content.replace(/\[ACTION\].*?\[\/ACTION\]/gs, '').trim();
  };

  return { executeAction, parseActionsFromMessage, getCleanContent };
}
