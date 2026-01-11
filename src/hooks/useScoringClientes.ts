import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { differenceInDays, subMonths } from 'date-fns';

export interface ClienteScore {
  clienteId: string;
  clienteNome: string;
  score: number; // 0-1000
  classificacao: 'A' | 'B' | 'C' | 'D' | 'E';
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  fatores: FatorScore[];
  limiteRecomendado: number;
  ultimaAtualizacao: string;
  tendencia: 'subindo' | 'estavel' | 'descendo';
}

export interface FatorScore {
  nome: string;
  peso: number;
  valor: number;
  impacto: 'positivo' | 'neutro' | 'negativo';
  descricao: string;
}

interface DadosHistorico {
  totalTitulos: number;
  titulosPagos: number;
  titulosVencidos: number;
  diasMedioAtraso: number;
  valorTotal: number;
  valorPago: number;
  maiorAtraso: number;
  tempoRelacionamento: number; // em meses
}

interface ContaReceberScoring {
  cliente_id?: string;
  status: string;
  data_vencimento: string;
  data_recebimento?: string | null;
  valor: number;
  valor_recebido?: number | null;
  created_at: string;
}

// Pesos do modelo de ML simplificado
const PESOS_MODELO = {
  taxaPagamento: 0.25,
  diasMedioAtraso: 0.20,
  tempoRelacionamento: 0.15,
  volumeNegociado: 0.15,
  frequenciaPagamento: 0.10,
  tendenciaPagamento: 0.10,
  concentracaoRisco: 0.05,
};

export function useScoringClientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os clientes com scores
  const { data: clientesComScore = [], isLoading } = useQuery({
    queryKey: ['scoring-clientes'],
    queryFn: async () => {
      // Buscar clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, razao_social, nome_fantasia, score, limite_credito, created_at')
        .eq('ativo', true)
        .order('razao_social');

      if (clientesError) throw clientesError;

      // Buscar histórico de contas a receber para cada cliente
      const { data: contasReceber, error: contasError } = await supabase
        .from('contas_receber')
        .select('cliente_id, valor, valor_recebido, data_vencimento, data_recebimento, status, created_at')
        .order('created_at', { ascending: false });

      if (contasError) throw contasError;

      // Calcular score para cada cliente
      const clientesProcessados: ClienteScore[] = (clientes || []).map(cliente => {
        const contasCliente = (contasReceber || []).filter(c => c.cliente_id === cliente.id);
        const historico = calcularHistorico(contasCliente);
        const { score, fatores, classificacao, risco } = calcularScore(historico);
        
        // Calcular limite recomendado baseado no score e histórico
        const limiteBase = historico.valorTotal > 0 ? historico.valorTotal / Math.max(historico.totalTitulos, 1) : 5000;
        const multiplicadorScore = score >= 800 ? 3 : score >= 600 ? 2 : score >= 400 ? 1 : 0.5;
        const limiteRecomendado = Math.round(limiteBase * multiplicadorScore);

        // Determinar tendência comparando últimos 3 meses
        const tendencia = calcularTendencia(contasCliente);

        return {
          clienteId: cliente.id,
          clienteNome: cliente.nome_fantasia || cliente.razao_social,
          score,
          classificacao,
          risco,
          fatores,
          limiteRecomendado,
          ultimaAtualizacao: new Date().toISOString(),
          tendencia,
        };
      });

      return clientesProcessados.sort((a, b) => b.score - a.score);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Recalcular score de um cliente específico
  const recalcularScoreMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const cliente = clientesComScore.find(c => c.clienteId === clienteId);
      if (!cliente) throw new Error('Cliente não encontrado');

      // Atualizar score no banco
      await supabase
        .from('clientes')
        .update({ score: cliente.score })
        .eq('id', clienteId);

      return cliente;
    },
    onSuccess: (cliente) => {
      queryClient.invalidateQueries({ queryKey: ['scoring-clientes'] });
      toast.success(`Score de ${cliente.clienteNome} atualizado: ${cliente.score}`);
    },
    onError: () => {
      toast.error('Erro ao recalcular score');
    },
  });

  // Atualizar limite de crédito baseado no score
  const atualizarLimiteMutation = useMutation({
    mutationFn: async ({ clienteId, novoLimite }: { clienteId: string; novoLimite: number }) => {
      const { error } = await supabase
        .from('clientes')
        .update({ limite_credito: novoLimite })
        .eq('id', clienteId);

      if (error) throw error;
      return { clienteId, novoLimite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Limite de crédito atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar limite');
    },
  });

  // Estatísticas gerais
  const estatisticas = {
    totalClientes: clientesComScore.length,
    porClassificacao: {
      A: clientesComScore.filter(c => c.classificacao === 'A').length,
      B: clientesComScore.filter(c => c.classificacao === 'B').length,
      C: clientesComScore.filter(c => c.classificacao === 'C').length,
      D: clientesComScore.filter(c => c.classificacao === 'D').length,
      E: clientesComScore.filter(c => c.classificacao === 'E').length,
    },
    scoreMedio: clientesComScore.length > 0 
      ? Math.round(clientesComScore.reduce((s, c) => s + c.score, 0) / clientesComScore.length)
      : 0,
    clientesRiscoAlto: clientesComScore.filter(c => c.risco === 'alto' || c.risco === 'critico').length,
    clientesMelhorando: clientesComScore.filter(c => c.tendencia === 'subindo').length,
  };

  return {
    clientesComScore,
    estatisticas,
    isLoading,
    recalcularScore: recalcularScoreMutation.mutate,
    atualizarLimite: atualizarLimiteMutation.mutate,
    isRecalculando: recalcularScoreMutation.isPending,
  };
}

