import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { generateFluxoCaixaPDF } from '@/lib/pdf-generator';
import { formatCurrency } from '@/lib/formatters';
import { logger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

type TipoCobranca = Database['public']['Enums']['tipo_cobranca'];
type EtapaCobranca = Database['public']['Enums']['etapa_cobranca'];

export type ExpertActionType = 
  | 'criar_alerta'
  | 'gerar_relatorio'
  | 'listar_aprovacoes'
  | 'aprovar_pagamento'
  | 'navegar'
  // Novas ações expandidas
  | 'consultar_saldos'
  | 'criar_conta_pagar'
  | 'criar_conta_receber'
  | 'consultar_cliente'
  | 'consultar_fornecedor'
  | 'analisar_fluxo'
  | 'agendar_cobranca'
  | 'consultar_vencimentos'
  | 'gerar_boleto'
  | 'atualizar_score_cliente';

export interface ExpertAction {
  type: ExpertActionType;
  titulo?: string;
  mensagem?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  relatorio?: string;
  id?: string;
  pagina?: string;
  // Novos parâmetros
  valor?: number;
  cliente_nome?: string;
  fornecedor_nome?: string;
  descricao?: string;
  data_vencimento?: string;
  tipo_cobranca?: string;
  periodo?: string;
  novo_score?: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
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
        
        // Novas ações expandidas
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
      } catch {
        // Silently ignore parsing errors for non-action content
      }
    }

    return actions;
  };

  const getCleanContent = (content: string): string => {
    return content.replace(/\[ACTION\].*?\[\/ACTION\]/gs, '').trim();
  };

  return { executeAction, parseActionsFromMessage, getCleanContent };
}

// Funções auxiliares existentes
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

  const { data: solicitacao, error: findError } = await supabase
    .from('solicitacoes_aprovacao')
    .select('*, contas_pagar(*)')
    .or(`id.ilike.${id}%,id.eq.${id}`)
    .eq('status', 'pendente')
    .maybeSingle();

  if (findError || !solicitacao) {
    return { success: false, message: `Solicitação ${id} não encontrada ou já processada` };
  }

  const { error: updateError } = await supabase
    .from('solicitacoes_aprovacao')
    .update({
      status: 'aprovado',
      aprovado_por: user?.id,
      aprovado_em: new Date().toISOString(),
    })
    .eq('id', solicitacao.id);

  if (updateError) throw updateError;

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

// ============ NOVAS AÇÕES EXPANDIDAS ============

async function consultarSaldos(): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .select('banco, agencia, conta, saldo_atual, saldo_disponivel, tipo_conta')
    .eq('ativo', true)
    .order('saldo_atual', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return { success: false, message: 'Nenhuma conta bancária encontrada.' };
  }

  const saldoTotal = data.reduce((sum, c) => sum + Number(c.saldo_atual), 0);
  const saldoDisponivel = data.reduce((sum, c) => sum + Number(c.saldo_disponivel), 0);

  let mensagem = `💰 **SALDOS BANCÁRIOS**\n\n`;
  mensagem += `**Saldo Total:** ${formatCurrency(saldoTotal)}\n`;
  mensagem += `**Saldo Disponível:** ${formatCurrency(saldoDisponivel)}\n\n`;
  mensagem += `**Detalhamento por conta:**\n`;
  
  data.forEach(c => {
    mensagem += `• ${c.banco} (${c.tipo_conta}) - Ag: ${c.agencia} / CC: ${c.conta}\n`;
    mensagem += `  Saldo: ${formatCurrency(Number(c.saldo_atual))} | Disponível: ${formatCurrency(Number(c.saldo_disponivel))}\n`;
  });

  return { success: true, message: mensagem, data };
}

async function criarContaPagar(
  action: ExpertAction,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  if (!empresa) {
    return { success: false, message: 'Nenhuma empresa ativa encontrada.' };
  }

  const { error } = await supabase.from('contas_pagar').insert({
    fornecedor_nome: action.fornecedor_nome || 'Fornecedor EXPERT',
    descricao: action.descricao || 'Lançamento via EXPERT',
    valor: action.valor || 0,
    data_vencimento: action.data_vencimento || new Date().toISOString().split('T')[0],
    data_emissao: new Date().toISOString().split('T')[0],
    tipo_cobranca: (action.tipo_cobranca as TipoCobranca) || 'boleto',
    status: 'pendente',
    empresa_id: empresa.id,
    created_by: user?.id || '',
  });

  if (error) throw error;

  queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
  toast.success('Conta a pagar criada!');

  return { 
    success: true, 
    message: `✅ Conta a pagar criada: ${action.descricao} - ${formatCurrency(action.valor || 0)} para ${action.fornecedor_nome}` 
  };
}

