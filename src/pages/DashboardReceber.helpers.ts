import { subDays } from 'date-fns';
import type { ReceberFilters } from './DashboardReceber.types';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export const RECEBER_DEFAULTS: ReceberFilters = {
  empresaId: 'todas',
  vendedorId: 'todos',
  ramoAtividade: 'todos',
  statusFilter: 'todos',
  clienteId: 'todos',
  periodo: '30',
  dataInicioIso: subDays(new Date(), 30).toISOString(),
  dataFimIso: new Date().toISOString(),
};
