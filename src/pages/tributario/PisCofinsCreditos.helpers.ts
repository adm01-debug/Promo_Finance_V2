import { LABEL_RECEITA, REGRAS_CREDITO } from '@/lib/tributario/pis-cofins';
import type { NaturezaCredito, NaturezaReceita } from '@/lib/tributario/pis-cofins';

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

export const NATUREZAS_RECEITA = Object.keys(LABEL_RECEITA) as NaturezaReceita[];

export const NATUREZAS_CREDITO = Object.keys(REGRAS_CREDITO) as NaturezaCredito[];

export const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};
