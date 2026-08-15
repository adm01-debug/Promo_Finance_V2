// Constantes e helpers puros da página RelatoriosEntregas — extraídos para zerar max-lines.
import type { DeliveryReportFilters } from '@/hooks/useDeliveryReports';

export const STATUS_OPTIONS = ['ALL', 'PENDING', 'MATCHED', 'ON_GOING', 'PICKED_UP', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const;
export const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
export const TAB_VALUES = ['custo', 'performance', 'geografia'] as const;
export type TabValue = typeof TAB_VALUES[number];

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const nfmt = (n: number, digits = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function getDefaultFilters(): DeliveryReportFilters {
  const today = new Date();
  const past = new Date(); past.setDate(past.getDate() - 30);
  return {
    from: past.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    status: 'ALL',
    customer: '',
    region: '',
  };
}

export function parseFilters(sp: URLSearchParams): DeliveryReportFilters {
  const def = getDefaultFilters();
  const from = sp.get('from');
  const to = sp.get('to');
  const status = sp.get('status');
  return {
    from: from && ISO_DATE.test(from) ? from : def.from,
    to: to && ISO_DATE.test(to) ? to : def.to,
    status: status && (STATUS_OPTIONS as readonly string[]).includes(status) ? status : def.status,
    customer: sp.get('customer') ?? '',
    region: sp.get('region') ?? '',
  };
}