function calcularHistorico(contas: ContaReceberScoring[]): DadosHistorico {
  const hoje = new Date();
  const totalTitulos = contas.length;
  const titulosPagos = contas.filter(c => c.status === 'pago').length;
  const titulosVencidos = contas.filter(c => 
    c.status !== 'pago' && new Date(c.data_vencimento) < hoje
  ).length;

  let diasAtrasoTotal = 0;
  let maiorAtraso = 0;
  
  contas.forEach(c => {
    if (c.status === 'pago' && c.data_recebimento) {
      const atraso = differenceInDays(new Date(c.data_recebimento), new Date(c.data_vencimento));
      if (atraso > 0) {
        diasAtrasoTotal += atraso;
        maiorAtraso = Math.max(maiorAtraso, atraso);
      }
    } else if (c.status !== 'pago' && new Date(c.data_vencimento) < hoje) {
      const atraso = differenceInDays(hoje, new Date(c.data_vencimento));
      diasAtrasoTotal += atraso;
      maiorAtraso = Math.max(maiorAtraso, atraso);
    }
  });

  const diasMedioAtraso = totalTitulos > 0 ? diasAtrasoTotal / totalTitulos : 0;
  const valorTotal = contas.reduce((s, c) => s + (c.valor || 0), 0);
  const valorPago = contas.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor_recebido || c.valor || 0), 0);

  const primeiraCompra = contas.length > 0 
    ? new Date(contas[contas.length - 1].created_at)
    : hoje;
  const tempoRelacionamento = Math.max(1, differenceInDays(hoje, primeiraCompra) / 30);

  return {
    totalTitulos,
    titulosPagos,
    titulosVencidos,
    diasMedioAtraso,
    valorTotal,
    valorPago,
    maiorAtraso,
    tempoRelacionamento,
  };
}

