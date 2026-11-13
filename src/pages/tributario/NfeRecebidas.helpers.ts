import type { ManifestacaoStatus } from '@/hooks/useNfeRecebidas';

export const STATUS_LABELS: Record<
  ManifestacaoStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  ciencia: { label: 'Ciência', variant: 'secondary' },
  confirmada: { label: 'Confirmada', variant: 'default' },
  desconhecida: { label: 'Desconhecida', variant: 'secondary' },
  nao_realizada: { label: 'Não realizada', variant: 'destructive' },
};

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
