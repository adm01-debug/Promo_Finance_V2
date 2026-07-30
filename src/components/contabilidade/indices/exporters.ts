import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORIA_LABEL, formatarIndice, variacao, type Indicador } from '@/lib/contabil/indices';
import type { PeriodoCtx } from '@/lib/export-contabil';
import { drawFooter, drawHeader } from '@/lib/export-contabil/pdf-common';
import { buildFilename, csvEscape, downloadCSV, headerLines } from '@/lib/export-contabil/utils';

const TITULO = 'ÍNDICES ECONÔMICO-FINANCEIROS';

function linhas(indices: Indicador[], anteriores: Indicador[] | null) {
  const mapaAnterior = new Map((anteriores ?? []).map((i) => [i.chave, i]));
  return indices.map((i) => {
    const ant = mapaAnterior.get(i.chave);
    const delta = variacao(i.valor, ant?.valor ?? null);
    return [
      CATEGORIA_LABEL[i.categoria],
      i.rotulo,
      formatarIndice(i.valor, i.formato),
      ant ? formatarIndice(ant.valor, ant.formato) : '—',
      delta === null ? '—' : `${delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      i.formula,
      i.valor === null ? (i.motivo ?? 'Sem dados') : i.interpretacao,
    ];
  });
}

const CABECALHO = ['Categoria', 'Indicador', 'Período', 'Anterior', 'Variação', 'Fórmula', 'Leitura'];

export function exportIndicesCSV(indices: Indicador[], anteriores: Indicador[] | null, ctx: PeriodoCtx) {
  const out = headerLines(TITULO, ctx);
  out.push(CABECALHO.map(csvEscape).join(';'));
  for (const linha of linhas(indices, anteriores)) {
    out.push(linha.map(csvEscape).join(';'));
  }
  downloadCSV(out.join('\n'), buildFilename('indices-contabeis', ctx));
}

export function exportIndicesPDF(indices: Indicador[], anteriores: Indicador[] | null, ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, TITULO, ctx);

  autoTable(doc, {
    startY: 115,
    head: [CABECALHO],
    body: linhas(indices, anteriores),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: { 5: { cellWidth: 150 }, 6: { cellWidth: 170 } },
    didDrawPage: () => drawFooter(doc),
  });

  doc.save(`${buildFilename('indices-contabeis', ctx).replace(/\.csv$/, '')}.pdf`);
}
