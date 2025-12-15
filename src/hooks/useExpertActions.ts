import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { generateFluxoCaixaPDF } from '@/lib/pdf-generator';
import { formatCurrency } from '@/lib/formatters';

export type ExpertActionType = 
  | 'criar_alerta'
  | 'gerar_relatorio'
  | 'listar_aprovacoes'
  | 'aprovar_pagamento'
  | 'navegar';

export interface ExpertAction {
  type: ExpertActionType;
  titulo?: string;
  mensagem?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  relatorio?: string;
  id?: string;
  pagina?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

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
        
        default:
          return { success: false, message: 'Ação não reconhecida' };
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao executar ação' 
      };
    }
  };

  const parseActionsFromMessage = (content: string): ExpertAction[] => {
    const actions: ExpertAction[] = [];
    const actionRegex = /\[ACTION\](.*?)\[\/ACTION\]/gs;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      try {
        const actionData = JSON.parse(match[1].trim());
        actions.push(actionData);
      } catch (error) {
        console.error('Erro ao parsear ação:', error);
      }
    }

    return actions;
  };

  const getCleanContent = (content: string): string => {
    return content.replace(/\[ACTION\].*?\[\/ACTION\]/gs, '').trim();
  };

  return { executeAction, parseActionsFromMessage, getCleanContent };
}

async function criarAlerta(
  action: ExpertAction, 
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('alertas').insert({
    tipo: 'expert',
    titulo: action.titulo || 'Alerta do EXPERT',
    mensagem: action.mensagem || '',
    prioridade: action.prioridade || 'media',
    user_id: user?.id,
  });

  if (error) throw error;

  queryClient.invalidateQueries({ queryKey: ['alertas'] });
  queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
  
  toast.success('Alerta criado com sucesso!');
  
  return { 
    success: true, 
    message: `Alerta "${action.titulo}" criado com prioridade ${action.prioridade}` 
  };
}

async function gerarRelatorio(tipo: string): Promise<ActionResult> {
  switch (tipo) {
    case 'fluxo_caixa': {
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('data_vencimento, valor, status')
        .eq('status', 'pendente')
        .order('data_vencimento');

      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('data_vencimento, valor, status')
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      const { data: saldos } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('ativo', true);

      const saldoInicial = saldos?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;

      // Group by date
      const fluxoPorData = new Map<string, { receitas: number; despesas: number }>();
      
      contasReceber?.forEach(c => {
        const data = c.data_vencimento;
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        atual.receitas += Number(c.valor);
        fluxoPorData.set(data, atual);
      });

      contasPagar?.forEach(c => {
        const data = c.data_vencimento;
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        atual.despesas += Number(c.valor);
        fluxoPorData.set(data, atual);
      });

      const sortedDates = Array.from(fluxoPorData.keys()).sort();
      let saldoAcumulado = saldoInicial;
      
      const dados = sortedDates.map(data => {
        const { receitas, despesas } = fluxoPorData.get(data)!;
        saldoAcumulado += receitas - despesas;
        return { data, receitas, despesas, saldo: saldoAcumulado };
      });

      if (dados.length === 0) {
        return { success: false, message: 'Não há dados para gerar o relatório de fluxo de caixa' };
      }

      generateFluxoCaixaPDF(dados, 'Relatório de Fluxo de Caixa - EXPERT');
      toast.success('Relatório de Fluxo de Caixa gerado!');
      
      return { success: true, message: 'Relatório de Fluxo de Caixa gerado com sucesso' };
    }

    case 'contas_pagar': {
      const { data } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('status', 'pendente')
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: false, message: 'Não há contas a pagar pendentes' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      
      return { 
        success: true, 
        message: `Relatório: ${data.length} contas a pagar pendentes, total de ${formatCurrency(total)}`,
        data 
      };
    }

    case 'contas_receber': {
      const { data } = await supabase
        .from('contas_receber')
        .select('*')
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: false, message: 'Não há contas a receber pendentes' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      
      return { 
        success: true, 
        message: `Relatório: ${data.length} contas a receber pendentes/vencidas, total de ${formatCurrency(total)}`,
        data 
      };
    }

    case 'inadimplencia': {
      const hoje = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('contas_receber')
        .select('*, clientes(razao_social, score)')
        .lt('data_vencimento', hoje)
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: true, message: 'Não há títulos em atraso - Excelente!' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      
      return { 
        success: true, 
        message: `Relatório de Inadimplência: ${data.length} títulos vencidos, total de ${formatCurrency(total)}`,
        data 
      };
    }

    default:
      return { success: false, message: `Tipo de relatório "${tipo}" não reconhecido` };
  }
}

async function listarAprovacoes(): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('solicitacoes_aprovacao')
    .select(`
      *,
      contas_pagar (
        id,
        descricao,
        valor,
        fornecedor_nome,
        data_vencimento
      )
    `)
    .eq('status', 'pendente')
    .order('solicitado_em', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return { success: true, message: 'Não há aprovações pendentes no momento.' };
  }

  const lista = data.map((s, i) => {
    const cp = s.contas_pagar;
    return `${i + 1}. **${cp?.fornecedor_nome}** - ${formatCurrency(cp?.valor || 0)} (ID: ${s.id.slice(0, 8)})`;
  }).join('\n');

  return { 
    success: true, 
    message: `**${data.length} aprovações pendentes:**\n\n${lista}`,
    data 
  };
}

async function aprovarPagamento(
  id: string, 
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();

  // Find the solicitation
  const { data: solicitacao, error: findError } = await supabase
    .from('solicitacoes_aprovacao')
    .select('*, contas_pagar(*)')
    .or(`id.ilike.${id}%,id.eq.${id}`)
    .eq('status', 'pendente')
    .single();

  if (findError || !solicitacao) {
    return { success: false, message: `Solicitação ${id} não encontrada ou já processada` };
  }

  // Update solicitation
  const { error: updateError } = await supabase
    .from('solicitacoes_aprovacao')
    .update({
      status: 'aprovado',
      aprovado_por: user?.id,
      aprovado_em: new Date().toISOString(),
    })
    .eq('id', solicitacao.id);

  if (updateError) throw updateError;

  // Update conta_pagar
  await supabase
    .from('contas_pagar')
    .update({
      aprovado_por: user?.id,
      aprovado_em: new Date().toISOString(),
    })
    .eq('id', solicitacao.conta_pagar_id);

  queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
  queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
  queryClient.invalidateQueries({ queryKey: ['aprovacoes-pendentes-count'] });
  
  toast.success('Pagamento aprovado com sucesso!');

  return { 
    success: true, 
    message: `Pagamento para "${solicitacao.contas_pagar?.fornecedor_nome}" aprovado com sucesso!` 
  };
}
