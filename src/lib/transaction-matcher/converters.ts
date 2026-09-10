import type { LancamentoSistema } from './types';

export function converterContasPagarParaLancamentos(
  contasPagar: Array<{
    id: string;
    descricao: string;
    valor: number;
    valor_pago?: number | null;
    data_vencimento: string;
    fornecedor_nome: string;
    status: string;
    numero_documento?: string | null;
    fornecedores?: { razao_social: string; nome_fantasia?: string | null } | null;
  }>,
): LancamentoSistema[] {
  return contasPagar.map((cp) => ({
    id: cp.id,
    tipo: 'pagar' as const,
    descricao: cp.descricao,
    valor: cp.status === 'parcial' ? Math.max(0, cp.valor - Number(cp.valor_pago || 0)) : cp.valor,
    dataVencimento: new Date(cp.data_vencimento),
    entidade: cp.fornecedor_nome,
    entidadeNome: cp.fornecedores?.nome_fantasia || cp.fornecedores?.razao_social,
    status: cp.status,
    numeroDocumento: cp.numero_documento || undefined,
  }));
}

export function converterContasReceberParaLancamentos(
  contasReceber: Array<{
    id: string;
    descricao: string;
    valor: number;
    valor_recebido?: number | null;
    data_vencimento: string;
    cliente_nome: string;
    status: string;
    numero_documento?: string | null;
    clientes?: { razao_social: string; nome_fantasia?: string | null } | null;
  }>,
): LancamentoSistema[] {
  return contasReceber.map((cr) => ({
    id: cr.id,
    tipo: 'receber' as const,
    descricao: cr.descricao,
    valor: cr.status === 'parcial' ? Math.max(0, cr.valor - Number(cr.valor_recebido || 0)) : cr.valor,
    dataVencimento: new Date(cr.data_vencimento),
    entidade: cr.cliente_nome,
    entidadeNome: cr.clientes?.nome_fantasia || cr.clientes?.razao_social,
    status: cr.status,
    numeroDocumento: cr.numero_documento || undefined,
  }));
}
