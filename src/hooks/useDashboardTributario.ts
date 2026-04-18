// ============================================
// HOOK: Dashboard Tributário v2 - Agregação completa
// ============================================
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimulacaoRegimes } from './useSimulacaoRegimes';
import { useOportunidadesElisao } from './useOportunidadesElisao';
import useAlertasTributarios from './useAlertasTributarios';

export interface DashboardKPIs {
  cargaEfetiva: number;        // % sobre receita
  totalEconomizado: number;    // R$ economia elisão
  proximoVencimento: { data: string; descricao: string; valor: number } | null;
  saudeFiscal: number;         // 0-100
}

export interface SerieMensal {
  competencia: string;
  ano: number;
  mes: number;
  total_tributos: number;
  cbs: number;
  ibs: number;
  imposto_seletivo: number;
}

export function useDashboardTributario(empresaId?: string, periodoMeses: 3 | 6 | 12 = 12) {
  const { resultado: simulacao, parametros } = useSimulacaoRegimes({ empresaId });
  const { relatorio: relatorioElisao, isLoading: loadingElisao } = useOportunidadesElisao({ empresaId });
  const { alertas = [], proximosVencimentos = [], isLoading: loadingAlertas } = useAlertasTributarios(empresaId);

  // Série temporal a partir da view otimizada
  const { data: serie = [], isLoading: loadingSerie } = useQuery({
    queryKey: ['dashboard-tributario-serie', empresaId, periodoMeses],
    queryFn: async () => {
      if (!empresaId) return [] as SerieMensal[];
      const { data, error } = await supabase
        .from('vw_tributario_dashboard' as never)
        .select('competencia, ano, mes, total_tributos, cbs, ibs, imposto_seletivo')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(periodoMeses);
      if (error) throw error;
      return ((data ?? []) as unknown as SerieMensal[]).reverse();
    },
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });

  // KPIs derivados
  const faturamentoAnual = parametros?.faturamentoAnual ?? 0;
  const tributosTotais = serie.reduce((acc, s) => acc + Number(s.total_tributos || 0), 0);
  const cargaEfetiva = faturamentoAnual > 0
    ? (tributosTotais / faturamentoAnual) * 100
    : 0;

  const totalEconomizado = relatorioElisao?.economia_total_estimada ?? 0;

  const proximoVenc = proximosVencimentos[0];
  const proximoVencimento = proximoVenc
    ? {
        data: proximoVenc.data_vencimento ?? '',
        descricao: proximoVenc.titulo,
        valor: 0,
      }
    : null;

  // Saúde fiscal: 100 - (críticos * 20 + altos * 10 + médios * 5)
  const criticos = alertas.filter((a) => a.prioridade === 'critica').length;
  const altos = alertas.filter((a) => a.prioridade === 'alta').length;
  const medios = alertas.filter((a) => a.prioridade === 'media').length;
  const saudeFiscal = Math.max(0, Math.min(100, 100 - (criticos * 20 + altos * 10 + medios * 5)));

  const kpis: DashboardKPIs = {
    cargaEfetiva,
    totalEconomizado,
    proximoVencimento,
    saudeFiscal,
  };

  return {
    kpis,
    serie,
    simulacao,
    oportunidades: relatorioElisao?.oportunidades ?? [],
    vencimentos: proximosVencimentos,
    alertas,
    isLoading: loadingSerie || loadingElisao || loadingAlertas,
  };
}
