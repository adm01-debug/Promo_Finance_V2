// ============================================
// RELATÓRIO PDF EXECUTIVO — Decisão Tributária
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ResultadoDecisao, ParametrosSimulacao } from './index';
import type { RelatorioElisao } from './elisao';

interface OpcoesRelatorio {
  empresaNome: string;
  cnpj?: string;
  parametros: ParametrosSimulacao;
  decisao: ResultadoDecisao;
  elisao?: RelatorioElisao;
  regimeAtual?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const pct = (v: number) => `${v.toFixed(2)}%`;

const NOME_REGIME: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

export function gerarRelatorioPdfExecutivo(opts: OpcoesRelatorio): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ===== CAPA =====
  doc.setFillColor(20, 30, 60);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Executivo Tributário', 14, 28);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Empresa: ${opts.empresaNome}`, 14, 40);
  if (opts.cnpj) doc.text(`CNPJ: ${opts.cnpj}`, 14, 47);
  doc.text(
    `Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    14,
    54,
  );

  doc.setTextColor(0, 0, 0);
  y = 75;

  // ===== SUMÁRIO EXECUTIVO =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Sumário Executivo', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const reco = opts.decisao.recomendado;
  const linhasSumario = [
    `Regime recomendado: ${NOME_REGIME[reco.regime] ?? reco.regime}`,
    `Carga total estimada: ${fmt(reco.totalTributos)} (${pct(reco.cargaEfetiva)})`,
    opts.regimeAtual ? `Regime atual: ${NOME_REGIME[opts.regimeAtual] ?? opts.regimeAtual}` : null,
    opts.decisao.economiaAnualVsAtual != null
      ? `Economia anual estimada: ${fmt(opts.decisao.economiaAnualVsAtual)}`
      : null,
  ].filter(Boolean) as string[];

  linhasSumario.forEach((l) => {
    doc.text(`• ${l}`, 18, y);
    y += 6;
  });
  y += 2;

  const justText = doc.splitTextToSize(opts.decisao.justificativa || '', pageWidth - 28);
  doc.text(justText, 14, y);
  y += justText.length * 5 + 6;

  // ===== COMPARATIVO 3 REGIMES =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Comparativo de Regimes', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y + 4,
    head: [['Regime', 'Elegível', 'Carga Total', 'Alíquota Efetiva', 'Diferença vs. Recomendado']],
    body: opts.decisao.cenarios.map((c) => [
      NOME_REGIME[c.regime] ?? c.regime,
      c.elegivel ? 'Sim' : 'Não',
      fmt(c.totalTributos),
      pct(c.cargaEfetiva),
      c.regime === reco.regime ? '—' : fmt(c.totalTributos - reco.totalTributos),
    ]),
    headStyles: { fillColor: [20, 30, 60] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ===== ALERTAS =====
  if (opts.decisao.alertas.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Alertas Tributários', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    opts.decisao.alertas.forEach((a) => {
      const t = doc.splitTextToSize(`⚠ ${a}`, pageWidth - 28);
      doc.text(t, 18, y);
      y += t.length * 5 + 2;
    });
    y += 4;
  }

  // ===== ELISÃO =====
  if (opts.elisao && opts.elisao.total_aplicaveis > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Oportunidades de Elisão Fiscal', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${opts.elisao.total_aplicaveis} estratégia(s) aplicável(eis) — Economia potencial: ${fmt(opts.elisao.economia_total_estimada)}`,
      14,
      y,
    );
    y += 4;

    autoTable(doc, {
      startY: y + 4,
      head: [['Estratégia', 'Risco', 'Economia Estimada', 'Base Legal']],
      body: opts.elisao.oportunidades
        .filter((o) => o.aplicavel)
        .map((o) => [o.nome, o.risco.toUpperCase(), fmt(o.economia_estimada), o.base_legal]),
      headStyles: { fillColor: [20, 30, 60] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 3: { cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Documento gerado automaticamente · Página ${i}/${totalPages} · Análise meramente indicativa — consulte profissional habilitado`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  return doc;
}

export function baixarRelatorioPdf(opts: OpcoesRelatorio) {
  const doc = gerarRelatorioPdfExecutivo(opts);
  const slug = opts.empresaNome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  doc.save(`relatorio-tributario-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
