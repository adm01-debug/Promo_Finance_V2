// ============================================
// HOOK: AUDITORIA DE COMPLIANCE
// Verificação automática de inconsistências
// ============================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';

export interface AchamentoAuditoria {
  id: string;
  categoria: 'tributario' | 'fiscal' | 'contabil' | 'documental' | 'processual';
  tipo: string;
  titulo: string;
  descricao: string;
  severidade: 'info' | 'aviso' | 'erro' | 'critico';
  status: 'pendente' | 'em_analise' | 'resolvido' | 'ignorado';
  recomendacao: string;
  impactoFinanceiro?: number;
  entidadeId?: string;
  entidadeTipo?: string;
  fundamentoLegal?: string;
  dataIdentificacao: Date;
  dataResolucao?: Date;
}

export interface ResumoAuditoria {
  totalAchamentos: number;
  criticos: number;
  erros: number;
  avisos: number;
  info: number;
  pendentes: number;
  resolvidos: number;
  impactoFinanceiroTotal: number;
  scoreCompliance: number;
}

export function useAuditoriaCompliance(empresaId?: string) {
  const [isExecutando, setIsExecutando] = useState(false);
  const [achamentos, setAchamentos] = useState<AchamentoAuditoria[]>([]);

  // Buscar dados para auditoria
  const { data: notasFiscais } = useQuery({
    queryKey: ['notas-auditoria', empresaId],
    queryFn: async () => {
      let query = supabase.from('notas_fiscais').select('*');
      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const { data: apuracoes } = useQuery({
    queryKey: ['apuracoes-auditoria', empresaId],
    queryFn: async () => {
      let query = supabase.from('apuracoes_tributarias').select('*');
      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const { data: creditos } = useQuery({
    queryKey: ['creditos-auditoria', empresaId],
    queryFn: async () => {
      let query = supabase.from('creditos_tributarios').select('*');
      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Executar auditoria completa
  const executarAuditoria = async () => {
    setIsExecutando(true);
    const novosAchamentos: AchamentoAuditoria[] = [];
    const ano = new Date().getFullYear();
    const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === ano) || ALIQUOTAS_TRANSICAO[0];

    try {
      // 1. Verificar NF-e sem tributos calculados
      notasFiscais?.forEach(nf => {
        if (nf.valor_total > 0 && (!nf.valor_icms || nf.valor_icms === 0)) {
          novosAchamentos.push({
            id: `nf-sem-tributos-${nf.id}`,
            categoria: 'fiscal',
            tipo: 'NF_SEM_TRIBUTOS',
            titulo: 'NF-e sem tributos calculados',
            descricao: `A NF-e ${nf.numero} não possui tributos calculados`,
            severidade: 'erro',
            status: 'pendente',
            recomendacao: 'Recalcular tributos da NF-e',
            impactoFinanceiro: (nf.valor_total || 0) * ((aliquotas.cbs + aliquotas.ibs) / 100),
            entidadeId: nf.id,
            entidadeTipo: 'nota_fiscal',
            dataIdentificacao: new Date(),
          });
        }
      });

      // 2. Verificar apurações sem transmissão
      apuracoes?.forEach(ap => {
        const competencia = new Date(ap.competencia + '-01');
        const hoje = new Date();
        const diasDesdeCompetencia = Math.floor((hoje.getTime() - competencia.getTime()) / (1000 * 60 * 60 * 24));

        if (ap.status !== 'transmitido' && diasDesdeCompetencia > 30) {
          novosAchamentos.push({
            id: `apuracao-atrasada-${ap.id}`,
            categoria: 'tributario',
            tipo: 'APURACAO_ATRASADA',
            titulo: 'Apuração não transmitida',
            descricao: `Apuração de ${ap.competencia} não foi transmitida`,
            severidade: 'critico',
            status: 'pendente',
            recomendacao: 'Transmitir apuração imediatamente',
            impactoFinanceiro: (ap.total_geral || 0) * 0.20,
            entidadeId: ap.id,
            entidadeTipo: 'apuracao',
            fundamentoLegal: 'Art. 44 da Lei 9.430/96',
            dataIdentificacao: new Date(),
          });
        }
      });

      // 3. Verificar créditos próximos a expirar
      creditos?.forEach(cr => {
        const dataOrigem = new Date(cr.data_origem);
        const dataExpiracao = new Date(dataOrigem);
        dataExpiracao.setMonth(dataExpiracao.getMonth() + 60);
        const hoje = new Date();
        const diasParaExpirar = Math.floor((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasParaExpirar < 90 && diasParaExpirar > 0 && cr.status === 'disponivel') {
          novosAchamentos.push({
            id: `credito-expirar-${cr.id}`,
            categoria: 'tributario',
            tipo: 'CREDITO_EXPIRANDO',
            titulo: 'Crédito próximo a expirar',
            descricao: `Crédito ${cr.tipo_tributo} de R$ ${(cr.saldo_disponivel || 0).toFixed(2)} expira em ${diasParaExpirar} dias`,
            severidade: 'aviso',
            status: 'pendente',
            recomendacao: 'Utilizar ou compensar o crédito antes da expiração',
            impactoFinanceiro: cr.saldo_disponivel || 0,
            entidadeId: cr.id,
            entidadeTipo: 'credito',
            dataIdentificacao: new Date(),
          });
        }
      });

      // 4. Verificar NF-e sem crédito gerado
      notasFiscais?.forEach(nf => {
        const creditoAssociado = creditos?.find(c => c.nota_fiscal_id === nf.id);
        if (!creditoAssociado && nf.valor_total && nf.valor_total > 1000) {
          novosAchamentos.push({
            id: `nf-sem-credito-${nf.id}`,
            categoria: 'fiscal',
            tipo: 'CREDITO_NAO_GERADO',
            titulo: 'Verificar apropriação de crédito',
            descricao: `NF-e ${nf.numero} pode ter crédito não apropriado`,
            severidade: 'info',
            status: 'pendente',
            recomendacao: 'Verificar se há créditos de CBS/IBS a apropriar',
            impactoFinanceiro: (nf.valor_total || 0) * ((aliquotas.cbs + aliquotas.ibs) / 100),
            entidadeId: nf.id,
            entidadeTipo: 'nota_fiscal',
            dataIdentificacao: new Date(),
          });
        }
      });

      setAchamentos(novosAchamentos);
      toast.success(`Auditoria concluída: ${novosAchamentos.length} achamentos`);
    } catch (error) {
      toast.error('Erro ao executar auditoria');
      console.error(error);
    } finally {
      setIsExecutando(false);
    }
  };

  // Resolver achamento
  const resolverAchamento = (id: string) => {
    setAchamentos(prev => 
      prev.map(a => a.id === id 
        ? { ...a, status: 'resolvido' as const, dataResolucao: new Date() } 
        : a
      )
    );
    toast.success('Achamento marcado como resolvido');
  };

  // Ignorar achamento
  const ignorarAchamento = (id: string) => {
    setAchamentos(prev => 
      prev.map(a => a.id === id 
        ? { ...a, status: 'ignorado' as const } 
        : a
      )
    );
  };

  // Resumo
  const resumo = useMemo((): ResumoAuditoria => {
    const criticos = achamentos.filter(a => a.severidade === 'critico').length;
    const erros = achamentos.filter(a => a.severidade === 'erro').length;
    const avisos = achamentos.filter(a => a.severidade === 'aviso').length;
    const info = achamentos.filter(a => a.severidade === 'info').length;
    const pendentes = achamentos.filter(a => a.status === 'pendente').length;
    const resolvidos = achamentos.filter(a => a.status === 'resolvido').length;
    const impacto = achamentos.reduce((acc, a) => acc + (a.impactoFinanceiro || 0), 0);

    const penalidade = (criticos * 25) + (erros * 10) + (avisos * 5);
    const score = Math.max(0, 100 - penalidade);

    return {
      totalAchamentos: achamentos.length,
      criticos,
      erros,
      avisos,
      info,
      pendentes,
      resolvidos,
      impactoFinanceiroTotal: impacto,
      scoreCompliance: score,
    };
  }, [achamentos]);

  return {
    achamentos,
    resumo,
    isExecutando,
    executarAuditoria,
    resolverAchamento,
    ignorarAchamento,
  };
}

export default useAuditoriaCompliance;
