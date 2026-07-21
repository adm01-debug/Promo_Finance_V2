import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { applyPdfLayout, getAutoTableMargins, getContentStartY, PDF_BRAND } from '@/lib/pdf-layout';
import type { DemonstrativosResult, FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';

type DreData = DemonstrativosResult['dre'];
type BalancoData = DemonstrativosResult['balanco'];

interface ExportContext {
  empresaTitulo: string;
  empresaCnpj?: string;
  ano: number;
  mes: number;
  fonte: FonteDemonstrativo;
}

function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarDRE(format: 'pdf' | 'json', dre: DreData, ctx: ExportContext) {
  if (dre.linhas.length === 0) {
    toast.warning('Sem dados para exportar.');
    return;
  }

  const filename = `DRE-${ctx.empresaTitulo}-${ctx.ano}-${ctx.mes + 1}-${ctx.fonte}`;

  if (format === 'json') {
    downloadJson({
      empresa: { nome: ctx.empresaTitulo, cnpj: ctx.empresaCnpj || '—' },
      periodo: { ano: ctx.ano, mes: ctx.mes + 1 },
      fonte: ctx.fonte,
      totais: { receitas: dre.receitaBruta, resultado: dre.lucroLiquido },
      linhas: dre.linhas,
    }, filename);
    toast.success('DRE exportada em JSON');
    return;
  }

  const doc = new jsPDF();
  const margins = getAutoTableMargins();
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = getContentStartY();
  const totalW = pageWidth - margins.left - margins.right;

  doc.setFillColor(PDF_BRAND.surface[0], PDF_BRAND.surface[1], PDF_BRAND.surface[2]);
  doc.setDrawColor(PDF_BRAND.border[0], PDF_BRAND.border[1], PDF_BRAND.border[2]);
  doc.roundedRect(margins.left, cursorY, totalW, 20, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
  doc.text('LUCRO/PREJUÍZO LÍQUIDO DO PERÍODO', margins.left + 5, cursorY + 7);
  doc.text(`FONTE: ${ctx.fonte.toUpperCase()} / EMPRESA: ${ctx.empresaTitulo.toUpperCase()}`, pageWidth - margins.right - 5, cursorY + 7, { align: 'right' });

  const positive = dre.lucroLiquido >= 0;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(
    positive ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0],
    positive ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1],
    positive ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2],
  );
  doc.text(formatCurrency(dre.lucroLiquido), margins.left + 5, cursorY + 15);

  const margemLiq = ((dre.lucroLiquido / (dre.receitaBruta || 1)) * 100).toFixed(1);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
  doc.text(`MARGEM LÍQUIDA: ${margemLiq}%`, pageWidth - margins.right - 5, cursorY + 15, { align: 'right' });

  cursorY += 28;

  const rows = dre.linhas.map((l) => [
    { content: l.descricao, styles: { paddingLeft: l.nivel * 4, fontStyle: l.nivel === 0 ? 'bold' : 'normal' } },
    { content: formatCurrency(l.valor), styles: { halign: 'right', fontStyle: l.nivel === 0 ? 'bold' : 'normal' } },
    { content: `${l.percentual.toFixed(1)}%`, styles: { halign: 'right', textColor: PDF_BRAND.muted } },
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Descrição', 'Valor (R$)', '% Rec. Bruta']],
    body: rows as never,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
    columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 25 } },
    margin: margins,
  });

  applyPdfLayout(doc, {
    titulo: 'Demonstração do Resultado do Exercício',
    subtitulo: `${ctx.empresaTitulo} · Mês ${ctx.mes + 1}/${ctx.ano} (${ctx.fonte})`,
  });

  doc.save(`${filename}.pdf`);
  toast.success('DRE exportada em PDF');
}

export function exportarBalanco(format: 'pdf' | 'json', balanco: BalancoData, ctx: ExportContext) {
  if (balanco.ativo.length === 0 && balanco.passivo.length === 0) {
    toast.warning('Sem dados para exportar.');
    return;
  }

  const filename = `Balanco-${ctx.empresaTitulo}-${ctx.ano}-${ctx.mes + 1}-${ctx.fonte}`;

  if (format === 'json') {
    downloadJson({
      empresa: { nome: ctx.empresaTitulo, cnpj: ctx.empresaCnpj || '—' },
      periodo: { ano: ctx.ano, mes: ctx.mes + 1 },
      fonte: ctx.fonte,
      balanco,
    }, filename);
    toast.success('Balanço exportado em JSON');
    return;
  }

  const doc = new jsPDF();
  const margins = getAutoTableMargins();
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = getContentStartY();
  const totalW = pageWidth - margins.left - margins.right;
  const equilibrado = balanco.equilibrado;

  doc.setFillColor(equilibrado ? 240 : 255, equilibrado ? 248 : 240, equilibrado ? 240 : 240);
  doc.setDrawColor(
    equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0],
    equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1],
    equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2],
  );
  doc.roundedRect(margins.left, cursorY, totalW, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(
    equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0],
    equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1],
    equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2],
  );
  doc.setFont('helvetica', 'bold');
  doc.text(
    equilibrado
      ? 'SITUAÇÃO PATRIMONIAL: BALANÇO CONSOLIDADO'
      : `DIVERGÊNCIA IDENTIFICADA: ${formatCurrency(balanco.totalAtivo - balanco.totalPassivo)}`,
    margins.left + 5,
    cursorY + 7.5,
  );
  cursorY += 18;

  const rowsAtivo = balanco.ativo.map((a) => [
    { content: a.descricao, styles: { paddingLeft: a.nivel * 3, fontStyle: a.nivel === 0 ? 'bold' : 'normal' } },
    { content: formatCurrency(a.valor), styles: { halign: 'right', fontStyle: a.nivel === 0 ? 'bold' : 'normal' } },
  ]);

  const rowsPassivo = balanco.passivo.map((p) => [
    { content: p.descricao, styles: { paddingLeft: p.nivel * 3, fontStyle: p.nivel === 0 ? 'bold' : 'normal' } },
    { content: formatCurrency(p.valor), styles: { halign: 'right', fontStyle: p.nivel === 0 ? 'bold' : 'normal' } },
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Ativo', 'Valor (R$)']],
    body: rowsAtivo as never,
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
    margin: { ...margins, right: pageWidth / 2 + 2 },
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['Passivo + PL', 'Valor (R$)']],
    body: rowsPassivo as never,
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
    margin: { ...margins, left: pageWidth / 2 + 2 },
  });

  applyPdfLayout(doc, {
    titulo: 'Balanço Patrimonial',
    subtitulo: `${ctx.empresaTitulo} · Mês ${ctx.mes + 1}/${ctx.ano} (${ctx.fonte})`,
  });

  doc.save(`${filename}.pdf`);
  toast.success('Balanço exportado em PDF');
}
