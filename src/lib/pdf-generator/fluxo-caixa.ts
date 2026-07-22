import { formatCurrency, formatDate, todayISOLocal } from '../formatters';
import { openPrintWindow, writeAndPrint } from './utils';

export interface FluxoCaixaRow {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function generateFluxoCaixaPDF(dados: FluxoCaixaRow[], titulo: string = 'Fluxo de Caixa'): void {
  const w = openPrintWindow();
  if (!w) return;

  const totalReceitas = dados.reduce((sum, d) => sum + d.receitas, 0);
  const totalDespesas = dados.reduce((sum, d) => sum + d.despesas, 0);
  const saldoFinal = dados.length > 0 ? dados[dados.length - 1].saldo : 0;

  const rows = dados
    .map(
      (d) => `
    <tr>
      <td>${formatDate(d.data)}</td>
      <td class="valor positivo">${formatCurrency(d.receitas)}</td>
      <td class="valor negativo">${formatCurrency(d.despesas)}</td>
      <td class="valor ${d.receitas - d.despesas >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.receitas - d.despesas)}</td>
      <td class="valor ${d.saldo >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.saldo)}</td>
    </tr>
  `,
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #111; }
        h1 { font-size: 24px; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { padding: 15px; border-radius: 8px; flex: 1; }
        .summary-card.receitas { background: #dcfce7; }
        .summary-card.despesas { background: #fee2e2; }
        .summary-card.saldo { background: #dbeafe; }
        .summary-card label { font-size: 12px; color: #666; }
        .summary-card .value { font-size: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .valor { text-align: right; font-family: monospace; }
        .positivo { color: #16a34a; }
        .negativo { color: #dc2626; }
        @media print { body { padding: 0; } @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p class="subtitle">Gerado em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}</p>

      <div class="summary">
        <div class="summary-card receitas"><label>Total Receitas</label><div class="value positivo">${formatCurrency(totalReceitas)}</div></div>
        <div class="summary-card despesas"><label>Total Despesas</label><div class="value negativo">${formatCurrency(totalDespesas)}</div></div>
        <div class="summary-card saldo"><label>Saldo Final</label><div class="value ${saldoFinal >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(saldoFinal)}</div></div>
      </div>

      <table>
        <thead><tr><th>Data</th><th class="valor">Receitas</th><th class="valor">Despesas</th><th class="valor">Líquido</th><th class="valor">Saldo Acumulado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  writeAndPrint(w, html);
}

export function generateFluxoCaixaCSV(dados: FluxoCaixaRow[]): void {
  const BOM = '\uFEFF';
  const headers = ['Data', 'Receitas', 'Despesas', 'Líquido', 'Saldo Acumulado'];
  const rows = dados.map((d) => [
    d.data,
    d.receitas.toString().replace('.', ','),
    d.despesas.toString().replace('.', ','),
    (d.receitas - d.despesas).toString().replace('.', ','),
    d.saldo.toString().replace('.', ','),
  ]);

  const csvContent =
    BOM +
    headers.map((h) => `"${h}"`).join(';') +
    '\n' +
    rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fluxo_caixa_${todayISOLocal()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
