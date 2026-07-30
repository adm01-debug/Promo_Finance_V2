// Geração de gráficos em canvas off-screen para embutir no PDF.
import type { ResultadoDecisao, ParametrosSimulacao } from '../index';
import { projetarReforma } from '../projecao-reforma';
import { NOME_REGIME, COR_REGIME, fmt, pct } from './shared';

/** Renderiza gráfico de barras horizontais dos 3 regimes em canvas off-screen. */
export function gerarGraficoComparativoBase64(decisao: ResultadoDecisao): string | null {
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

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Comparativo de Carga Tributária Anual', padding.left, 35);

  cenarios.forEach((c, i) => {
    const y = padding.top + i * (chartH / cenarios.length) + 10;
    const w = (c.totalTributos / maxValor) * chartW;
    const isReco = c.regime === decisao.recomendado.regime;

    ctx.fillStyle = '#334155';
    ctx.font = `${isReco ? 'bold ' : ''}14px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(NOME_REGIME[c.regime] ?? c.regime, padding.left - 12, y + barH / 2 + 5);
    if (isReco) {
      ctx.fillStyle = COR_REGIME[c.regime];
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('★ RECOMENDADO', padding.left - 12, y + barH / 2 + 22);
    }

    ctx.fillStyle = COR_REGIME[c.regime] ?? '#64748b';
    if (!isReco) ctx.globalAlpha = 0.6;
    ctx.fillRect(padding.left, y, w, barH);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${fmt(c.totalTributos)} (${pct(c.cargaEfetiva)})`, padding.left + w + 8, y + barH / 2 + 5);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

/** Renderiza timeline CBS+IBS 2026-2033 em canvas off-screen. */
export function gerarTimelineReformaBase64(parametros: ParametrosSimulacao): string | null {
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

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Projeção Reforma Tributária 2026-2033 (CBS + IBS)', padding.left, 35);

  const projecoes = proj.projecoes;
  if (projecoes.length === 0) return null;

  const maxCarga = Math.max(...projecoes.map((p) => p.cargaEfetiva), proj.cargaAtual) * 1.15;
  const xStep = chartW / Math.max(projecoes.length - 1, 1);

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
