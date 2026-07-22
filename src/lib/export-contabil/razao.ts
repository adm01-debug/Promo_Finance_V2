import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../formatters';
import type { PeriodoCtx, RazaoContaExport } from './types';
import { buildFilename, csvEscape, downloadCSV, fmtDate, headerLines } from './utils';
import { drawFooter, drawHeader, type DocWithAT } from './pdf-common';

export function exportRazaoCSV(contas: RazaoContaExport[], ctx: PeriodoCtx) {
  const lines: string[] = headerLines('LIVRO RAZÃO', ctx);
  lines.push(
    ['Conta', 'Data', 'Histórico', 'Débito', 'Crédito', 'Saldo'].map(csvEscape).join(';'),
  );
  let gSaldoIni = 0;
  let gD = 0;
  let gC = 0;
  let gSaldoFim = 0;
  for (const g of contas) {
    const conta = `${g.codigo} — ${g.nome}`;
    let saldo = g.saldo_inicial;
    let dT = 0;
    let cT = 0;
    lines.push(
      [conta, '', 'SALDO INICIAL', '', '', saldo.toFixed(2).replace('.', ',')]
        .map(csvEscape)
        .join(';'),
    );
    for (const m of g.movs) {
      saldo += m.debito - m.credito;
      dT += m.debito;
      cT += m.credito;
      lines.push(
        [
          conta,
          fmtDate(m.data),
          m.historico,
          m.debito ? m.debito.toFixed(2).replace('.', ',') : '',
          m.credito ? m.credito.toFixed(2).replace('.', ',') : '',
          saldo.toFixed(2).replace('.', ','),
        ]
          .map(csvEscape)
          .join(';'),
      );
    }
    lines.push(
      [
        conta,
        '',
        'TOTAIS DA CONTA',
        dT.toFixed(2).replace('.', ','),
        cT.toFixed(2).replace('.', ','),
        saldo.toFixed(2).replace('.', ','),
      ]
        .map(csvEscape)
        .join(';'),
    );
    lines.push('');
    gSaldoIni += g.saldo_inicial;
    gD += dT;
    gC += cT;
    gSaldoFim += saldo;
  }
  lines.push(
    [
      'SUMÁRIO GLOBAL',
      '',
      `Saldo Inicial: ${gSaldoIni.toFixed(2).replace('.', ',')}`,
      gD.toFixed(2).replace('.', ','),
      gC.toFixed(2).replace('.', ','),
      gSaldoFim.toFixed(2).replace('.', ','),
    ]
      .map(csvEscape)
      .join(';'),
  );
  downloadCSV(lines.join('\n'), buildFilename('livro-razao', ctx));
}

export function exportRazaoPDF(contas: RazaoContaExport[], ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'LIVRO RAZÃO', ctx);

  let cursorY = 115;
  let gSaldoIni = 0;
  let gD = 0;
  let gC = 0;
  let gSaldoFim = 0;

  for (const g of contas) {
    let saldo = g.saldo_inicial;
    let dT = 0;
    let cT = 0;
    const body: (string | number)[][] = [
      ['', 'SALDO INICIAL', '', '', formatCurrency(saldo)],
    ];
    for (const m of g.movs) {
      saldo += m.debito - m.credito;
      dT += m.debito;
      cT += m.credito;
      body.push([
        fmtDate(m.data),
        m.historico,
        m.debito ? formatCurrency(m.debito) : '',
        m.credito ? formatCurrency(m.credito) : '',
        formatCurrency(saldo),
      ]);
    }

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          {
            content: `${g.codigo} — ${g.nome}`,
            colSpan: 5,
            styles: { halign: 'left', fillColor: [229, 231, 235], textColor: 0, fontStyle: 'bold' },
          },
        ],
        ['Data', 'Histórico', 'Débito', 'Crédito', 'Saldo'],
      ],
      body,
      foot: [
        [
          { content: 'TOTAIS DA CONTA', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(dT), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(cT), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(saldo), styles: { halign: 'right', fontStyle: 'bold' } },
        ],
      ],
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [55, 65, 81], textColor: 255 },
      footStyles: { fillColor: [243, 244, 246], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 80 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'right', cellWidth: 90 },
      },
      margin: { top: 115, left: 40, right: 40, bottom: 40 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1 && data.cursor && data.cursor.y < 115) {
          drawHeader(doc, 'LIVRO RAZÃO (cont.)', ctx);
        }
      },
    });

    cursorY = ((doc as DocWithAT).lastAutoTable?.finalY ?? cursorY) + 16;
    if (cursorY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      drawHeader(doc, 'LIVRO RAZÃO (cont.)', ctx);
      cursorY = 115;
    }

    gSaldoIni += g.saldo_inicial;
    gD += dT;
    gC += cT;
    gSaldoFim += saldo;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        {
          content: 'SUMÁRIO GLOBAL DO RAZÃO',
          colSpan: 4,
          styles: { halign: 'center', fillColor: [55, 65, 81], textColor: 255 },
        },
      ],
      ['Saldo Inicial', 'Débitos', 'Créditos', 'Saldo Final'],
    ],
    body: [
      [
        formatCurrency(gSaldoIni),
        formatCurrency(gD),
        formatCurrency(gC),
        formatCurrency(gSaldoFim),
      ],
    ],
    foot: [
      [
        {
          content: `Validação: ${
            Math.abs(gSaldoIni + gD - gC - gSaldoFim) < 0.01 ? 'consistente ✓' : 'divergência ⚠'
          }`,
          colSpan: 4,
          styles: { halign: 'center', fontStyle: 'italic' },
        },
      ],
    ],
    styles: { fontSize: 9, cellPadding: 5, halign: 'right' },
    margin: { top: 115, left: 40, right: 40, bottom: 40 },
  });

  drawFooter(doc);
  doc.save(`livro-razao_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}