async function criarContaReceber(
  action: ExpertAction,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  if (!empresa) {
    return { success: false, message: 'Nenhuma empresa ativa encontrada.' };
  }

  const { error } = await supabase.from('contas_receber').insert({
    cliente_nome: action.cliente_nome || 'Cliente EXPERT',
    descricao: action.descricao || 'Lançamento via EXPERT',
    valor: action.valor || 0,
    data_vencimento: action.data_vencimento || new Date().toISOString().split('T')[0],
    data_emissao: new Date().toISOString().split('T')[0],
    tipo_cobranca: (action.tipo_cobranca as TipoCobranca) || 'boleto',
    status: 'pendente',
    empresa_id: empresa.id,
    created_by: user?.id || '',
  });

  if (error) throw error;

  queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
  toast.success('Conta a receber criada!');

  return { 
    success: true, 
    message: `✅ Conta a receber criada: ${action.descricao} - ${formatCurrency(action.valor || 0)} de ${action.cliente_nome}` 
  };
}

async function consultarCliente(nome: string): Promise<ActionResult> {
  // Query contas_receber that have a matching cliente_nome instead of querying the local clientes table
  const { data: contasReceber, error } = await supabase
    .from('contas_receber')
    .select('cliente_id, cliente_nome, valor, status, data_vencimento')
    .ilike('cliente_nome', `%${nome}%`);

  if (error) throw error;

  // Group by client
  const clienteMap = new Map<string, { nome: string; contas: typeof contasReceber }>();
  (contasReceber || []).forEach(c => {
    const key = c.cliente_id || c.cliente_nome;
    const existing = clienteMap.get(key);
    if (existing) {
      existing.contas!.push(c);
    } else {
      clienteMap.set(key, { nome: c.cliente_nome || 'Desconhecido', contas: [c] });
    }
  });

  if (clienteMap.size === 0) {
    return { success: false, message: `Nenhum cliente encontrado com "${nome}".` };
  }

  let mensagem = `👤 **CLIENTES ENCONTRADOS:**\n\n`;
  
  for (const [, { nome: clienteNome, contas }] of clienteMap) {
    const totalReceber = (contas || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + Number(c.valor), 0);
    const totalVencido = (contas || []).filter(c => c.status === 'vencido').reduce((sum, c) => sum + Number(c.valor), 0);
    
    mensagem += `**${clienteNome}**\n`;
    mensagem += `• Em aberto: ${formatCurrency(totalReceber)} | Vencido: ${formatCurrency(totalVencido)}\n\n`;
  }

  return { success: true, message: mensagem };
}

async function consultarFornecedor(nome: string): Promise<ActionResult> {
  // Query contas_pagar that have a matching fornecedor_nome instead of querying the local fornecedores table
  const { data: contasPagar, error } = await supabase
    .from('contas_pagar')
    .select('fornecedor_id, fornecedor_nome, valor, status, data_vencimento')
    .ilike('fornecedor_nome', `%${nome}%`);

  if (error) throw error;

  // Group by fornecedor
  const fornecedorMap = new Map<string, { nome: string; contas: typeof contasPagar }>();
  (contasPagar || []).forEach(c => {
    const key = c.fornecedor_id || c.fornecedor_nome;
    const existing = fornecedorMap.get(key);
    if (existing) {
      existing.contas!.push(c);
    } else {
      fornecedorMap.set(key, { nome: c.fornecedor_nome || 'Desconhecido', contas: [c] });
    }
  });

  if (fornecedorMap.size === 0) {
    return { success: false, message: `Nenhum fornecedor encontrado com "${nome}".` };
  }

  let mensagem = `🏢 **FORNECEDORES ENCONTRADOS:**\n\n`;
  
  for (const [, { nome: fornecedorNome, contas }] of fornecedorMap) {
    const totalPagar = (contas || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + Number(c.valor), 0);
    const totalVencido = (contas || []).filter(c => c.status === 'vencido').reduce((sum, c) => sum + Number(c.valor), 0);
    
    mensagem += `**${fornecedorNome}**\n`;
    mensagem += `• A pagar: ${formatCurrency(totalPagar)} | Vencido: ${formatCurrency(totalVencido)}\n\n`;
  }

  return { success: true, message: mensagem };
}

