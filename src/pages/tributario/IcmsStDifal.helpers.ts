import type { OrigemMercadoria, SituacaoIcmsSt } from '@/lib/tributario/icms';

export const SITUACOES: { value: SituacaoIcmsSt; label: string }[] = [
  { value: 'tributada', label: 'Tributada' },
  { value: 'isenta', label: 'Isenta' },
  { value: 'nao_tributada', label: 'Não tributada' },
  { value: 'aliquota_zero', label: 'Alíquota zero' },
  { value: 'imune', label: 'Imune' },
  { value: 'suspensa', label: 'Suspensa' },
];

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

export const ORIGENS: { value: OrigemMercadoria; label: string }[] = [
  { value: 0, label: '0 — Nacional' },
  { value: 1, label: '1 — Importação direta' },
  { value: 2, label: '2 — Adquirida no mercado interno (importada)' },
  { value: 3, label: '3 — Nacional com conteúdo de importação > 40%' },
  { value: 4, label: '4 — Nacional com processo produtivo básico' },
  { value: 5, label: '5 — Nacional com conteúdo de importação ≤ 40%' },
  { value: 6, label: '6 — Importada sem similar nacional' },
  { value: 7, label: '7 — Adquirida no mercado interno, sem similar' },
  { value: 8, label: '8 — Nacional com conteúdo de importação > 70%' },
];
