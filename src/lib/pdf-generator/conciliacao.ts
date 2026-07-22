import { formatCurrency, formatDate } from '../formatters';
import { openPrintWindow, writeAndPrint } from './utils';

export interface ConciliacaoAuditRow {
  evento: string;
  valor: number;
  responsavel: string;
  data: string;
  regra: string;
  classificacao?: string;
  evidencia_url?: string;
}

export interface ConciliacaoAuditFiltros {
  user?: string;
  conta?: string;
  inicio?: string;
  fim?: string;
  classificacao?: string;
}

export function generateConciliacaoAuditPDF(
  dados: ConciliacaoAuditRow[],
  filtros: ConciliacaoAuditFiltros,
): void {
  const w = openPrintWindow();
  if (!w) return;

  const rows = dados
    .map(
      (d) => `
    <tr>
      <td>
        <div class="font-bold">${d.evento}</div>
        <div class="text-[10px] text-gray-500">${d.classificacao || ''}</div>
      </td>
      <td class="valor ${d.valor >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.valor)}</td>
      <td>${d.responsavel}</td>
      <td>${formatDate(d.data)}</td>
      <td class="text-xs">${d.regra}</td>
      <td class="text-center">${d.evidencia_url ? '<span class="text-blue-600">Sim</span>' : '<span class="text-gray-400">Não</span>'}</td>
    </tr>
  `,
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Auditoria de Conciliação</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .filters { font-size: 12px; color: #666; margin-bottom: 20px; display: grid; grid-template-cols: 1fr 1fr; gap: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 11px; }
        th { background: #f8f9fa; font-weight: bold; text-transform: uppercase; }
        .valor { text-align: right; font-weight: bold; }
        .positivo { color: #2e7d32; }
        .negativo { color: #d32f2f; }
        @media print { @page { margin: 1.5cm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Auditoria de Conciliação</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div class="filters">
        <div><strong>Período:</strong> ${filtros.inicio || 'Início'} até ${filtros.fim || 'Fim'}</div>
        <div><strong>Conta:</strong> ${filtros.conta || 'Todas'}</div>
        <div><strong>Usuário:</strong> ${filtros.user || 'Todos'}</div>
        <div><strong>Classificação:</strong> ${filtros.classificacao || 'Todas'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Evento / Lançamento</th>
            <th class="valor">Valor Ajuste</th>
            <th>Responsável</th>
            <th>Data/Hora</th>
            <th>Regra Aplicada</th>
            <th class="text-center">Evidência</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  writeAndPrint(w, html);
}
