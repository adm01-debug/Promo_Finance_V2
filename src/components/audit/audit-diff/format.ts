import { formatDate } from '@/lib/formatters';
import type { DiffField } from '@/lib/audit-diff';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;

export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(v);
  }
  if (typeof v === 'string') {
    if (ISO_DATE_RE.test(v)) {
      try {
        return formatDate(v);
      } catch {
        return v;
      }
    }
    return v;
  }
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function matchesQuery(field: DiffField, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (field.key.toLowerCase().includes(needle)) return true;
  const before = formatValue(field.before).toLowerCase();
  const after = formatValue(field.after).toLowerCase();
  return before.includes(needle) || after.includes(needle);
}
