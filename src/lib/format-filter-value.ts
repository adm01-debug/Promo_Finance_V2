/**
 * Formatação consistente de valores de filtro para chips/resumos.
 *
 * Centraliza a lógica de formatação (datas, números, intervalos, arrays e
 * objetos) usada por `ClearFiltersButton` e `FilterPreviewChips`. Mantém
 * a representação alinhada com o locale pt-BR e trunca strings longas
 * com reticência Unicode (…).
 */
const MAX_VALUE_LEN = 32;
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const numberFmt = new Intl.NumberFormat('pt-BR');
const decimalFmt = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function truncate(s: string, max = MAX_VALUE_LEN): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function tryParseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatFilterValue(v: unknown): string {
  if (v == null || v === '') return '—';

  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? '—' : dateFmt.format(v);
  }

  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';

  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '—';
    return Number.isInteger(v) ? numberFmt.format(v) : decimalFmt.format(v);
  }

  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return '—';
    const asDate = tryParseDate(trimmed);
    if (asDate) return dateFmt.format(asDate);
    if (/^-?\d+([.,]\d+)?$/.test(trimmed)) {
      const n = Number(trimmed.replace(',', '.'));
      if (Number.isFinite(n)) {
        return Number.isInteger(n) ? numberFmt.format(n) : decimalFmt.format(n);
      }
    }
    return truncate(trimmed);
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    if (v.length <= 3) return truncate(v.map((x) => formatFilterValue(x)).join(', '));
    return `${v.length} itens`;
  }

  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const from = obj.from ?? obj.start ?? obj.dataInicio ?? obj.inicio;
    const to = obj.to ?? obj.end ?? obj.dataFim ?? obj.fim;
    if (from !== undefined || to !== undefined) {
      const a = from !== undefined ? formatFilterValue(from) : '—';
      const b = to !== undefined ? formatFilterValue(to) : '—';
      return truncate(`${a} → ${b}`);
    }
    const labelLike = obj.label ?? obj.nome ?? obj.name ?? obj.titulo;
    if (typeof labelLike === 'string') return truncate(labelLike);
    try {
      return truncate(JSON.stringify(v));
    } catch {
      return '—';
    }
  }

  return truncate(String(v));
}
