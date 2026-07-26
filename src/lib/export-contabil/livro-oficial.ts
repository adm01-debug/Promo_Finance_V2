import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../formatters';
import {
  buildTermoAbertura,
  buildTermoEncerramento,
  type TermoParams,
  type TipoLivro,
} from '../contabil/termos-livro';
import type { PartidaExport, PeriodoCtx, RazaoContaExport } from './types';
import { fmtDate } from './utils';
import type { DocWithAT } from './pdf-common';

/** Dados de registro do livro; o que não vier é omitido do termo. */
export interface LivroOficialParams {
  numeroLivro: number;
  nire?: string | null;
  orgaoRegistro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  contadorNome?: string | null;
  contadorCrc?: string | null;
  responsavelNome?: string | null;
}

const MARGIN = 40;

function escreverTermo(doc: jsPDF, linhas: string[]) {
  const largura = doc.internal.pageSize.getWidth() - MARGIN * 2;
  let y = 90;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(linhas[0], MARGIN, y);
  y += 26;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  for (const linha of linhas.slice(1)) {
    if (!linha) {
      y += 12;
      continue;
    }
    const wrapped = doc.splitTextToSize(linha, largura) as string[];
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 14;
  }
}

function numerarPaginas(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Folha ${i} de ${total}`, w - MARGIN, h - 20, { align: 'right' });
    doc.setTextColor(0);
  }
  return total;
}

function termoParams(
  tipoLivro: TipoLivro,
  ctx: PeriodoCtx,
  params: LivroOficialParams,
  totalPaginas: number,
): TermoParams {
  return {
    tipoLivro,
    razaoSocial: ctx.empresa?.razao_social ?? '',
    cnpj: ctx.empresa?.cnpj ?? '',
    nire: params.nire,
    orgaoRegistro: params.orgaoRegistro,
    municipio: params.municipio,
    uf: params.uf,
    numeroLivro: params.numeroLivro,
    dataInicio: ctx.dataInicio,
    dataFim: ctx.dataFim,
    totalPaginas,
    contadorNome: params.contadorNome,
    contadorCrc: params.contadorCrc,
    responsavelNome: params.responsavelNome,
  };
}

/**
 * Livro Diário oficial: termo de abertura, escrituração paginada com
 * totalização por página e termo de encerramento.
 */
export function exportLivroDiarioOficialPDF(
  partidas: PartidaExport[],
  ctx: PeriodoCtx,
  params: LivroOficialParams,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as DocWithAT;

  // 1) Abertura provisória — o total de folhas só é conhecido ao final,
  //    por isso o termo definitivo é reescrito na primeira página no fim.
  escreverTermo(doc, buildTermoAbertura(termoParams('DIARIO', ctx, params, 0)));

  doc.addPage();
  let totalD = 0;
  let totalC = 0;
  let paginaD = 0;
  let paginaC = 0;

  autoTable(doc, {
    startY: 60,
    head: [['Data', 'Nº', 'Histórico', 'Conta', 'Débito', 'Crédito']],
    body: partidas.map((p) => {
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
    }),
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index > 0) return;
      const p = partidas[data.row.index];
      if (p) {
        paginaD += p.debito;
        paginaC += p.credito;
      }
    },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(
        `Soma da folha — Débito: ${formatCurrency(paginaD)} · Crédito: ${formatCurrency(paginaC)}`,
        MARGIN,
        h - 20,
      );
      paginaD = 0;
      paginaC = 0;
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `TOTAIS DO PERÍODO — Débito: ${formatCurrency(totalD)} · Crédito: ${formatCurrency(totalC)} · `
      + `Diferença: ${formatCurrency(totalD - totalC)}`,
    MARGIN,
    finalY + 20,
  );

  // 2) Encerramento
  doc.addPage();
  const totalPaginas = doc.getNumberOfPages();
  escreverTermo(doc, buildTermoEncerramento(termoParams('DIARIO', ctx, params, totalPaginas)));

  // 3) Reescreve a abertura com o total de folhas correto
  doc.setPage(1);
  doc.deletePage(1);
  doc.insertPage(1);
  escreverTermo(doc, buildTermoAbertura(termoParams('DIARIO', ctx, params, totalPaginas)));

  numerarPaginas(doc);
  doc.save(`livro-diario-oficial_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}

/** Livro Razão oficial: mesmos termos, escriturado por conta com saldo corrido. */
export function exportLivroRazaoOficialPDF(
  contas: RazaoContaExport[],
  ctx: PeriodoCtx,
  params: LivroOficialParams,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as DocWithAT;
  escreverTermo(doc, buildTermoAbertura(termoParams('RAZAO', ctx, params, 0)));

  for (const conta of contas) {
    doc.addPage();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${conta.codigo} — ${conta.nome}`, MARGIN, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Saldo anterior: ${formatCurrency(conta.saldo_inicial)}`, MARGIN, 76);

    let saldo = conta.saldo_inicial;
    autoTable(doc, {
      startY: 88,
      head: [['Data', 'Nº', 'Histórico', 'Débito', 'Crédito', 'Saldo']],
      body: conta.movs.map((m) => {
        saldo += m.debito - m.credito;
        return [
          fmtDate(m.data),
          m.numero ?? '',
          m.historico,
          m.debito ? formatCurrency(m.debito) : '',
          m.credito ? formatCurrency(m.credito) : '',
          formatCurrency(saldo),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    });
  }

  doc.addPage();
  const totalPaginas = doc.getNumberOfPages();
  escreverTermo(doc, buildTermoEncerramento(termoParams('RAZAO', ctx, params, totalPaginas)));

  doc.setPage(1);
  doc.deletePage(1);
  doc.insertPage(1);
  escreverTermo(doc, buildTermoAbertura(termoParams('RAZAO', ctx, params, totalPaginas)));

  numerarPaginas(doc);
  doc.save(`livro-razao-oficial_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}
