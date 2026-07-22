// Orquestrador — reexporta hooks financeiros modularizados em src/hooks/financial/*
export type {
  Empresa,
  CentroCusto,
  ContaBancaria,
  Cliente,
  Fornecedor,
  ContaPagar,
  ContaReceber,
  StatusPagamento,
  ExternalCliente,
} from './financial/types';

export { useEmpresas, useCentrosCusto, useContasBancarias } from './financial/useEmpresasConfig';
export {
  useContasPagar,
  useContasPagarPaginated,
  useCreateContaPagar,
  useUpdateContaPagar,
  useDeleteContaPagar,
  type PaginatedContasPagarParams,
} from './financial/useContasPagar';
export {
  useContasReceber,
  useContasReceberPaginated,
  type PaginatedContasReceberParams,
} from './financial/useContasReceber';
export {
  useClientes,
  useFornecedores,
  useClientesPaginated,
  useFornecedoresPaginated,
  type PaginatedClientesParams,
  type PaginatedFornecedoresParams,
} from './financial/useClientesFornecedores';
export { useDashboardKPIs } from './financial/useDashboardKPIs';
