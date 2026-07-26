import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ResumoMonofasico } from '@/lib/tributario/monofasico';
import { csvEscape, downloadCSV } from '@/lib/export-contabil/utils';

const TITULO = 'REGIME MONOFÁSICO DE PIS/COFINS';
const CABECALHO = ['NCM', 'Descrição', 'Grupo', 'Posição', 'Receita', 'PIS', 'COFINS', 'Total', 'Economia', 'Base legal'];

const num = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function linhas(resumo: ResumoMonofasico) {
  return resumo.itens.map((i) => [
    i.ncm || '—',
    i.descricao,
    i.monofasico ? (i.grupoNome ?? '—') : 'Regime normal',
    i.posicao,
    num(i.receita),
    num(i.pis),
    num(i.cofins),
    num(i.total),
    num(i.economia),
    i.baseLegal ?? '—',
  ]);
}

function cabecalhoContexto(resumo: ResumoMonofasico, empresa?: string): string[] {
  return [
    TITULO,
    `Empresa: ${empresa ?? '—'}`,
    `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    `Receita monofásica: R$ ${num(resumo.receitaMonofasica)} | PIS/COFINS devido: R$ ${num(resumo.totalMonofasico)} | Economia: R$ ${num(resumo.economiaAnual)}`,
  ];
}

export function exportMonofasicoCSV(resumo: ResumoMonofasico, empresa?: string) {
  const out = cabecalhoContexto(resumo, empresa).map(csvEscape);
  out.push('');
  out.push(CABECALHO.map(csvEscape).join(';'));
  for (const linha of linhas(resumo)) out.push(linha.map(csvEscape).join(';'));
  downloadCSV(out.join('\n'), `monofasico_${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
}

export function exportMonofasicoPDF(resumo: ResumoMonofasico, empresa?: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(13);
  doc.text(TITULO, 40, 40);
  doc.setFontSize(9);
  cabecalhoContexto(resumo, empresa).slice(1).forEach((linha, i) => doc.text(linha, 40, 58 + i * 13));

  autoTable(doc, {
    startY: 110,
    head: [CABECALHO],
    body: linhas(resumo),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: { 1: { cellWidth: 120 }, 9: { cellWidth: 130 } },
  });

  doc.save(`monofasico_${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}
