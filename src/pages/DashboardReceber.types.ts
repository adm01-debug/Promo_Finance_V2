export interface ReceberFilters extends Record<string, unknown> {
  empresaId: string;
  vendedorId: string;
  ramoAtividade: string;
  statusFilter: string;
  clienteId: string;
  periodo: string;
  dataInicioIso: string;
  dataFimIso: string;
}
