// ============================================
// RELATÓRIO PDF EXECUTIVO — Decisão Tributária
// Inclui capa com branding, gráficos canvas e timeline reforma
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ResultadoDecisao, ParametrosSimulacao } from './index';
import type { RelatorioElisao } from './elisao';
import { projetarReforma } from './projecao-reforma';

interface OpcoesRelatorio {
  empresaNome: string;
  cnpj?: string;
  parametros: ParametrosSimulacao;
  decisao: ResultadoDecisao;
  elisao?: RelatorioElisao;
  regimeAtual?: string;
  /** Inclui anexo com timeline da reforma tributária 2026-2033 */
  projetarReformaTimeline?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const pct = (v: number) => `${v.toFixed(2)}%`;

const NOME_REGIME: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

const COR_REGIME: Record<string, string> = {
  simples_nacional: '#10b981',
  lucro_presumido: '#8b5cf6',
  lucro_real: '#3b82f6',
};

function formatCnpj(cnpj?: string): string {
  if (!cnpj) return '';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Renderiza gráfico de barras horizontais dos 3 regimes em canvas off-screen. */
function gerarGraficoComparativoBase64(decisao: ResultadoDecisao): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cenarios = decisao.cenarios.filter((c) => c.elegivel);
  if (cenarios.length === 0) return null;

  const maxValor = Math.max(...cenarios.map((c) => c.totalTributos));
  const padding = { top: 60, right: 40, bottom: 40, left: 200 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;
  const barH = Math.min(60, chartH / cenarios.length - 20);

  // Fundo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Título
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Comparativo de Carga Tributária Anual', padding.left, 35);

  // Barras
  cenarios.forEach((c, i) => {
    const y = padding.top + i * (chartH / cenarios.length) + 10;
    const w = (c.totalTributos / maxValor) * chartW;
    const isReco = c.regime === decisao.recomendado.regime;

    // Label esquerda
    ctx.fillStyle = '#334155';
    ctx.font = `${isReco ? 'bold ' : ''}14px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(NOME_REGIME[c.regime] ?? c.regime, padding.left - 12, y + barH / 2 + 5);
    if (isReco) {
      ctx.fillStyle = COR_REGIME[c.regime];
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('★ RECOMENDADO', padding.left - 12, y + barH / 2 + 22);
    }

    // Barra
    ctx.fillStyle = COR_REGIME[c.regime] ?? '#64748b';
    if (!isReco) ctx.globalAlpha = 0.6;
    ctx.fillRect(padding.left, y, w, barH);
    ctx.globalAlpha = 1;

    // Valor à direita da barra
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${fmt(c.totalTributos)} (${pct(c.cargaEfetiva)})`, padding.left + w + 8, y + barH / 2 + 5);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

/** Renderiza timeline CBS+IBS 2026-2033 em canvas off-screen. */
function gerarTimelineReformaBase64(parametros: ParametrosSimulacao): string | null {
  if (typeof document === 'undefined') return null;
  const proj = projetarReforma({
    faturamentoAnual: parametros.faturamentoAnual,
    percentualServicos: parametros.percentualServicos ?? 50,
    pisCofinsAtual: 9.25,
    icmsAtual: 18,
    issAtual: 5,
  });

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 380;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const padding = { top: 60, right: 40, bottom: 50, left: 60 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  // Fundo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Título
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Projeção Reforma Tributária 2026-2033 (CBS + IBS)', padding.left, 35);

  const projecoes = proj.projecoes;
  if (projecoes.length === 0) return null;

  const maxCarga = Math.max(...projecoes.map((p) => p.cargaEfetiva), proj.cargaAtual) * 1.15;
  const xStep = chartW / Math.max(projecoes.length - 1, 1);

  // Eixo Y (grid)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${(maxCarga * (1 - i / 5)).toFixed(1)}%`, padding.left - 6, y + 3);
  }

  // Linha base atual
  const yAtual = padding.top + chartH * (1 - proj.cargaAtual / maxCarga);
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(padding.left, yAtual);
  ctx.lineTo(padding.left + chartW, yAtual);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Atual: ${proj.cargaAtual.toFixed(2)}%`, padding.left + 4, yAtual - 4);

  // Linha de projeção
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  projecoes.forEach((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH * (1 - p.cargaEfetiva / maxCarga);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Pontos + labels ano
  projecoes.forEach((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH * (1 - p.cargaEfetiva / maxCarga);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(p.ano), x, padding.top + chartH + 18);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${p.cargaEfetiva.toFixed(1)}%`, x, y - 10);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

export function gerarRelatorioPdfExecutivo(opts: OpcoesRelatorio): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================================
  // CAPA — Branding empresa
  // ============================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Faixa de destaque
  doc.setFillColor(59, 130, 246); // blue-500
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

  const justText = doc.splitTextToSize(opts.decisao.justificativa || '', pageWidth - 28);
  doc.text(justText, 14, y);
  y += justText.length * 5 + 8;

  // ===== GRÁFICO COMPARATIVO =====
  const graficoBar = gerarGraficoComparativoBase64(opts.decisao);
  if (graficoBar) {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Comparativo Visual', 14, y);
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
  doc.text('3. Detalhamento por Regime', 14, y);
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
    doc.text('4. Alertas Tributários', 14, y);
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
    doc.text('5. Oportunidades de Elisão Fiscal', 14, y);
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
      doc.text('6. Reforma Tributária 2026-2033', 14, y);
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
