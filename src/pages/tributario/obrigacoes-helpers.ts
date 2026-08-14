import type { SituacaoObrigacao } from '@/lib/tributario/obrigacoes';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dataBR = (iso: string) => (iso.length === 10 ? iso.split('-').reverse().join('/') : iso);

export const num = (v: string) => {
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const SITUACAO_LABEL: Record<SituacaoObrigacao, string> = {
  entregue: 'Entregue',
  vencida: 'Vencida',
  vence_hoje: 'Vence hoje',
  proxima: 'Próxima',
  futura: 'Futura',
};

export const SITUACAO_VARIANT: Record<SituacaoObrigacao, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  entregue: 'secondary',
  vencida: 'destructive',
  vence_hoje: 'destructive',
  proxima: 'default',
  futura: 'outline',
};
