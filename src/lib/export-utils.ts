// Utilitários para exportação de dados em PDF e Excel (CSV)

import { formatCurrency, formatDate } from './formatters';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string;
}

// Exportar para CSV (Excel compatível)
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // BOM para UTF-8 (Excel reconhecer acentos)
  const BOM = '\uFEFF';
  
  // Header
  const headers = columns.map(col => `"${col.header}"`).join(';');
  
  // Rows
  const rows = data.map(row => {
    return columns.map(col => {
      const keys = col.key.toString().split('.');
      let value: any = row;
      for (const k of keys) {
        value = value?.[k];
      }
      
      if (col.formatter) {
        value = col.formatter(value, row);
      } else if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'number') {
        value = value.toString().replace('.', ',');
      }
      
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(';');
  });
  
  const csvContent = BOM + headers + '\n' + rows.join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Exportar para PDF (usando print do browser)
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string
): void {
  // Criar HTML para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para exportar PDF');
    return;
  }
  
  const tableRows = data.map(row => {
    const cells = columns.map(col => {
      const keys = col.key.toString().split('.');
      let value: any = row;
      for (const k of keys) {
        value = value?.[k];
      }
      
      if (col.formatter) {
        value = col.formatter(value, row);
      } else if (value === null || value === undefined) {
        value = '-';
      }
      
      return `<td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${value}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  
  const tableHeaders = columns.map(col => 
    `<th style="padding: 10px 12px; border-bottom: 2px solid #374151; text-align: left; font-weight: 600; background: #f9fafb;">${col.header}</th>`
  ).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #111827; }
        .date { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        tr:nth-child(even) { background: #f9fafb; }
        @media print {
          body { padding: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="date">Gerado em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// Configurações de colunas pré-definidas para entidades comuns
export const contasPagarColumns: ExportColumn<any>[] = [
  { key: 'fornecedor_nome', header: 'Fornecedor' },
  { key: 'descricao', header: 'Descrição' },
  { key: 'valor', header: 'Valor', formatter: (v) => formatCurrency(v) },
  { key: 'data_vencimento', header: 'Vencimento', formatter: (v) => formatDate(v) },
  { key: 'status', header: 'Status', formatter: (v) => v?.toUpperCase() || '-' },
  { key: 'centro_custo.nome', header: 'Centro de Custo' },
];

export const contasReceberColumns: ExportColumn<any>[] = [
  { key: 'cliente_nome', header: 'Cliente' },
  { key: 'descricao', header: 'Descrição' },
  { key: 'valor', header: 'Valor', formatter: (v) => formatCurrency(v) },
  { key: 'data_vencimento', header: 'Vencimento', formatter: (v) => formatDate(v) },
  { key: 'status', header: 'Status', formatter: (v) => v?.toUpperCase() || '-' },
  { key: 'valor_recebido', header: 'Valor Recebido', formatter: (v) => formatCurrency(v || 0) },
];

export const clientesColumns: ExportColumn<any>[] = [
  { key: 'razao_social', header: 'Razão Social' },
  { key: 'nome_fantasia', header: 'Nome Fantasia' },
  { key: 'cnpj_cpf', header: 'CNPJ/CPF' },
  { key: 'email', header: 'E-mail' },
  { key: 'telefone', header: 'Telefone' },
  { key: 'cidade', header: 'Cidade' },
  { key: 'estado', header: 'UF' },
  { key: 'score', header: 'Score' },
  { key: 'limite_credito', header: 'Limite de Crédito', formatter: (v) => formatCurrency(v || 0) },
];

export const fornecedoresColumns: ExportColumn<any>[] = [
  { key: 'razao_social', header: 'Razão Social' },
  { key: 'nome_fantasia', header: 'Nome Fantasia' },
  { key: 'cnpj_cpf', header: 'CNPJ/CPF' },
  { key: 'email', header: 'E-mail' },
  { key: 'telefone', header: 'Telefone' },
  { key: 'cidade', header: 'Cidade' },
  { key: 'estado', header: 'UF' },
];
