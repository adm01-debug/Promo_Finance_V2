// ============================================
// HOOK: useReformaTributaria
// Gestão completa do módulo contábil da Reforma
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  FaseTransicao,
  RegimeEspecial,
  CategoriaIS,
  AliquotasTransicao,
  ALIQUOTAS_TRANSICAO,
  REGIMES_ESPECIAIS,
  CONFIGURACOES_IS,
  ApuracaoTributaria,
  MetricasReformaTributaria,
  SaldoCreditosTributarios,
} from '@/types/reforma-tributaria';
import {
  calcularTributosReforma,
  calcularCreditos,
  simularComparativo,
  determinarFaseTransicao,
  obterAliquotasTransicao,
  DadosOperacao,
  ResultadoCalculo,
  DadosSimulacao,
  ResultadoSimulacao,
} from '@/lib/reforma-tributaria-calculator';

// ========================
// TIPOS LOCAIS
// ========================

export interface FiltrosApuracao {
  empresaId?: string;
  competenciaInicio?: string;
  competenciaFim?: string;
  status?: ApuracaoTributaria['status'];
}

export interface DadosApuracaoInput {
  empresaId: string;
  competencia: string;
}

// ========================
// HOOK PRINCIPAL
// ========================

export function useReformaTributaria() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());

  // ========================
  // DADOS DERIVADOS
  // ========================

  const faseAtual = useMemo(() => determinarFaseTransicao(anoReferencia), [anoReferencia]);
  const aliquotasAtuais = useMemo(() => obterAliquotasTransicao(anoReferencia), [anoReferencia]);

  // ========================
  // CÁLCULOS EM TEMPO REAL
  // ========================

  const calcularTributos = useCallback((dados: DadosOperacao): ResultadoCalculo => {
    return calcularTributosReforma(dados, anoReferencia);
  }, [anoReferencia]);

  const simularCenario = useCallback((dados: DadosSimulacao, ano?: number): ResultadoSimulacao => {
    return simularComparativo(dados, ano || anoReferencia);
  }, [anoReferencia]);

  // ========================
  // MÉTRICAS DO DASHBOARD
  // ========================

  const { data: metricas, isLoading: isLoadingMetricas } = useQuery({
    queryKey: ['reforma-tributaria-metricas', anoReferencia],
    queryFn: async (): Promise<MetricasReformaTributaria> => {
      const competenciaAtual = `${anoReferencia}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      // Buscar contas a receber (faturamento)
      const { data: contasReceber, error: errorReceber } = await supabase
        .from('contas_receber')
        .select('valor, valor_recebido, status, data_vencimento')
        .gte('data_vencimento', `${anoReferencia}-01-01`)
        .lte('data_vencimento', `${anoReferencia}-12-31`);

      if (errorReceber) throw errorReceber;

      // Buscar contas a pagar (compras)
      const { data: contasPagar, error: errorPagar } = await supabase
        .from('contas_pagar')
        .select('valor, valor_pago, status, data_vencimento')
        .gte('data_vencimento', `${anoReferencia}-01-01`)
        .lte('data_vencimento', `${anoReferencia}-12-31`);

      if (errorPagar) throw errorPagar;

      const faturamentoTotal = contasReceber?.reduce((acc, cr) => acc + (cr.valor || 0), 0) || 0;
      const comprasTotal = contasPagar?.reduce((acc, cp) => acc + (cp.valor || 0), 0) || 0;

      // Calcular tributos estimados
      const aliquotas = obterAliquotasTransicao(anoReferencia);
      
      const cbsDebitosTotal = faturamentoTotal * (aliquotas.cbs / 100);
      const ibsDebitosTotal = faturamentoTotal * (aliquotas.ibs / 100);
      
      const cbsCreditosTotal = comprasTotal * (aliquotas.cbs / 100);
      const ibsCreditosTotal = comprasTotal * (aliquotas.ibs / 100);
      
      const cbsSaldoAPagar = Math.max(0, cbsDebitosTotal - cbsCreditosTotal);
      const ibsSaldoAPagar = Math.max(0, ibsDebitosTotal - ibsCreditosTotal);
      
      const totalTributosNovos = cbsSaldoAPagar + ibsSaldoAPagar;
      const cargaTributariaEfetiva = faturamentoTotal > 0 
        ? (totalTributosNovos / faturamentoTotal) * 100 
        : 0;

      // Tributos antigos residuais
      const percentualResidual = aliquotas.icmsResidual / 100;
      const tributosAntigosResidual = (faturamentoTotal * 0.18 * percentualResidual) + 
                                       (faturamentoTotal * 0.0925 * (aliquotas.pisResidual / 100));

      return {
        empresaId: '',
        competencia: competenciaAtual,
        faturamentoTotal,
        comprasTotal,
        cargaTributariaEfetiva,
        cbsDebitosTotal,
        cbsCreditosTotal,
        cbsSaldoAPagar,
        cbsTaxaEfetiva: faturamentoTotal > 0 ? (cbsSaldoAPagar / faturamentoTotal) * 100 : 0,
        ibsDebitosTotal,
        ibsCreditosTotal,
        ibsSaldoAPagar,
        ibsTaxaEfetiva: faturamentoTotal > 0 ? (ibsSaldoAPagar / faturamentoTotal) * 100 : 0,
        impostoSeletivoTotal: 0,
        valorRetidoSplitPayment: cbsSaldoAPagar + ibsSaldoAPagar,
        valorPagoPosSplit: 0,
        variacaoCargaTributaria: 0,
        economiaGerada: 0,
        creditosAcumulados: cbsCreditosTotal + ibsCreditosTotal,
        creditosUtilizados: Math.min(cbsCreditosTotal, cbsDebitosTotal) + Math.min(ibsCreditosTotal, ibsDebitosTotal),
        creditosDisponiveis: Math.max(0, cbsCreditosTotal - cbsDebitosTotal) + Math.max(0, ibsCreditosTotal - ibsDebitosTotal),
        tributosAntigosResidual,
        percentualMigracao: 100 - aliquotas.icmsResidual,
      };
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // ========================
  // CRONOGRAMA DE TRANSIÇÃO
  // ========================

  const cronogramaTransicao = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    return ALIQUOTAS_TRANSICAO.map(aliquota => ({
      ...aliquota,
      status: aliquota.ano < anoAtual ? 'concluido' : 
              aliquota.ano === anoAtual ? 'em_andamento' : 'futuro',
      faseTransicao: determinarFaseTransicao(aliquota.ano),
    }));
  }, []);

  // ========================
  // SIMULAÇÃO EM LOTE
  // ========================

  const { mutateAsync: executarSimulacao, isPending: isSimulando } = useMutation({
    mutationFn: async (dados: DadosSimulacao) => {
      const resultados: { ano: number; resultado: ResultadoSimulacao }[] = [];
      
      for (let ano = 2026; ano <= 2033; ano++) {
        const resultado = simularComparativo(dados, ano);
        resultados.push({ ano, resultado });
      }
      
      return resultados;
    },
    onSuccess: () => {
      toast({
        title: "Simulação concluída",
        description: "Comparativo tributário gerado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na simulação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ========================
  // SALDO DE CRÉDITOS
  // ========================

  const calcularSaldoCreditos = useCallback((
    creditosCBS: number,
    creditosIBS: number,
    debitosCBS: number,
    debitosIBS: number
  ): SaldoCreditosTributarios => {
    const cbsUtilizado = Math.min(creditosCBS, debitosCBS);
    const ibsUtilizado = Math.min(creditosIBS, debitosIBS);
    
    return {
      cbsDisponivel: Math.max(0, creditosCBS - debitosCBS),
      cbsUtilizado,
      cbsTotal: creditosCBS,
      ibsDisponivel: Math.max(0, creditosIBS - debitosIBS),
      ibsUtilizado,
      ibsTotal: creditosIBS,
      creditosAVencer30Dias: 0, // Seria calculado com dados reais
      creditosAVencer60Dias: 0,
      creditosAVencer90Dias: 0,
    };
  }, []);

  // ========================
  // INFORMAÇÕES DE REGIME ESPECIAL
  // ========================

  const getRegimeEspecialInfo = useCallback((regime: RegimeEspecial) => {
    return REGIMES_ESPECIAIS.find(r => r.regime === regime);
  }, []);

  const getImpostoSeletivoInfo = useCallback((categoria: CategoriaIS) => {
    return CONFIGURACOES_IS.find(c => c.categoria === categoria);
  }, []);

  // ========================
  // RETORNO
  // ========================

  return {
    // Estado
    anoReferencia,
    setAnoReferencia,
    faseAtual,
    aliquotasAtuais,
    
    // Dados
    metricas,
    isLoadingMetricas,
    cronogramaTransicao,
    regimesEspeciais: REGIMES_ESPECIAIS,
    impostosSeletivos: CONFIGURACOES_IS,
    
    // Funções de cálculo
    calcularTributos,
    calcularCreditos,
    simularCenario,
    calcularSaldoCreditos,
    
    // Simulação
    executarSimulacao,
    isSimulando,
    
    // Utilitários
    getRegimeEspecialInfo,
    getImpostoSeletivoInfo,
    determinarFaseTransicao,
    obterAliquotasTransicao,
  };
}

// ========================
// HOOK DE APURAÇÃO
// ========================

export function useApuracaoTributaria(empresaId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar apurações
  const { data: apuracoes, isLoading } = useQuery({
    queryKey: ['apuracoes-tributarias', empresaId],
    queryFn: async () => {
      // Simular dados de apuração (em produção, viria do banco)
      const anoAtual = new Date().getFullYear();
      const mesAtual = new Date().getMonth() + 1;
      
      const apuracoesMock: ApuracaoTributaria[] = [];
      
      for (let mes = 1; mes <= mesAtual; mes++) {
        const competencia = `${anoAtual}-${String(mes).padStart(2, '0')}`;
        const faseTransicao = determinarFaseTransicao(anoAtual);
        
        apuracoesMock.push({
          id: `${anoAtual}-${mes}`,
          empresaId: empresaId || '',
          competencia,
          anoReferencia: anoAtual,
          faseTransicao,
          cbsDebitoTotal: Math.random() * 50000 + 10000,
          cbsCreditoTotal: Math.random() * 30000 + 5000,
          cbsAPagar: Math.random() * 20000 + 5000,
          cbsCredorSaldo: 0,
          ibsDebitoTotal: Math.random() * 80000 + 20000,
          ibsCreditoTotal: Math.random() * 50000 + 10000,
          ibsAPagar: Math.random() * 30000 + 10000,
          ibsCredorSaldo: 0,
          isTotal: Math.random() * 5000,
          icmsResidualAPagar: Math.random() * 20000,
          issResidualAPagar: Math.random() * 5000,
          pisResidualAPagar: Math.random() * 3000,
          cofinsResidualAPagar: Math.random() * 12000,
          valorRetidoSplitPayment: Math.random() * 30000,
          valorARecolherPosRetencao: Math.random() * 10000,
          totalTributosNovos: 0,
          totalTributosAntigos: 0,
          totalGeral: 0,
          status: mes === mesAtual ? 'aberta' : 'fechada',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Calcular totais
      return apuracoesMock.map(ap => ({
        ...ap,
        totalTributosNovos: ap.cbsAPagar + ap.ibsAPagar + ap.isTotal,
        totalTributosAntigos: ap.icmsResidualAPagar + ap.issResidualAPagar + ap.pisResidualAPagar + ap.cofinsResidualAPagar,
        totalGeral: ap.cbsAPagar + ap.ibsAPagar + ap.isTotal + ap.icmsResidualAPagar + ap.issResidualAPagar + ap.pisResidualAPagar + ap.cofinsResidualAPagar,
      }));
    },
    enabled: !!empresaId,
  });

  // Gerar nova apuração
  const { mutateAsync: gerarApuracao, isPending: isGerando } = useMutation({
    mutationFn: async (dados: DadosApuracaoInput) => {
      // Em produção, buscaria dados reais e calcularia
      toast({
        title: "Apuração iniciada",
        description: `Gerando apuração para ${dados.competencia}...`,
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, competencia: dados.competencia };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes-tributarias'] });
      toast({
        title: "Apuração concluída",
        description: `Competência ${variables.competencia} processada com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na apuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    apuracoes,
    isLoading,
    gerarApuracao,
    isGerando,
  };
}

export default useReformaTributaria;
