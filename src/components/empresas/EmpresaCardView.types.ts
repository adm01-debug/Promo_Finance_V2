import type { Empresa } from '@/hooks/useEmpresas';

export interface EmpresaStats {
  saldoTotal: number;
  contasBancarias: number;
  aReceber: number;
  aPagar: number;
  titulosReceber: number;
  titulosPagar: number;
}

export interface EmpresaHeroKPIProps {
  consolidado: {
    saldoTotal: number;
    totalReceber: number;
    totalPagar: number;
    empresasAtivas: number;
    titulosPendentesReceber: number;
    titulosPendentesPagar: number;
  };
  saldoLiquido: number;
  totalEmpresas: number;
}

export interface EmpresaCardViewProps {
  empresas: Empresa[];
  getEmpresaStats: (id: string) => EmpresaStats;
  selectedEmpresa: string | null;
  setSelectedEmpresa: (id: string) => void;
  onEdit: (empresa: Empresa) => void;
  onToggleAtivo: (empresa: Empresa) => void;
  onAdd: () => void;
  copyToClipboard: (text: string) => void;
  formatCNPJ: (cnpj: string) => string;
}
