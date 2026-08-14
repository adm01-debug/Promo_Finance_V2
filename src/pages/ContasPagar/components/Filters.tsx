import React from 'react';
import { ContasPagarFilters as BaseFilters } from '@/components/contas-pagar/ContasPagarFilters';
import type { AdvancedFilters } from '@/components/ui/advanced-filters';

interface CentroCusto {
  id: string;
  nome: string;
}

interface ContasPagarFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  centroCustoFilter: string;
  onCentroCustoChange: (value: string) => void;
  aprovacaoFilter: string;
  onAprovacaoChange: (value: string) => void;
  ordenacao: string;
  onOrdenacaoChange: (value: string) => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  centrosCusto: CentroCusto[];
  countPendentesAprovacao: number;
  empresas: Array<{ id: string; razao_social: string; nome_fantasia: string | null }>;
  contasBancarias: Array<{ id: string; banco: string | null; agencia: string | null; conta: string | null }>;
}

export const ContasPagarFilters: React.FC<ContasPagarFiltersProps> = (props) => {
  const { contasBancarias, ...rest } = props;
  return <BaseFilters {...rest} contasBancarias={contasBancarias} />;
};
