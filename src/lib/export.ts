import { formatCurrency, formatDate } from './formatters';

// Types
export interface ExportColumn<T = any> {
  key: string;
  header: string;
  accessor: (row: T) => any;
  format?: 'currency' | 'date' | 'percent' | 'number' | 'text';
  width?: number;
}

export interface ExportConfig<T = any> {
  filename: string;
  title?: string;
  columns: ExportColumn<T>[];
  data: T[];
  includeHeader?: boolean;
  includeSummary?: boolean;
}

// Format value for export
function formatExportValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '';
  
  switch (format) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'date':
      return formatDate(value);
    case 'percent':
      return `${(Number(value) * 100).toFixed(2)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(Number(value));
    default:
      return String(value);
  }
}

// Escape CSV value
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T>(config: ExportConfig<T>): void {
  const { filename, columns, data, includeHeader = true } = config;

  const rows: string[] = [];

  // Header row
  if (includeHeader) {
    const headerRow = columns.map((col) => escapeCSV(col.header)).join(',');
    rows.push(headerRow);
  }

  // Data rows
  data.forEach((item) => {
    const row = columns
      .map((col) => escapeCSV(formatExportValue(col.accessor(item), col.format)))
      .join(',');
    rows.push(row);
  });

  // Create blob and download
  const csvContent = '\uFEFF' + rows.join('\n'); // BOM for UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format (using XML spreadsheet format)
 */
export function exportToExcel<T>(config: ExportConfig<T>): void {
  const { filename, title, columns, data } = config;

  // XML Spreadsheet template
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="R$ #,##0.00"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="dd/mm/yyyy"/>
    </Style>
    <Style ss:ID="Percent">
      <NumberFormat ss:Format="0.00%"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${title || 'Dados'}">
    <Table>`;

  // Column widths
  columns.forEach((col) => {
    xml += `<Column ss:Width="${col.width || 100}"/>`;
  });

  // Title row
  if (title) {
    xml += `
      <Row>
        <Cell ss:StyleID="Title" ss:MergeAcross="${columns.length - 1}">
          <Data ss:Type="String">${escapeXML(title)}</Data>
        </Cell>
      </Row>
      <Row></Row>`;
  }

  // Header row
  xml += '<Row>';
  columns.forEach((col) => {
    xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`;
  });
  xml += '</Row>';

  // Data rows
  data.forEach((item) => {
    xml += '<Row>';
    columns.forEach((col) => {
      const value = col.accessor(item);
      const { type, formattedValue, styleId } = getExcelCellData(value, col.format);
      xml += `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="${type}">${escapeXML(formattedValue)}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += `
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}.xls`);
}

// Helper for Excel cell data
function getExcelCellData(value: any, format?: string): { type: string; formattedValue: string; styleId?: string } {
  if (value === null || value === undefined) {
    return { type: 'String', formattedValue: '' };
  }

  switch (format) {
    case 'currency':
      return { type: 'Number', formattedValue: String(Number(value)), styleId: 'Currency' };
    case 'date':
      const date = new Date(value);
      return { type: 'DateTime', formattedValue: date.toISOString(), styleId: 'Date' };
    case 'percent':
      return { type: 'Number', formattedValue: String(Number(value)), styleId: 'Percent' };
    case 'number':
      return { type: 'Number', formattedValue: String(Number(value)) };
    default:
      return { type: 'String', formattedValue: String(value) };
  }
}

// Escape XML special characters
function escapeXML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export data to PDF format (generates HTML for printing)
 */
