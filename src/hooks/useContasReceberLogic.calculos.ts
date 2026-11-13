// Cálculos puros do painel de Contas a Receber (extraídos de useContasReceberLogic; mesmos resultados).
import {
  addDays,
  endOfMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { valorRecebidoEfetivo } from '@/lib/financeiro/valor-recebido-efetivo';

/** Campos que os KPIs leem de cada conta. */
export type ContaReceberKpi = Parameters<typeof valorRecebidoEfetivo>[0] & {
  status?: string | null;
  data_recebimento?: string | null;
  data_vencimento?: string | null;
};

/** KPIs com comparação temporal (#4, #5). */
export function calcularKpisContasReceber(allContas: ContaReceberKpi[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = addDays(today, 7);
  const startOfPrevMonth = startOfMonth(subMonths(today, 1));
  const endOfPrevMonth = endOfMonth(subMonths(today, 1));

  const totalReceber = allContas.reduce(
    (sum, c) =>
      c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado'
        ? sum + (c.valor ?? 0) - (c.valor_recebido || 0)
        : sum,
    0
  );

  const totalVencido = allContas
    .filter((c) => c.status === 'vencido')
    .reduce((sum, c) => sum + (c.valor ?? 0) - (c.valor_recebido || 0), 0);

  const totalRecebidoMes = allContas
    .filter((c) => {
      if ((c.status !== 'pago' && c.status !== 'recebido') || !c.data_recebimento) return false;
      const dataRec = parseISO(c.data_recebimento);
      return (
        dataRec.getMonth() === today.getMonth() && dataRec.getFullYear() === today.getFullYear()
      );
    })
    // valor_recebido || valor: contas quitadas sem valor_recebido gravado
    // (ex.: quitação via acordo em dados legados) entram como recebidas
    // pelo valor total — convenção já usada em Financeiro/BI/Dashboards.
    .reduce((sum, c) => sum + valorRecebidoEfetivo(c), 0);

  const totalReceberAnterior =
    allContas
      .filter((c) => {
        if (!c.data_vencimento) return false;
        const venc = parseISO(c.data_vencimento);
        return venc < today && c.status !== 'cancelado';
      })
      .reduce((sum, c) => sum + (c.valor ?? 0), 0) * 0.9; // Simulação de dados anteriores

  const totalRecebidoMesAnterior =
    allContas
      .filter((c) => {
        if ((c.status !== 'pago' && c.status !== 'recebido') || !c.data_recebimento) return false;
        const dataRec = parseISO(c.data_recebimento);
        return isWithinInterval(dataRec, { start: startOfPrevMonth, end: endOfPrevMonth });
      })
      .reduce((sum, c) => sum + valorRecebidoEfetivo(c), 0) || totalRecebidoMes * 0.95;

  const taxaInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

  const venceHoje = allContas.filter((c) => {
    if (c.status === 'pago' || c.status === 'recebido' || c.status === 'cancelado') return false;
    if (!c.data_vencimento) return false;
    return isSameDay(parseISO(c.data_vencimento), today);
  }).length;

  const venceSemana = allContas.filter((c) => {
    if (c.status === 'pago' || c.status === 'recebido' || c.status === 'cancelado') return false;
    if (!c.data_vencimento) return false;
    const venc = parseISO(c.data_vencimento);
    return venc >= today && venc <= endOfWeek;
  }).length;

  return {
    totalReceber,
    totalVencido,
    totalRecebidoMes,
    taxaInadimplencia,
    venceHoje,
    venceSemana,
    totalReceberAnterior,
    totalRecebidoMesAnterior,
    totalVencidoAnterior: totalVencido * 1.1,
  };
}
