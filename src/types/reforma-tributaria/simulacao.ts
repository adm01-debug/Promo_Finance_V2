import type { FaseTransicao } from './enums';

export interface SimulacaoTributaria {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;

  faturamentoAnual: number;
  comprasAnual: number;
  servicosAnual: number;

  icmsTotalAntigo: number;
  issTotalAntigo: number;
  pisTotalAntigo: number;
  cofinsTotalAntigo: number;
  ipiTotalAntigo: number;
  totalTributosAntigo: number;
  cargaTributariaAntigaPercentual: number;

  cbsTotal: number;
  ibsTotal: number;
  isTotal: number;
  totalTributosNovo: number;
  cargaTributariaNovaPercentual: number;

  diferencaAbsoluta: number;
  diferencaPercentual: number;
  impactoFluxoCaixa: 'positivo' | 'negativo' | 'neutro';

  creditosRecuperaveisNovo: number;
  creditosPerdidosTransicao: number;

  anoSimulacao: number;
  faseTransicao: FaseTransicao;
  createdAt: Date;
}
