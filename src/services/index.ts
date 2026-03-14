// ============================================
// PROMO FINANCE SERVICES INDEX
// ============================================

// Auth
export { authService } from './auth.service';

// CRUD Services
export { clientesService } from './clientes.service';
export type { Cliente, ClienteInput, ClienteFilters } from './clientes.service';

export { fornecedoresService } from './fornecedores.service';
export type { Fornecedor, FornecedorInput, FornecedorFilters } from './fornecedores.service';

export { contasPagarService } from './contas-pagar.service';
export type { ContaPagar, ContaPagarInput, ContaPagarFilters } from './contas-pagar.service';

export { contasReceberService } from './contas-receber.service';
export type { ContaReceber, ContaReceberInput, ContaReceberFilters } from './contas-receber.service';

// Feature Services
export { dashboardService } from './dashboard.service';
export { reportService } from './report.service';
