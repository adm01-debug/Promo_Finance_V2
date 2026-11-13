// Cálculos puros do DashboardMetricasTributarias (extraídos do componente; mesmos resultados).
import { format, subMonths } from 'date-fns';
import type { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import type { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import type { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';

type Apuracao = NonNullable<ReturnType<typeof useApuracoesTributarias>['apuracoes']>[number];
type Credito = NonNullable<ReturnType<typeof useCreditosTributarios>['creditos']>[number];
type Operacao = NonNullable<ReturnType<typeof useOperacoesTributaveis>['operacoes']>[number];

export interface MetricasInput {
  apuracoesPeriodo: Apuracao[];
  apuracoes: Apuracao[];
  creditos: Credito[];
  operacoes: Operacao[];
  periodoInicio: string;
  periodoMeses: number;
}

export function calcularMetricas({
  apuracoesPeriodo,
  apuracoes,
  creditos,
  operacoes,
  periodoInicio,
  periodoMeses,
}: MetricasInput) {
  const totalTributosNovos = apuracoesPeriodo.reduce(
    (sum, a) => sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0),
    0
  );
  const totalTributosResiduais = apuracoesPeriodo.reduce(
    (sum, a) =>
      sum +
      (a.pis_residual || 0) +
      (a.cofins_residual || 0) +
      (a.icms_residual || 0) +
      (a.iss_residual || 0),
    0
  );
  const totalCreditos = apuracoesPeriodo.reduce(
    (sum, a) => sum + (a.cbs_creditos || 0) + (a.ibs_creditos || 0),
    0
  );
  const totalDebitos = apuracoesPeriodo.reduce(
    (sum, a) => sum + (a.cbs_debitos || 0) + (a.ibs_debitos || 0),
    0
  );
  const faturamento = operacoes
    .filter((o) => ['venda', 'servico_prestado'].includes(o.tipo_operacao))
    .filter((o) => o.data_operacao.substring(0, 7) >= periodoInicio)
    .reduce((sum, o) => sum + o.valor_operacao, 0);
  const cargaEfetiva =
    faturamento > 0 ? ((totalTributosNovos + totalTributosResiduais) / faturamento) * 100 : 0;
  const taxaAproveitamentoCreditos = totalDebitos > 0 ? (totalCreditos / totalDebitos) * 100 : 0;
  const creditosDisponiveis = creditos
    .filter((c) => c.status === 'disponivel')
    .reduce((sum, c) => sum + (c.saldo_disponivel || 0), 0);
  const periodoAnteriorInicio = format(subMonths(new Date(), periodoMeses * 2), 'yyyy-MM');
  const apuracoesAnteriores = apuracoes.filter(
    (a) => a.competencia >= periodoAnteriorInicio && a.competencia < periodoInicio
  );
  const totalAnterior = apuracoesAnteriores.reduce(
    (sum, a) => sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0),
    0
  );
  const variacaoTributos =
    totalAnterior > 0 ? ((totalTributosNovos - totalAnterior) / totalAnterior) * 100 : 0;
  return {
    totalTributosNovos,
    totalTributosResiduais,
    totalCreditos,
    totalDebitos,
    faturamento,
    cargaEfetiva,
    taxaAproveitamentoCreditos,
    creditosDisponiveis,
    variacaoTributos,
    percentualMigracao:
      totalTributosNovos + totalTributosResiduais > 0
        ? (totalTributosNovos / (totalTributosNovos + totalTributosResiduais)) * 100
        : 0,
  };
}

export type MetricasTributarias = ReturnType<typeof calcularMetricas>;

export function calcularScoreSaude(criticos: number, metricas: MetricasTributarias): number {
  let score = 100;
  score -= criticos * 10;
  if (metricas.taxaAproveitamentoCreditos < 80)
    score -= (80 - metricas.taxaAproveitamentoCreditos) / 2;
  if (metricas.cargaEfetiva > 30) score -= metricas.cargaEfetiva - 30;
  if (metricas.percentualMigracao > 50) score += 5;
  return Math.max(0, Math.min(100, score));
}

export const getScoreCor = (score: number) =>
  score >= 80
    ? 'text-success'
    : score >= 60
      ? 'text-warning'
      : score >= 40
        ? 'text-streak'
        : 'text-destructive';
export const getScoreLabel = (score: number) =>
  score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Regular' : 'Crítico';
