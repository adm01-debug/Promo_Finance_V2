import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../formatters';
import type { PartidaExport, PeriodoCtx } from './types';
import { buildFilename, csvEscape, downloadCSV, fmtDate, headerLines } from './utils';
import { drawFooter, drawHeader } from './pdf-common';

export function exportDiarioCSV(partidas: PartidaExport[], ctx: PeriodoCtx) {
  const lines: string[] = headerLines('LIVRO DIÁRIO', ctx);
  lines.push(['Data', 'Nº', 'Histórico', 'Conta', 'Débito', 'Crédito'].map(csvEscape).join(';'));
  let totalD = 0;
  let totalC = 0;
  for (const p of partidas) {
    totalD += p.debito;
    totalC += p.credito;
    lines.push(
      [
        fmtDate(p.data),
        p.numero ?? '',
        p.historico,
        `${p.conta_codigo} — ${p.conta_nome}`,
        p.debito ? p.debito.toFixed(2).replace('.', ',') : '',
        p.credito ? p.credito.toFixed(2).replace('.', ',') : '',
      ]
        .map(csvEscape)
        .join(';'),
    );
  }
  lines.push('');
  lines.push(
    ['', '', '', 'TOTAIS', totalD.toFixed(2).replace('.', ','), totalC.toFixed(2).replace('.', ',')]
      .map(csvEscape)
      .join(';'),
  );
  lines.push(
    ['', '', '', 'Diferença (D-C)', '', (totalD - totalC).toFixed(2).replace('.', ',')]
      .map(csvEscape)
      .join(';'),
  );
  downloadCSV(lines.join('\n'), buildFilename('livro-diario', ctx));
}

export function exportDiarioPDF(partidas: PartidaExport[], ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'LIVRO DIÁRIO', ctx);

  let totalD = 0;
  let totalC = 0;
  const body = partidas.map((p) => {
    totalD += p.debito;
    totalC += p.credito;
    return [
      fmtDate(p.data),
      p.numero ?? '',
      p.historico,
      `${p.conta_codigo} — ${p.conta_nome}`,
      p.debito ? formatCurrency(p.debito) : '',
      p.credito ? formatCurrency(p.credito) : '',
    ];
  });

  autoTable(doc, {
    startY: 115,
    head: [['Data', 'Nº', 'Histórico', 'Conta', 'Débito', 'Crédito']],
    body,
    foot: [
      [
        { content: 'TOTAIS', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalD), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalC), styles: { halign: 'right', fontStyle: 'bold' } },
      ],
      [
        {
          content: `Diferença D-C: ${formatCurrency(totalD - totalC)} · ${
            Math.abs(totalD - totalC) < 0.01 ? 'OK ✓' : 'DIVERGÊNCIA ⚠'
          }`,
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic' },
        },
      ],
    ],
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    footStyles: { fillColor: [243, 244, 246], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      4: { halign: 'right', cellWidth: 80 },
      5: { halign: 'right', cellWidth: 80 },
    },
    margin: { top: 115, left: 40, right: 40, bottom: 40 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, 'LIVRO DIÁRIO (cont.)', ctx);
    },
  });

  drawFooter(doc);
  doc.save(`livro-diario_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}
