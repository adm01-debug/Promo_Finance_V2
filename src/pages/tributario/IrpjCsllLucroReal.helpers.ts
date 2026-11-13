import type { LinhaPeriodo } from './IrpjCsllLucroReal.types';

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

export const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const novoPeriodo = (rotulo: string): LinhaPeriodo => ({
  id: crypto.randomUUID(),
  rotulo,
  lucroLiquido: 0,
  receitaBruta: 0,
  irrf: 0,
  csllRetida: 0,
  ajustes: [],
});