function calcularScore(historico: DadosHistorico): { 
  score: number; 
  fatores: FatorScore[]; 
  classificacao: 'A' | 'B' | 'C' | 'D' | 'E';
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
} {
  const fatores: FatorScore[] = [];

  // 1. Taxa de Pagamento (0-250 pontos)
  const taxaPagamento = historico.totalTitulos > 0 
    ? (historico.titulosPagos / historico.totalTitulos) * 100 
    : 100;
  const pontosTaxaPagamento = Math.round((taxaPagamento / 100) * 250);
  fatores.push({
    nome: 'Taxa de Pagamento',
    peso: PESOS_MODELO.taxaPagamento,
    valor: pontosTaxaPagamento,
    impacto: taxaPagamento >= 80 ? 'positivo' : taxaPagamento >= 50 ? 'neutro' : 'negativo',
    descricao: `${taxaPagamento.toFixed(0)}% dos títulos pagos`,
  });

  // 2. Dias Médio de Atraso (0-200 pontos, inverso)
  const pontosDiasAtraso = Math.max(0, 200 - (historico.diasMedioAtraso * 4));
  fatores.push({
    nome: 'Pontualidade',
    peso: PESOS_MODELO.diasMedioAtraso,
    valor: Math.round(pontosDiasAtraso),
    impacto: historico.diasMedioAtraso <= 5 ? 'positivo' : historico.diasMedioAtraso <= 15 ? 'neutro' : 'negativo',
    descricao: `Atraso médio: ${historico.diasMedioAtraso.toFixed(0)} dias`,
  });

  // 3. Tempo de Relacionamento (0-150 pontos)
  const pontosRelacionamento = Math.min(150, historico.tempoRelacionamento * 5);
  fatores.push({
    nome: 'Tempo de Cliente',
    peso: PESOS_MODELO.tempoRelacionamento,
    valor: Math.round(pontosRelacionamento),
    impacto: historico.tempoRelacionamento >= 12 ? 'positivo' : historico.tempoRelacionamento >= 6 ? 'neutro' : 'negativo',
    descricao: `${Math.round(historico.tempoRelacionamento)} meses de relacionamento`,
  });

  // 4. Volume Negociado (0-150 pontos)
  const volumeScore = Math.min(150, (historico.valorTotal / 10000) * 10);
  fatores.push({
    nome: 'Volume de Negócios',
    peso: PESOS_MODELO.volumeNegociado,
    valor: Math.round(volumeScore),
    impacto: historico.valorTotal >= 50000 ? 'positivo' : historico.valorTotal >= 10000 ? 'neutro' : 'negativo',
    descricao: `R$ ${(historico.valorTotal / 1000).toFixed(0)}k em compras`,
  });

  // 5. Frequência de Pagamento (0-100 pontos)
  const frequencia = historico.totalTitulos / Math.max(1, historico.tempoRelacionamento);
  const pontosFrequencia = Math.min(100, frequencia * 20);
  fatores.push({
    nome: 'Frequência de Compras',
    peso: PESOS_MODELO.frequenciaPagamento,
    valor: Math.round(pontosFrequencia),
    impacto: frequencia >= 2 ? 'positivo' : frequencia >= 1 ? 'neutro' : 'negativo',
    descricao: `${frequencia.toFixed(1)} compras/mês`,
  });

  // 6. Histórico de Atrasos Graves (0-100 pontos, penalização)
  const penalizacaoAtrasoGrave = historico.maiorAtraso > 60 ? 100 : historico.maiorAtraso > 30 ? 50 : 0;
  const pontosHistoricoLimpo = 100 - penalizacaoAtrasoGrave;
  fatores.push({
    nome: 'Histórico Limpo',
    peso: PESOS_MODELO.tendenciaPagamento,
    valor: pontosHistoricoLimpo,
    impacto: penalizacaoAtrasoGrave === 0 ? 'positivo' : penalizacaoAtrasoGrave < 50 ? 'neutro' : 'negativo',
    descricao: historico.maiorAtraso > 0 ? `Maior atraso: ${historico.maiorAtraso} dias` : 'Sem atrasos graves',
  });

  // 7. Concentração de Risco (0-50 pontos)
  const concentracao = historico.titulosVencidos / Math.max(1, historico.totalTitulos);
  const pontosConcentracao = Math.round((1 - concentracao) * 50);
  fatores.push({
    nome: 'Situação Atual',
    peso: PESOS_MODELO.concentracaoRisco,
    valor: pontosConcentracao,
    impacto: concentracao === 0 ? 'positivo' : concentracao < 0.2 ? 'neutro' : 'negativo',
    descricao: `${historico.titulosVencidos} título(s) em aberto`,
  });

  // Calcular score total (0-1000)
  const score = Math.min(1000, Math.max(0, fatores.reduce((s, f) => s + f.valor, 0)));

  // Classificação
  const classificacao: 'A' | 'B' | 'C' | 'D' | 'E' = 
    score >= 800 ? 'A' :
    score >= 600 ? 'B' :
    score >= 400 ? 'C' :
    score >= 200 ? 'D' : 'E';

  // Risco
  const risco: 'baixo' | 'medio' | 'alto' | 'critico' = 
    score >= 700 ? 'baixo' :
    score >= 500 ? 'medio' :
    score >= 300 ? 'alto' : 'critico';

  return { score, fatores, classificacao, risco };
}

function calcularTendencia(contas: ContaReceberScoring[]): 'subindo' | 'estavel' | 'descendo' {
  const tresMesesAtras = subMonths(new Date(), 3);
  const contasRecentes = contas.filter(c => new Date(c.created_at) >= tresMesesAtras);
  const contasAntigas = contas.filter(c => new Date(c.created_at) < tresMesesAtras);

  if (contasRecentes.length < 2 || contasAntigas.length < 2) return 'estavel';

  const taxaRecente = contasRecentes.filter(c => c.status === 'pago').length / contasRecentes.length;
  const taxaAntiga = contasAntigas.filter(c => c.status === 'pago').length / contasAntigas.length;

  const diferenca = taxaRecente - taxaAntiga;
  if (diferenca > 0.1) return 'subindo';
  if (diferenca < -0.1) return 'descendo';
  return 'estavel';
}
