import { format } from 'date-fns';
import type jsPDF from 'jspdf';
import type { PeriodoCtx } from './types';
import { fmtDate } from './utils';

export function drawHeader(doc: jsPDF, titulo: string, ctx: PeriodoCtx) {
  const e = ctx.empresa;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 40, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const empresaLinha = `${e?.razao_social ?? '—'}${e?.nome_fantasia ? ` (${e.nome_fantasia})` : ''}`;
  doc.text(empresaLinha, 40, 58);
  doc.text(`CNPJ: ${e?.cnpj ?? '—'}`, 40, 72);
  doc.text(`Período: ${fmtDate(ctx.dataInicio)} a ${fmtDate(ctx.dataFim)}`, 40, 86);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 100);
  doc.setTextColor(0);
}

export function drawFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${totalPages}`, w - 40, h - 20, { align: 'right' });
    doc.setTextColor(0);
  }
}

export type DocWithAT = jsPDF & { lastAutoTable?: { finalY: number } };
