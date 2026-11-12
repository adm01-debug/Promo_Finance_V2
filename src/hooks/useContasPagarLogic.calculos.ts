// Cálculos puros do painel de Contas a Pagar (extraídos de useContasPagarLogic; mesmos resultados).
import {
  endOfMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import type { AdvancedFilters } from '@/components/ui/advanced-filters';
import type { ContaPagarType } from './useContasPagarLogic.types';

// conta_pagar_id e status vêm do banco podendo ser null (montarAprovacaoStatusMap devolve exatamente isso)
export type AprovacaoStatusMap = ReadonlyMap<string | null, string | null>;
export type RequerAprovacao = (valor: number) => boolean;

/** Campos que os KPIs leem — vale para a lista normalizada (allContas) e para ContaPagarType. */
export interface ContaKpi {
  id: string | null;
  valor: number;
  data_vencimento: string;
  status?: string | null;
  valor_pago?: number | null;
  data_pagamento?: string | null;
  aprovado_por?: string | null;
}

export function calcularKpisContasPagar<C extends ContaKpi>(
  allContas: C[],
  aprovacaoStatusMap: AprovacaoStatusMap,
  requerAprovacao: RequerAprovacao
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfPrevMonth = startOfMonth(subMonths(today, 1));
  const endOfPrevMonth = endOfMonth(subMonths(today, 1));

  const totalPagar = allContas.reduce(
    (sum, c) =>
      c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_pago || 0) : sum,
    0
  );
  const totalVencido = allContas
    .filter((c) => c.status === 'vencido')
    .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
  const totalPagoMes = allContas
    .filter((c) => {
      if (c.status !== 'pago' || !c.data_pagamento) return false;
      const dataPag = parseISO(c.data_pagamento);
      return (
        dataPag.getMonth() === today.getMonth() && dataPag.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, c) => sum + (c.valor_pago || 0), 0);

  const totalPagoMesAnterior =
    allContas
      .filter((c) => {
        if (c.status !== 'pago' || !c.data_pagamento) return false;
        const dataPag = parseISO(c.data_pagamento);
        return isWithinInterval(dataPag, { start: startOfPrevMonth, end: endOfPrevMonth });
      })
      .reduce((sum, c) => sum + (c.valor_pago || 0), 0) || totalPagoMes * 0.95;

  const venceHoje = allContas.filter((c) => {
    return isSameDay(parseISO(c.data_vencimento), today) && c.status === 'pendente';
  }).length;

  const contasPendentesAprovacao = allContas.filter((c) => {
    const precisaAprovacao = requerAprovacao(c.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(c.id) === 'pendente';
    const naoAprovado = !c.aprovado_por && precisaAprovacao;
    return (
      (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(c.id))) &&
      c.status !== 'pago' &&
      c.status !== 'cancelado'
    );
  });

  const countPendentesAprovacao = contasPendentesAprovacao.length;

  const aprovacoesUrgentes = contasPendentesAprovacao.filter((c) => {
    const dataVenc = new Date(c.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 3;
  });

  const countAprovacoesUrgentes = aprovacoesUrgentes.length;
  const valorAprovacoesUrgentes = aprovacoesUrgentes.reduce((sum, c) => sum + c.valor, 0);

  return {
    totalPagar,
    totalVencido,
    totalPagoMes,
    totalPagoMesAnterior,
    venceHoje,
    countPendentesAprovacao,
    countAprovacoesUrgentes,
    valorAprovacoesUrgentes,
  };
}

export function filtrarContasPagar(
  contas: ContaPagarType[],
  aprovacaoFilter: string,
  advancedFilters: AdvancedFilters,
  aprovacaoStatusMap: AprovacaoStatusMap,
  requerAprovacao: RequerAprovacao
): ContaPagarType[] {
  return contas.filter((c) => {
    let matchesAprovacao = true;
    if (aprovacaoFilter === 'pendente_aprovacao') {
      const precisaAprovacao = requerAprovacao(c.valor);
      const temSolicitacaoPendente = aprovacaoStatusMap.get(c.id) === 'pendente';
      const naoAprovado = !c.aprovado_por && precisaAprovacao;
      matchesAprovacao =
        (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(c.id))) &&
        c.status !== 'pago' &&
        c.status !== 'cancelado';
    } else if (aprovacaoFilter === 'aprovado') {
      // mesma precedência de getApprovalStatus: a solicitação mais recente
      // decide; sem ela, vale o aprovado_por legado na conta
      const status = aprovacaoStatusMap.get(c.id);
      matchesAprovacao = status ? status === 'aprovado' : !!c.aprovado_por;
    } else if (aprovacaoFilter === 'rejeitado') {
      matchesAprovacao = aprovacaoStatusMap.get(c.id) === 'rejeitado';
    }

    let matchesAdvanced = true;
    if (advancedFilters.dataVencimentoInicio) {
      const vencimento = new Date(c.data_vencimento);
      matchesAdvanced = matchesAdvanced && vencimento >= advancedFilters.dataVencimentoInicio;
    }
    if (advancedFilters.dataVencimentoFim) {
      const vencimento = new Date(c.data_vencimento);
      matchesAdvanced = matchesAdvanced && vencimento <= advancedFilters.dataVencimentoFim;
    }
    if (advancedFilters.valorMinimo !== undefined) {
      matchesAdvanced = matchesAdvanced && c.valor >= advancedFilters.valorMinimo;
    }
    if (advancedFilters.valorMaximo !== undefined) {
      matchesAdvanced = matchesAdvanced && c.valor <= advancedFilters.valorMaximo;
    }
    if (advancedFilters.tipoCobranca) {
      matchesAdvanced = matchesAdvanced && c.tipo_cobranca === advancedFilters.tipoCobranca;
    }
    if (advancedFilters.empresaId && advancedFilters.empresaId !== 'all') {
      matchesAdvanced = matchesAdvanced && c.empresa_id === advancedFilters.empresaId;
    }
    if (advancedFilters.contaBancariaId && advancedFilters.contaBancariaId !== 'all') {
      matchesAdvanced = matchesAdvanced && c.conta_bancaria_id === advancedFilters.contaBancariaId;
    }

    return matchesAprovacao && matchesAdvanced;
  });
}

export function ordenarContasPagar(
  contas: ContaPagarType[],
  ordenacao: string,
  aprovacaoStatusMap: AprovacaoStatusMap,
  requerAprovacao: RequerAprovacao
): ContaPagarType[] {
  const calcularPrioridadeAprovacao = (conta: ContaPagarType) => {
    const precisaAprovacao = requerAprovacao(conta.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(conta.id) === 'pendente';
    const naoAprovado = !conta.aprovado_por && precisaAprovacao;
    const pendente =
      (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(conta.id))) &&
      conta.status !== 'pago' &&
      conta.status !== 'cancelado';

    if (!pendente) return 999;

    const dataVenc = new Date(conta.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    return Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  return [...contas].sort((a, b) => {
    switch (ordenacao) {
      case 'prioridade_aprovacao': {
        const prioA = calcularPrioridadeAprovacao(a);
        const prioB = calcularPrioridadeAprovacao(b);
        if (prioA !== prioB) return prioA - prioB;
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      }
      case 'vencimento':
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      case 'vencimento_desc':
        return new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime();
      case 'valor':
        return b.valor - a.valor;
      case 'valor_asc':
        return a.valor - b.valor;
      case 'fornecedor':
        return (a.fornecedor_nome ?? '').localeCompare(b.fornecedor_nome ?? '');
      default:
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
    }
  });
}

/**
 * Status de aprovação que representa cada conta: o da solicitação MAIS RECENTE
 * (a lista chega ordenada DESC por solicitado_em).
 */
export function montarAprovacaoStatusMap(
  solicitacoesAprovacao: ReadonlyArray<{ conta_pagar_id: string | null; status: string | null }>
): Map<string | null, string | null> {
  // ordenação vem DESC por solicitado_em — a primeira ocorrência de cada
  // conta é a solicitação MAIS RECENTE. Filtrar por status antes do
  // reduce devolveria uma rejeição velha mesmo quando o reenvio foi
  // aprovado (a conta apareceria rejeitada E aprovada ao mesmo tempo).
  // Escolhe a mais recente primeiro; só pendente/rejeitado representam
  // a conta no mapa.
  const maisRecente = new Map<string | null, string | null>();
  for (const s of solicitacoesAprovacao) {
    if (!maisRecente.has(s.conta_pagar_id)) maisRecente.set(s.conta_pagar_id, s.status);
  }
  // 'aprovado' também fica no mapa: cobre legados cuja solicitação foi
  // aprovada mas aprovado_por na conta nunca foi preenchido — sem isso a
  // tela voltaria a pedir aprovação de uma conta já decidida.
  for (const [contaId, status] of maisRecente) {
    if (status !== 'pendente' && status !== 'rejeitado' && status !== 'aprovado') {
      maisRecente.delete(contaId);
    }
  }
  return maisRecente;
}

/** Solicitações de aprovação agrupadas por conta (na ordem recebida). */
export function agruparHistoricoAprovacao<S extends { conta_pagar_id: string | null }>(
  solicitacoesAprovacao: S[]
): Map<string, S[]> {
  return solicitacoesAprovacao.reduce((acc, s) => {
    if (!s.conta_pagar_id) return acc;
    if (!acc.has(s.conta_pagar_id)) {
      acc.set(s.conta_pagar_id, []);
    }
    acc.get(s.conta_pagar_id)!.push(s);
    return acc;
  }, new Map<string, S[]>());
}
