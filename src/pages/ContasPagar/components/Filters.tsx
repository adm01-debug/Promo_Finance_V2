import React from 'react';
import { ContasPagarFilters as BaseFilters } from '@/components/contas-pagar/ContasPagarFilters';

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
  advancedFilters: any;
  onAdvancedFiltersChange: (filters: any) => void;
  centrosCusto: any[];
  countPendentesAprovacao: number;
  empresas: any[];
  contasBancarias: any[];
}

export const ContasPagarFilters: React.FC<ContasPagarFiltersProps> = (props) => {
  return <BaseFilters {...props} />;
};
