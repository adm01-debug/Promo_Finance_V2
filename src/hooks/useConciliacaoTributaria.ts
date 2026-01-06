// ============================================
// HOOK: CONCILIAÇÃO TRIBUTÁRIA AUTOMÁTICA
// Cruza NF-e emitidas/recebidas vs cálculos tributários
// ============================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';

export interface DiferencaConciliacao {
  id: string;
  tipo: 'nfe' | 'apuracao' | 'credito';
  documento: string;
  competencia: string;
  descricao: string;
  valorEsperado: number;
  valorEncontrado: number;
  diferenca: number;
  percentualDiferenca: number;
  status: 'divergente' | 'conciliado' | 'justificado';
  justificativa?: string;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  dataIdentificacao: Date;
}

export interface ResumoConciliacao {
  totalNFesEmitidas: number;
  totalNFesRecebidas: number;
  totalCreditos: number;
  totalDebitos: number;
  divergenciasEncontradas: number;
  valorTotalDivergencias: number;
  percentualAcuracia: number;
}

export function useConciliacaoTributaria(empresaId?: string, competencia?: string) {
  const queryClient = useQueryClient();
  const [isAnalisando, setIsAnalisando] = useState(false);
  const [divergencias, setDivergencias] = useState<DiferencaConciliacao[]>([]);

  // Buscar notas fiscais
  const { data: notasFiscais } = useQuery({
    queryKey: ['notas-fiscais-conciliacao', empresaId, competencia],
    queryFn: async () => {
      let query = supabase
        .from('notas_fiscais')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar apurações
  const { data: apuracoes } = useQuery({
    queryKey: ['apuracoes-conciliacao', empresaId, competencia],
    queryFn: async () => {
      let query = supabase
        .from('apuracoes_tributarias')
        .select('*')
        .order('competencia', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar créditos
  const { data: creditos } = useQuery({
    queryKey: ['creditos-conciliacao', empresaId, competencia],
    queryFn: async () => {
      let query = supabase
        .from('creditos_tributarios')
        .select('*')
        .order('data_origem', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Executar análise de conciliação
  const executarConciliacao = useMutation({
    mutationFn: async (config: { ano: number; mes: number }) => {
      setIsAnalisando(true);
      const novasDivergencias: DiferencaConciliacao[] = [];
      const { ano, mes } = config;
      const competenciaStr = `${ano}-${String(mes).padStart(2, '0')}`;

      // Obter alíquotas do ano
      const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === ano) || ALIQUOTAS_TRANSICAO[0];

      // Filtrar NFs do período
      const nfsDoPerido = notasFiscais?.filter(nf => {
        const dataNf = new Date(nf.data_emissao);
        return dataNf.getFullYear() === ano && dataNf.getMonth() + 1 === mes;
      }) || [];

      // Calcular totais esperados das NF-e
      let totalCBSEsperado = 0;
      let totalIBSEsperado = 0;

      nfsDoPerido.forEach(nf => {
        const baseCalculo = nf.valor_total || 0;
        const cbsCalculado = baseCalculo * (aliquotas.cbs / 100);
        const ibsCalculado = baseCalculo * (aliquotas.ibs / 100);

        totalCBSEsperado += cbsCalculado;
        totalIBSEsperado += ibsCalculado;

        // Verificar se valores da NF batem com cálculo esperado
        const valorICMS = nf.valor_icms || 0;
        if (Math.abs(valorICMS - (cbsCalculado + ibsCalculado)) > 1) {
          novasDivergencias.push({
            id: `nfe-tributos-${nf.id}`,
            tipo: 'nfe',
            documento: nf.numero,
            competencia: competenciaStr,
            descricao: `Tributos divergentes na NF-e ${nf.numero}`,
            valorEsperado: cbsCalculado + ibsCalculado,
            valorEncontrado: valorICMS,
            diferenca: valorICMS - (cbsCalculado + ibsCalculado),
            percentualDiferenca: (cbsCalculado + ibsCalculado) > 0 
              ? ((valorICMS - (cbsCalculado + ibsCalculado)) / (cbsCalculado + ibsCalculado)) * 100 
              : 0,
            status: 'divergente',
            gravidade: Math.abs(valorICMS - (cbsCalculado + ibsCalculado)) > 100 ? 'alta' : 'media',
            dataIdentificacao: new Date(),
          });
        }
      });

      // Verificar apuração do período
      const apuracaoPeriodo = apuracoes?.find(a => a.competencia === competenciaStr);
      if (apuracaoPeriodo) {
        const cbsApuracao = (apuracaoPeriodo.cbs_debitos || 0);
        if (Math.abs(cbsApuracao - totalCBSEsperado) > 1) {
          novasDivergencias.push({
            id: `apuracao-cbs-${apuracaoPeriodo.id}`,
            tipo: 'apuracao',
            documento: `Apuração ${competenciaStr}`,
            competencia: competenciaStr,
            descricao: `Total CBS na apuração diverge das NF-e`,
            valorEsperado: totalCBSEsperado,
            valorEncontrado: cbsApuracao,
            diferenca: cbsApuracao - totalCBSEsperado,
            percentualDiferenca: totalCBSEsperado > 0 ? ((cbsApuracao - totalCBSEsperado) / totalCBSEsperado) * 100 : 0,
            status: 'divergente',
            gravidade: Math.abs(cbsApuracao - totalCBSEsperado) > 1000 ? 'critica' : 'alta',
            dataIdentificacao: new Date(),
          });
        }
      }

      // Verificar créditos do período
      const creditosPeriodo = creditos?.filter(c => c.competencia_origem === competenciaStr) || [];
      
      const totalCreditosCBS = creditosPeriodo
        .filter(c => c.tipo_tributo === 'CBS')
        .reduce((acc, c) => acc + (c.valor_credito || 0), 0);

      if (totalCreditosCBS > 0 && Math.abs(totalCreditosCBS - totalCBSEsperado * 0.5) > 100) {
        novasDivergencias.push({
          id: `creditos-cbs-${competenciaStr}`,
          tipo: 'credito',
          documento: `Créditos CBS ${competenciaStr}`,
          competencia: competenciaStr,
          descricao: `Créditos CBS podem estar inconsistentes com operações`,
          valorEsperado: totalCBSEsperado * 0.5,
          valorEncontrado: totalCreditosCBS,
          diferenca: totalCreditosCBS - (totalCBSEsperado * 0.5),
          percentualDiferenca: 10,
          status: 'divergente',
          gravidade: 'media',
          dataIdentificacao: new Date(),
        });
      }

      setDivergencias(novasDivergencias);
      return novasDivergencias;
    },
    onSuccess: (result) => {
      toast.success(`Conciliação concluída: ${result.length} divergências encontradas`);
      setIsAnalisando(false);
    },
    onError: (error: Error) => {
      toast.error('Erro na conciliação: ' + error.message);
      setIsAnalisando(false);
    }
  });

  // Justificar divergência
  const justificarDivergencia = (id: string, justificativa: string) => {
    setDivergencias(prev => 
      prev.map(d => d.id === id 
        ? { ...d, status: 'justificado' as const, justificativa } 
        : d
      )
    );
    toast.success('Divergência justificada');
  };

  // Resumo
  const resumo = useMemo((): ResumoConciliacao => {
    const totalNFs = notasFiscais?.length || 0;
    const totalDebitos = notasFiscais?.reduce((acc, nf) => acc + (nf.valor_icms || 0), 0) || 0;
    const totalCreditos = creditos?.reduce((acc, c) => acc + (c.valor_credito || 0), 0) || 0;

    return {
      totalNFesEmitidas: totalNFs,
      totalNFesRecebidas: 0,
      totalCreditos,
      totalDebitos,
      divergenciasEncontradas: divergencias.length,
      valorTotalDivergencias: divergencias.reduce((acc, d) => acc + Math.abs(d.diferenca), 0),
      percentualAcuracia: Math.max(0, 100 - (divergencias.length * 5)),
    };
  }, [notasFiscais, creditos, divergencias]);

  return {
    notasFiscais,
    apuracoes,
    creditos,
    divergencias,
    resumo,
    isAnalisando,
    executarConciliacao,
    justificarDivergencia,
  };
}

export default useConciliacaoTributaria;
