import type { LinhaDebito } from './DarfConsolidado.types';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

export const dataBR = (iso: string) => iso.split('-').reverse().join('/');

export const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const competenciaAtual = () => new Date().toISOString().slice(0, 7);

export const novaLinha = (): LinhaDebito => ({
  id: crypto.randomUUID(),
  codigo: '5856',
  periodoApuracao: competenciaAtual(),
  principal: 0,
  origem: '',
});
