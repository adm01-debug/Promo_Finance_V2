import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpertContextData {
  resumoFinanceiro: string;
  isLoading: boolean;
}

export function useExpertContext(): ExpertContextData {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  const em7Dias = addDays(hoje, 7);
  const em30Dias = addDays(hoje, 30);

  // Fetch all financial data in parallel
  const { data: contasPagar, isLoading: loadingPagar } = useQuery({
    queryKey: ['expert-contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('id, valor, data_vencimento, status, fornecedor_nome, descricao')
        .gte('data_vencimento', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(em30Dias, 'yyyy-MM-dd'))
        .order('data_vencimento');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: contasReceber, isLoading: loadingReceber } = useQuery({
    queryKey: ['expert-contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, valor, data_vencimento, status, cliente_nome, descricao, etapa_cobranca')
        .gte('data_vencimento', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(em30Dias, 'yyyy-MM-dd'))
        .order('data_vencimento');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: contasBancarias, isLoading: loadingBancos } = useQuery({
    queryKey: ['expert-contas-bancarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('banco, saldo_atual, saldo_disponivel')
        .eq('ativo', true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ['expert-clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('razao_social, score, limite_credito')
        .eq('ativo', true)
        .order('score', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: aprovacoesPendentes, isLoading: loadingAprovacoes } = useQuery({
    queryKey: ['expert-aprovacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select('id, conta_pagar_id, status, solicitado_em, contas_pagar(valor, descricao, fornecedor_nome)')
        .eq('status', 'pendente');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingPagar || loadingReceber || loadingBancos || loadingClientes || loadingAprovacoes;

  // Build context string
  const buildContext = (): string => {
    if (isLoading) return '';

    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Bank accounts summary
    const saldoTotal = contasBancarias?.reduce((acc, c) => acc + Number(c.saldo_atual), 0) || 0;
    const saldoDisponivel = contasBancarias?.reduce((acc, c) => acc + Number(c.saldo_disponivel), 0) || 0;

    // Accounts payable analysis
    const pagarPendente = contasPagar?.filter(c => c.status === 'pendente') || [];
    const pagarVencido = contasPagar?.filter(c => c.status === 'vencido') || [];
    const pagarProximos7Dias = pagarPendente.filter(c => 
      new Date(c.data_vencimento) <= em7Dias && new Date(c.data_vencimento) >= hoje
    );
    const totalPagarPendente = pagarPendente.reduce((acc, c) => acc + Number(c.valor), 0);
    const totalPagarVencido = pagarVencido.reduce((acc, c) => acc + Number(c.valor), 0);
    const totalPagarProximos7Dias = pagarProximos7Dias.reduce((acc, c) => acc + Number(c.valor), 0);

    // Accounts receivable analysis
    const receberPendente = contasReceber?.filter(c => c.status === 'pendente') || [];
    const receberVencido = contasReceber?.filter(c => c.status === 'vencido') || [];
    const receberProximos7Dias = receberPendente.filter(c => 
      new Date(c.data_vencimento) <= em7Dias && new Date(c.data_vencimento) >= hoje
    );
    const totalReceberPendente = receberPendente.reduce((acc, c) => acc + Number(c.valor), 0);
    const totalReceberVencido = receberVencido.reduce((acc, c) => acc + Number(c.valor), 0);
    const totalReceberProximos7Dias = receberProximos7Dias.reduce((acc, c) => acc + Number(c.valor), 0);

    // Collection stages analysis
    const cobrancaEtapas = contasReceber?.reduce((acc, c) => {
      if (c.etapa_cobranca) {
        acc[c.etapa_cobranca] = (acc[c.etapa_cobranca] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Low score clients
    const clientesBaixoScore = clientes?.filter(c => (c.score || 100) < 70) || [];

    // Build detailed context
    let context = `
📊 **DADOS FINANCEIROS ATUALIZADOS (${format(hoje, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })})**

## SALDOS BANCÁRIOS
- Saldo Total: ${formatCurrency(saldoTotal)}
- Saldo Disponível: ${formatCurrency(saldoDisponivel)}
- Contas Ativas: ${contasBancarias?.length || 0}
${contasBancarias?.map(c => `  • ${c.banco}: ${formatCurrency(Number(c.saldo_atual))}`).join('\n') || ''}

## CONTAS A PAGAR
- Total Pendente: ${formatCurrency(totalPagarPendente)} (${pagarPendente.length} títulos)
- Vencidos: ${formatCurrency(totalPagarVencido)} (${pagarVencido.length} títulos)
- Próximos 7 dias: ${formatCurrency(totalPagarProximos7Dias)} (${pagarProximos7Dias.length} títulos)
`;

    if (pagarProximos7Dias.length > 0) {
      context += `\n**Vencimentos Próximos (7 dias):**\n`;
      pagarProximos7Dias.slice(0, 5).forEach(c => {
        context += `  • ${format(new Date(c.data_vencimento), 'dd/MM')}: ${c.fornecedor_nome} - ${c.descricao} (${formatCurrency(Number(c.valor))})\n`;
      });
      if (pagarProximos7Dias.length > 5) {
        context += `  • ... e mais ${pagarProximos7Dias.length - 5} títulos\n`;
      }
    }

    context += `
## CONTAS A RECEBER
- Total Pendente: ${formatCurrency(totalReceberPendente)} (${receberPendente.length} títulos)
- Vencidos (Inadimplentes): ${formatCurrency(totalReceberVencido)} (${receberVencido.length} títulos)
- Previsão Próximos 7 dias: ${formatCurrency(totalReceberProximos7Dias)} (${receberProximos7Dias.length} títulos)
`;

    if (receberVencido.length > 0) {
      context += `\n**Títulos Vencidos (Inadimplência):**\n`;
      receberVencido.slice(0, 5).forEach(c => {
        context += `  • ${c.cliente_nome}: ${formatCurrency(Number(c.valor))} - vencido em ${format(new Date(c.data_vencimento), 'dd/MM/yyyy')}\n`;
      });
      if (receberVencido.length > 5) {
        context += `  • ... e mais ${receberVencido.length - 5} títulos vencidos\n`;
      }
    }

    if (Object.keys(cobrancaEtapas).length > 0) {
      context += `\n**Régua de Cobrança:**\n`;
      Object.entries(cobrancaEtapas).forEach(([etapa, qtd]) => {
        context += `  • ${etapa}: ${qtd} títulos\n`;
      });
    }

    context += `
## FLUXO DE CAIXA PROJETADO (30 dias)
- Saldo Atual: ${formatCurrency(saldoTotal)}
- Entradas Previstas: ${formatCurrency(totalReceberPendente)}
- Saídas Previstas: ${formatCurrency(totalPagarPendente)}
- Saldo Projetado: ${formatCurrency(saldoTotal + totalReceberPendente - totalPagarPendente)}
`;

    if (aprovacoesPendentes && aprovacoesPendentes.length > 0) {
      context += `\n## APROVAÇÕES PENDENTES\n`;
      context += `- ${aprovacoesPendentes.length} pagamentos aguardando aprovação\n`;
    }

    if (clientesBaixoScore.length > 0) {
      context += `\n## CLIENTES COM RISCO (Score < 70)\n`;
      clientesBaixoScore.slice(0, 5).forEach(c => {
        context += `  • ${c.razao_social}: Score ${c.score}\n`;
      });
    }

    // Add key indicators
    const taxaInadimplencia = totalReceberVencido > 0 && totalReceberPendente > 0
      ? ((totalReceberVencido / (totalReceberPendente + totalReceberVencido)) * 100).toFixed(1)
      : '0';
    
    const liquidez = totalPagarPendente > 0 
      ? ((saldoDisponivel + totalReceberPendente) / totalPagarPendente).toFixed(2)
      : 'N/A';

    context += `
## INDICADORES CHAVE
- Taxa de Inadimplência: ${taxaInadimplencia}%
- Índice de Liquidez: ${liquidez}
- Cobertura de Caixa: ${totalPagarPendente > 0 ? Math.round((saldoDisponivel / totalPagarPendente) * 100) : 100}%
`;

    return context;
  };

  return {
    resumoFinanceiro: buildContext(),
    isLoading,
  };
}
