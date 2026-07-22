import { openPrintWindow, writeAndPrint } from './utils';

export interface BenchmarkingGap {
  feature: string;
  status: string;
  prioridade: string;
  impacto: string;
  esforço: string;
}

export interface BenchmarkingRoadmap {
  quarter: string;
  item: string;
  descricao: string;
}

export function generateBenchmarkingPDF(
  concorrente: string,
  gaps: BenchmarkingGap[],
  roadmap: BenchmarkingRoadmap[],
): void {
  const w = openPrintWindow();
  if (!w) return;

  const gapRows = gaps
    .map(
      (g) => `
    <tr>
      <td>${g.feature}</td>
      <td><span class="badge ${g.status === 'ok' ? 'bg-green' : g.status === 'gap' ? 'bg-red' : 'bg-yellow'}">${g.status.toUpperCase()}</span></td>
      <td>${g.prioridade}</td>
      <td>${g.impacto}</td>
      <td>${g.esforço}</td>
    </tr>
  `,
    )
    .join('');

  const roadmapRows = roadmap
    .map(
      (r) => `
    <tr>
      <td><strong>${r.quarter}</strong></td>
      <td>${r.item}</td>
      <td>${r.descricao}</td>
    </tr>
  `,
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Benchmarking - ${concorrente}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
        h1 { font-size: 28px; color: #111827; margin-bottom: 5px; }
        .subtitle { color: #6b7280; margin-bottom: 30px; font-size: 14px; }
        h2 { font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .badge { padding: 2px 8px; border-radius: 4px; color: white; font-size: 10px; font-weight: bold; }
        .bg-green { background: #10b981; }
        .bg-red { background: #ef4444; }
        .bg-yellow { background: #f59e0b; }
        .section { margin-bottom: 40px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Análise Competitiva: ${concorrente}</h1>
        <p class="subtitle">Relatório gerado automaticamente pelo motor de inteligência estratégica em ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="section">
        <h2>Matriz de Gaps e Oportunidades</h2>
        <table>
          <thead><tr><th>Funcionalidade / Fluxo</th><th>Status Atual</th><th>Prioridade</th><th>Impacto</th><th>Esforço</th></tr></thead>
          <tbody>${gapRows}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Roadmap Estratégico de Melhorias</h2>
        <table>
          <thead><tr><th>Timeline</th><th>Melhoria</th><th>Descrição Estratégica</th></tr></thead>
          <tbody>${roadmapRows}</tbody>
        </table>
      </div>

      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  writeAndPrint(w, html);
}