export function exportToPDF<T>(config: ExportConfig<T>): void {
  const { filename, title, columns, data, includeSummary } = config;

  // Generate HTML content
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || filename}</title>
  <style>
    @page { margin: 1cm; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }
    .title { 
      font-size: 18px; 
      font-weight: bold;
      margin: 0;
    }
    .subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse;
      margin-top: 10px;
    }
    th { 
      background: #f0f0f0; 
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
      font-weight: bold;
    }
    td { 
      padding: 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) { background: #fafafa; }
    .currency { text-align: right; }
    .number { text-align: right; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
    }
    .summary {
      margin-top: 15px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${title || filename}</h1>
    <div class="subtitle">Gerado em: ${formatDate(new Date())}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        ${columns.map((col) => `<th>${col.header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((item) => `
        <tr>
          ${columns.map((col) => {
            const value = formatExportValue(col.accessor(item), col.format);
            const align = col.format === 'currency' || col.format === 'number' ? 'currency' : '';
            return `<td class="${align}">${value}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>`;

  // Summary section
  if (includeSummary) {
    const currencyColumns = columns.filter((c) => c.format === 'currency');
    if (currencyColumns.length > 0) {
      html += `
      <div class="summary">
        <strong>Resumo:</strong><br>
        Total de registros: ${data.length}<br>
        ${currencyColumns.map((col) => {
          const sum = data.reduce((acc, item) => acc + (Number(col.accessor(item)) || 0), 0);
          return `${col.header}: ${formatCurrency(sum)}`;
        }).join('<br>')}
      </div>`;
    }
  }

  html += `
  <div class="footer">
    <div>Total de registros: ${data.length}</div>
    <div>Documento gerado automaticamente pelo Finance-Hub</div>
  </div>
  
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(config: ExportConfig<T>): void {
  const { filename, data } = config;
  
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Helper to download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export hook for easy use in components
 */
export function useExport<T>() {
  const exportData = (format: 'csv' | 'excel' | 'pdf' | 'json', config: ExportConfig<T>) => {
    switch (format) {
      case 'csv':
        exportToCSV(config);
        break;
      case 'excel':
        exportToExcel(config);
        break;
      case 'pdf':
        exportToPDF(config);
        break;
      case 'json':
        exportToJSON(config);
        break;
    }
  };

  return { exportData, exportToCSV, exportToExcel, exportToPDF, exportToJSON };
}

// Preset export configs
export const exportPresets = {
  contasPagar: (data: any[]): ExportConfig => ({
    filename: `contas-pagar-${formatDate(new Date()).replace(/\//g, '-')}`,
    title: 'Relatório de Contas a Pagar',
    columns: [
      { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao, width: 200 },
      { key: 'fornecedor', header: 'Fornecedor', accessor: (r) => r.fornecedor?.nome || '', width: 150 },
      { key: 'valor', header: 'Valor', accessor: (r) => r.valor, format: 'currency', width: 100 },
      { key: 'vencimento', header: 'Vencimento', accessor: (r) => r.dataVencimento, format: 'date', width: 100 },
      { key: 'status', header: 'Status', accessor: (r) => r.status, width: 80 },
    ],
    data,
    includeSummary: true,
  }),

  contasReceber: (data: any[]): ExportConfig => ({
    filename: `contas-receber-${formatDate(new Date()).replace(/\//g, '-')}`,
    title: 'Relatório de Contas a Receber',
    columns: [
      { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao, width: 200 },
      { key: 'cliente', header: 'Cliente', accessor: (r) => r.cliente?.nome || '', width: 150 },
      { key: 'valor', header: 'Valor', accessor: (r) => r.valor, format: 'currency', width: 100 },
      { key: 'vencimento', header: 'Vencimento', accessor: (r) => r.dataVencimento, format: 'date', width: 100 },
      { key: 'status', header: 'Status', accessor: (r) => r.status, width: 80 },
    ],
    data,
    includeSummary: true,
  }),

  clientes: (data: any[]): ExportConfig => ({
    filename: `clientes-${formatDate(new Date()).replace(/\//g, '-')}`,
    title: 'Lista de Clientes',
    columns: [
      { key: 'nome', header: 'Nome', accessor: (r) => r.nome, width: 200 },
      { key: 'documento', header: 'CPF/CNPJ', accessor: (r) => r.cpf || r.cnpj || '', width: 120 },
      { key: 'email', header: 'E-mail', accessor: (r) => r.email, width: 180 },
      { key: 'telefone', header: 'Telefone', accessor: (r) => r.telefone, width: 100 },
      { key: 'cidade', header: 'Cidade', accessor: (r) => r.cidade || '', width: 120 },
    ],
    data,
  }),

  fornecedores: (data: any[]): ExportConfig => ({
    filename: `fornecedores-${formatDate(new Date()).replace(/\//g, '-')}`,
    title: 'Lista de Fornecedores',
    columns: [
      { key: 'razaoSocial', header: 'Razão Social', accessor: (r) => r.razaoSocial, width: 200 },
      { key: 'cnpj', header: 'CNPJ', accessor: (r) => r.cnpj, width: 120 },
      { key: 'email', header: 'E-mail', accessor: (r) => r.email, width: 180 },
      { key: 'telefone', header: 'Telefone', accessor: (r) => r.telefone, width: 100 },
      { key: 'cidade', header: 'Cidade', accessor: (r) => r.cidade || '', width: 120 },
    ],
    data,
  }),
};
