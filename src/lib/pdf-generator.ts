/**
 * Barrel: mantém a API pública histórica após modularização.
 */
export { generateBoletoPDF, type BoletoData } from './pdf-generator/boleto';
export {
  generateFluxoCaixaPDF,
  generateFluxoCaixaCSV,
  type FluxoCaixaRow,
} from './pdf-generator/fluxo-caixa';
export {
  generateConciliacaoAuditPDF,
  type ConciliacaoAuditRow,
  type ConciliacaoAuditFiltros,
} from './pdf-generator/conciliacao';
export {
  generateBenchmarkingPDF,
  type BenchmarkingGap,
  type BenchmarkingRoadmap,
} from './pdf-generator/benchmarking';