async function analisarFluxo(periodo: string): Promise<ActionResult> {
  const dias = parseInt(periodo) || 30;
  const hoje = new Date();
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + dias);

  const { data: contasPagar } = await supabase
    .from('contas_pagar')
    .select('data_vencimento, valor')
    .eq('status', 'pendente')
    .gte('data_vencimento', hoje.toISOString().split('T')[0])
    .lte('data_vencimento', fim.toISOString().split('T')[0]);

  const { data: contasReceber } = await supabase
    .from('contas_receber')
    .select('data_vencimento, valor')
    .in('status', ['pendente'])
    .gte('data_vencimento', hoje.toISOString().split('T')[0])
    .lte('data_vencimento', fim.toISOString().split('T')[0]);

  const { data: saldos } = await supabase
    .from('contas_bancarias')
    .select('saldo_atual')
    .eq('ativo', true);

  const saldoAtual = saldos?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;
  const totalReceitas = contasReceber?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
  const totalDespesas = contasPagar?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
  const saldoProjetado = saldoAtual + totalReceitas - totalDespesas;

  // Análise por semana
  const semanas: { semana: number; receitas: number; despesas: number }[] = [];
  for (let i = 0; i < Math.ceil(dias / 7); i++) {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(inicioSemana.getDate() + (i * 7));
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const receitasSemana = contasReceber?.filter(c => {
      const d = new Date(c.data_vencimento);
      return d >= inicioSemana && d <= fimSemana;
    }).reduce((sum, c) => sum + Number(c.valor), 0) || 0;

    const despesasSemana = contasPagar?.filter(c => {
      const d = new Date(c.data_vencimento);
      return d >= inicioSemana && d <= fimSemana;
    }).reduce((sum, c) => sum + Number(c.valor), 0) || 0;

    semanas.push({ semana: i + 1, receitas: receitasSemana, despesas: despesasSemana });
  }

  let mensagem = `📊 **ANÁLISE DE FLUXO DE CAIXA (${dias} dias)**\n\n`;
  mensagem += `**Resumo Geral:**\n`;
  mensagem += `• Saldo Atual: ${formatCurrency(saldoAtual)}\n`;
  mensagem += `• Receitas Previstas: ${formatCurrency(totalReceitas)}\n`;
  mensagem += `• Despesas Previstas: ${formatCurrency(totalDespesas)}\n`;
  mensagem += `• Saldo Projetado: ${formatCurrency(saldoProjetado)}\n\n`;

  if (saldoProjetado < 0) {
    mensagem += `⚠️ **ALERTA:** Saldo negativo projetado! Considere antecipar recebimentos ou renegociar pagamentos.\n\n`;
  }

  mensagem += `**Detalhamento Semanal:**\n`;
  semanas.forEach(s => {
    const saldo = s.receitas - s.despesas;
    const emoji = saldo >= 0 ? '✅' : '⚠️';
    mensagem += `${emoji} Semana ${s.semana}: Receitas ${formatCurrency(s.receitas)} | Despesas ${formatCurrency(s.despesas)} | Saldo: ${formatCurrency(saldo)}\n`;
  });

  return { success: true, message: mensagem, data: { saldoAtual, totalReceitas, totalDespesas, saldoProjetado, semanas } };
}

async function agendarCobranca(contaId: string): Promise<ActionResult> {
  const { data: conta, error: findError } = await supabase
    .from('contas_receber')
    .select('*, clientes(razao_social, email, telefone)')
    .eq('id', contaId)
    .maybeSingle();

  if (findError || !conta) {
    return { success: false, message: `Conta ${contaId} não encontrada.` };
  }

  // Avançar para próxima etapa de cobrança
  const etapas = ['preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico'] as const;
  const etapaAtual: EtapaCobranca = conta.etapa_cobranca || 'preventiva';
  const indiceAtual = etapas.indexOf(etapaAtual);
  const proximaEtapa = etapas[Math.min(indiceAtual + 1, etapas.length - 1)];

  const { error } = await supabase
    .from('contas_receber')
    .update({ etapa_cobranca: proximaEtapa })
    .eq('id', contaId);

  if (error) throw error;

  // Registrar histórico
  await supabase.from('historico_cobranca').insert({
    conta_receber_id: contaId,
    etapa_anterior: etapaAtual,
    etapa_nova: proximaEtapa,
  });

  toast.success(`Cobrança avançada para ${proximaEtapa}!`);

  return { 
    success: true, 
    message: `📞 Cobrança agendada! Cliente: ${conta.clientes?.razao_social || conta.cliente_nome}\nEtapa: ${etapaAtual} → ${proximaEtapa}\nValor: ${formatCurrency(Number(conta.valor))}` 
  };
}

