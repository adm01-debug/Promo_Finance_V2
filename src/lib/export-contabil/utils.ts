import { format } from 'date-fns';
import type { PeriodoCtx } from './types';

export function fmtDate(s: string) {
  return format(new Date(`${s}T00:00:00`), 'dd/MM/yyyy');
}

export function buildFilename(base: string, ctx: PeriodoCtx) {
  return `${base}_${ctx.dataInicio}_a_${ctx.dataFim}.csv`;
}

export function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export function headerLines(titulo: string, ctx: PeriodoCtx): string[] {
  const e = ctx.empresa;
  return [
    csvEscape(titulo),
    csvEscape(`Empresa: ${e?.razao_social ?? '—'}${e?.nome_fantasia ? ` (${e.nome_fantasia})` : ''}`),
    csvEscape(`CNPJ: ${e?.cnpj ?? '—'}`),
    csvEscape(`Período: ${fmtDate(ctx.dataInicio)} a ${fmtDate(ctx.dataFim)}`),
    csvEscape(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`),
    '',
  ];
}

export function nowStamp() {
  return format(new Date(), 'yyyyMMdd-HHmm');
}
