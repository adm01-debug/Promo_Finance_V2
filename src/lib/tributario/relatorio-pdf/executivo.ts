// Relatório executivo tributário: capa + comparativo + elisão + timeline.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  type OpcoesRelatorio,
  fmt,
  pct,
  NOME_REGIME,
  formatCnpj,
} from './shared';
import { gerarGraficoComparativoBase64, gerarTimelineReformaBase64 } from './charts';

export function gerarRelatorioPdfExecutivo(opts: OpcoesRelatorio): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================================
  // CAPA — Branding empresa
  // ============================================
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 80, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RELATÓRIO EXECUTIVO TRIBUTÁRIO', 20, 50);

  doc.setFontSize(28);
  doc.text('Análise de Regime', 20, 110);
  doc.text('& Elisão Fiscal', 20, 124);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(203, 213, 225);
  doc.text(opts.empresaNome, 20, 150);

  doc.setFontSize(11);
  if (opts.cnpj) doc.text(`CNPJ: ${formatCnpj(opts.cnpj)}`, 20, 160);

  // Box destaque resultado
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(20, 180, pageWidth - 40, 50, 3, 3, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text('REGIME RECOMENDADO', 28, 192);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(NOME_REGIME[opts.decisao.recomendado.regime] ?? opts.decisao.recomendado.regime, 28, 205);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Carga: ${pct(opts.decisao.recomendado.cargaEfetiva)} · Total: ${fmt(opts.decisao.recomendado.totalTributos)}/ano`, 28, 215);
  if (opts.decisao.economiaAnualVsAtual && opts.decisao.economiaAnualVsAtual > 0) {
    doc.setTextColor(74, 222, 128);
    doc.setFont('helvetica', 'bold');
    doc.text(`Economia: ${fmt(opts.decisao.economiaAnualVsAtual)}/ano`, 28, 224);
  }

  // Rodapé capa
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    20,
    pageHeight - 25,
  );
  doc.setFontSize(8);
  doc.text('Motor Tributário Lovable · Análise indicativa — consulte profissional habilitado', 20, pageHeight - 18);

  // ============================================
  // PÁGINA 2 — Sumário e comparativo
  // ============================================
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  let y = 20;

  doc.setFontSize(16);
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

  const justText = doc.splitTextToSize(opts.decisao.justificativaIA || opts.decisao.justificativa || '', pageWidth - 28);
  doc.text(justText, 14, y);
  y += justText.length * 5 + 8;

  // ===== DETALHAMENTO PARÂMETROS =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Parâmetros Analisados', 14, y);
  y += 6;

  const col1 = 18;
  const col2 = 110;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const p = opts.parametros;
  doc.text(`Faturamento Anual: ${fmt(p.faturamentoAnual)}`, col1, y);
  doc.text(`Folha de Pagamento: ${fmt(p.folhaAnual || 0)}`, col2, y);
  y += 5;
  doc.text(`Margem de Lucro: ${p.margemLucro}%`, col1, y);
  doc.text(`Mix de Serviços: ${p.percentualServicos}%`, col2, y);
  y += 5;
  doc.text(`Compras com Crédito: ${fmt(p.comprasComCredito || 0)}`, col1, y);
  doc.text(`Despesas Operacionais: ${fmt(p.despesasOperacionais || 0)}`, col2, y);
  y += 10;

  // ===== GRÁFICO COMPARATIVO =====
  const graficoBar = gerarGraficoComparativoBase64(opts.decisao);
  if (graficoBar) {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Comparativo Visual', 14, y);
    y += 6;
    const imgW = pageWidth - 28;
    const imgH = (imgW * 400) / 800;
    doc.addImage(graficoBar, 'PNG', 14, y, imgW, imgH);
    y += imgH + 8;
  }

  // ===== TABELA COMPARATIVO =====
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Detalhamento por Regime', 14, y);
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
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ===== ALERTAS =====
  if (opts.decisao.alertas.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Alertas Tributários', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    opts.decisao.alertas.forEach((a) => {
      const t = doc.splitTextToSize(`! ${a}`, pageWidth - 28);
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
    doc.text('6. Oportunidades de Elisão Fiscal', 14, y);
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
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 3: { cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ===== TIMELINE REFORMA =====
  if (opts.projetarReformaTimeline !== false) {
    const timeline = gerarTimelineReformaBase64(opts.parametros);
    if (timeline) {
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7. Reforma Tributária 2026-2033', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        'Projeção da carga efetiva durante a transição CBS/IBS (Lei Complementar 214/2025).',
        14,
        y,
      );
      y += 6;
      const imgW = pageWidth - 28;
      const imgH = (imgW * 380) / 800;
      doc.addImage(timeline, 'PNG', 14, y, imgW, imgH);
    }
  }

  // ===== RODAPÉ ASSINADO EM TODAS AS PÁGINAS =====
  const totalPages = doc.getNumberOfPages();
  const geradoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Motor Tributário Lovable · Gerado em ${geradoEm} · Página ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
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