async function consultarVencimentos(periodo: string): Promise<ActionResult> {
  const dias = parseInt(periodo) || 7;
  const hoje = new Date().toISOString().split('T')[0];
  const fim = new Date();
  fim.setDate(fim.getDate() + dias);
  const fimStr = fim.toISOString().split('T')[0];

  const { data: pagar } = await supabase
    .from('contas_pagar')
    .select('fornecedor_nome, descricao, valor, data_vencimento')
    .eq('status', 'pendente')
    .gte('data_vencimento', hoje)
    .lte('data_vencimento', fimStr)
    .order('data_vencimento');

  const { data: receber } = await supabase
    .from('contas_receber')
    .select('cliente_nome, descricao, valor, data_vencimento')
    .in('status', ['pendente'])
    .gte('data_vencimento', hoje)
    .lte('data_vencimento', fimStr)
    .order('data_vencimento');

  let mensagem = `📅 **VENCIMENTOS NOS PRÓXIMOS ${dias} DIAS**\n\n`;

  if (pagar && pagar.length > 0) {
    const totalPagar = pagar.reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**Contas a Pagar:** ${pagar.length} títulos - ${formatCurrency(totalPagar)}\n`;
    pagar.slice(0, 5).forEach(c => {
      mensagem += `• ${c.data_vencimento}: ${c.fornecedor_nome} - ${formatCurrency(Number(c.valor))}\n`;
    });
    if (pagar.length > 5) mensagem += `  ... e mais ${pagar.length - 5} títulos\n`;
    mensagem += '\n';
  } else {
    mensagem += `**Contas a Pagar:** Nenhum vencimento no período ✅\n\n`;
  }

  if (receber && receber.length > 0) {
    const totalReceber = receber.reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**Contas a Receber:** ${receber.length} títulos - ${formatCurrency(totalReceber)}\n`;
    receber.slice(0, 5).forEach(c => {
      mensagem += `• ${c.data_vencimento}: ${c.cliente_nome} - ${formatCurrency(Number(c.valor))}\n`;
    });
    if (receber.length > 5) mensagem += `  ... e mais ${receber.length - 5} títulos\n`;
  } else {
    mensagem += `**Contas a Receber:** Nenhum vencimento no período\n`;
  }

  return { success: true, message: mensagem, data: { pagar, receber } };
}

async function gerarBoleto(contaId: string): Promise<ActionResult> {
  const { data: conta, error } = await supabase
    .from('contas_receber')
    .select('*, clientes(razao_social, cnpj_cpf)')
    .eq('id', contaId)
    .maybeSingle();

  if (error || !conta) {
    return { success: false, message: `Conta ${contaId} não encontrada.` };
  }

  // Simular geração de boleto (em produção, integraria com API do banco)
  const codigoBarras = `23793.38128 60000.000003 00000.000406 ${Math.random().toString().slice(2, 6)} ${Math.floor(Date.now() / 1000)}`;
  
  toast.success('Boleto gerado com sucesso!');

  return { 
    success: true, 
    message: `🎫 **BOLETO GERADO**\n\nCliente: ${conta.clientes?.razao_social || conta.cliente_nome}\nValor: ${formatCurrency(Number(conta.valor))}\nVencimento: ${conta.data_vencimento}\n\nCódigo de Barras:\n\`${codigoBarras}\`` 
  };
}

async function atualizarScoreCliente(
  clienteId: string, 
  novoScore: number,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: cliente, error: findError } = await supabase
    .from('clientes')
    .select('razao_social, score')
    .eq('id', clienteId)
    .maybeSingle();

  if (findError || !cliente) {
    return { success: false, message: `Cliente ${clienteId} não encontrado.` };
  }

  const scoreAnterior = cliente.score || 0;

  const { error } = await supabase
    .from('clientes')
    .update({ score: novoScore })
    .eq('id', clienteId);

  if (error) throw error;

  queryClient.invalidateQueries({ queryKey: ['clientes'] });
  toast.success('Score do cliente atualizado!');

  return { 
    success: true, 
    message: `📊 Score do cliente "${cliente.razao_social}" atualizado: ${scoreAnterior} → ${novoScore}` 
  };
}
