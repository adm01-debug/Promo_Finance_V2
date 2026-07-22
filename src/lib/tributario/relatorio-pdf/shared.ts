// Helpers compartilhados entre os módulos de PDF tributário.
import type { ResultadoDecisao, ParametrosSimulacao } from '../index';
import type { RelatorioElisao } from '../elisao';

export interface OpcoesRelatorio {
  empresaNome: string;
  cnpj?: string;
  parametros: ParametrosSimulacao;
  decisao: ResultadoDecisao;
  elisao?: RelatorioElisao;
  regimeAtual?: string;
  /** Inclui anexo com timeline da reforma tributária 2026-2033 */
  projetarReformaTimeline?: boolean;
}

export const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const pct = (v: number) => `${v.toFixed(2)}%`;

export const NOME_REGIME: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

export const COR_REGIME: Record<string, string> = {
  simples_nacional: '#10b981',
  lucro_presumido: '#8b5cf6',
  lucro_real: '#3b82f6',
};

export function formatCnpj(cnpj?: string): string {
  if (!cnpj) return '';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
