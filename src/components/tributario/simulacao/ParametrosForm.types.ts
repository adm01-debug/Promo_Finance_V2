import type { ParametrosSimulacao, RegimeTributario } from '@/lib/tributario';

export interface EmpresaOption {
  id: string;
  razao_social: string;
}

export interface Props {
  empresas: EmpresaOption[];
  empresaId?: string;
  setEmpresaId: (id: string) => void;
  regimeAtual?: RegimeTributario;
  setRegimeAtual: (r: RegimeTributario) => void;
  parametros: ParametrosSimulacao;
  setParametros: (p: ParametrosSimulacao) => void;
  temHistoricoSuficiente: boolean;
}
