import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/formatters';
import { splitSaldo, type BalanceteRow, type BalanceteTotais } from '@/lib/contabil/balancete-utils';
import type { EmpresaHeader, PeriodoCtx } from '@/lib/export-contabil';
import { drawFooter, drawHeader } from '@/lib/export-contabil/pdf-common';
import { buildFilename, csvEscape, downloadCSV, headerLines } from '@/lib/export-contabil/utils';

const dec = (v: number) => v.toFixed(2).replace('.', ',');

export function exportBalanceteCSV(rows: BalanceteRow[], totais: BalanceteTotais, ctx: PeriodoCtx) {
  const lines = headerLines('BALANCETE DE VERIFICAÇÃO', ctx);
  lines.push(
    ['Conta', 'Descrição', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo devedor', 'Saldo credor']
      .map(csvEscape)
      .join(';'),
  );
  for (const r of rows) {
    const s = splitSaldo(r.saldo_final);
    lines.push(
      [r.codigo, r.nome, dec(r.saldo_anterior), dec(r.debitos), dec(r.creditos), dec(s.devedor), dec(s.credor)]
        .map(csvEscape)
        .join(';'),
    );
  }
  lines.push('');
  lines.push(
    ['', 'TOTAIS (analíticas)', '', dec(totais.debitos), dec(totais.creditos), dec(totais.saldoDevedor), dec(totais.saldoCredor)]
      .map(csvEscape)
      .join(';'),
  );
  lines.push(
    ['', 'Diferença D-C', '', dec(totais.diferenca), totais.balanceado ? 'BALANCEADO' : 'DIVERGÊNCIA']
      .map(csvEscape)
      .join(';'),
  );
  downloadCSV(lines.join('\n'), buildFilename('balancete-verificacao', ctx));
}

export function exportBalancetePDF(rows: BalanceteRow[], totais: BalanceteTotais, ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'BALANCETE DE VERIFICAÇÃO', ctx);

  autoTable(doc, {
    startY: 115,
    head: [['Conta', 'Descrição', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo devedor', 'Saldo credor']],
    body: rows.map((r) => {
      const s = splitSaldo(r.saldo_final);
      return [
        r.codigo,
        r.nome,
        formatCurrency(r.saldo_anterior),
        formatCurrency(r.debitos),
        formatCurrency(r.creditos),
        formatCurrency(s.devedor),
        formatCurrency(s.credor),
      ];
    }),
    foot: [
      [
        { content: 'TOTAIS (contas analíticas)', colSpan: 3, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        { content: formatCurrency(totais.debitos), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        { content: formatCurrency(totais.creditos), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        { content: formatCurrency(totais.saldoDevedor), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        { content: formatCurrency(totais.saldoCredor), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
      ],
      [
        {
          content: `Diferença D-C: ${formatCurrency(totais.diferenca)} · ${totais.balanceado ? 'BALANCEADO' : 'DIVERGÊNCIA'}`,
          colSpan: 7,
          styles: { halign: 'center' as const, fontStyle: 'italic' as const },
        },
      ],
    ],
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      5: { halign: 'right' }, 6: { halign: 'right' },
    },
  });

  drawFooter(doc);
  doc.save(`balancete-verificacao_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}

export type { EmpresaHeader };
