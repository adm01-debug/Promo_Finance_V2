export interface MetricasReformaTributaria {
  empresaId: string;
  competencia: string;

  faturamentoTotal: number;
  comprasTotal: number;
  cargaTributariaEfetiva: number;

  cbsDebitosTotal: number;
  cbsCreditosTotal: number;
  cbsSaldoAPagar: number;
  cbsTaxaEfetiva: number;

  ibsDebitosTotal: number;
  ibsCreditosTotal: number;
  ibsSaldoAPagar: number;
  ibsTaxaEfetiva: number;

  impostoSeletivoTotal: number;

  valorRetidoSplitPayment: number;
  valorPagoPosSplit: number;

  variacaoCargaTributaria: number;
  economiaGerada: number;

  creditosAcumulados: number;
  creditosUtilizados: number;
  creditosDisponiveis: number;

  tributosAntigosResidual: number;
  percentualMigracao: number;
}
