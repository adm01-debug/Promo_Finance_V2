/**
 * Print Utilities
 * Print reports, receipts, and documents
 */

interface PrintOptions {
  title?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  header?: string;
  footer?: string;
  showPageNumbers?: boolean;
  styles?: string;
}

/**
 * Print HTML content
 */
export function printHTML(content: string, options: PrintOptions = {}): void {
  const {
    title = 'Promo Finance',
    pageSize = 'A4',
    orientation = 'portrait',
    margins = { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    header,
    footer,
    showPageNumbers = true,
    styles = '',
  } = options;

  // Create print window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  // Build page styles
  const pageStyles = `
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-print {
        display: none !important;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .page-break-before {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
      
      ${showPageNumbers ? `
        @bottom-center {
          content: counter(page) " / " counter(pages);
        }
      ` : ''}
    }
  `;

  // Build header/footer
  const headerHTML = header ? `
    <header class="print-header">
      ${header}
    </header>
  ` : '';

  const footerHTML = footer ? `
    <footer class="print-footer">
      ${footer}
    </footer>
  ` : '';

  // Build document
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        /* Reset */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #1f2937;
        }
        
        /* Print header/footer */
        .print-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 10mm;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10mm;
          background: white;
          border-top: 1px solid #e5e7eb;
          font-size: 10pt;
          text-align: center;
        }
        
        /* Content */
        .print-content {
          ${header ? 'padding-top: 30mm;' : ''}
          ${footer ? 'padding-bottom: 20mm;' : ''}
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        th {
          background: #f9fafb;
          font-weight: 600;
        }
        
        /* Typography */
        h1 { font-size: 24pt; margin-bottom: 10px; }
        h2 { font-size: 18pt; margin-bottom: 8px; }
        h3 { font-size: 14pt; margin-bottom: 6px; }
        p { margin-bottom: 8px; }
        
        /* Utilities */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .text-sm { font-size: 10pt; }
        .text-lg { font-size: 14pt; }
        .text-muted { color: #6b7280; }
        .text-success { color: #059669; }
        .text-danger { color: #dc2626; }
        .mt-4 { margin-top: 16px; }
        .mb-4 { margin-bottom: 16px; }
        
        /* Custom styles */
        ${styles}
        
        /* Page styles */
        ${pageStyles}
      </style>
    </head>
    <body>
      ${headerHTML}
      <main class="print-content">
        ${content}
      </main>
      ${footerHTML}
    </body>
    </html>
  `;

  // Write content
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close after printing (with delay for some browsers)
    setTimeout(() => printWindow.close(), 500);
  };
}

/**
 * Print an element by ID
 */
export function printElement(elementId: string, options: PrintOptions = {}): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }
  printHTML(element.innerHTML, options);
}

/**
 * Print table data
 */
export function printTable<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string; formatter?: (value: unknown) => string }>,
  options: PrintOptions & { tableTitle?: string } = {}
): void {
  const { tableTitle, ...printOptions } = options;

  // Build table HTML
  const headers = columns.map((col) => `<th>${col.header}</th>`).join('');
  
  const rows = data.map((row) => {
    const cells = columns.map((col) => {
      const value = row[col.key];
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
      return `<td>${formatted}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const content = `
    ${tableTitle ? `<h1>${tableTitle}</h1>` : ''}
    <table>
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p class="text-sm text-muted mt-4">
      Total de registros: ${data.length} | 
      Impresso em: ${new Date().toLocaleString('pt-BR')}
    </p>
  `;

  printHTML(content, printOptions);
}

/**
 * Print receipt
 */
export function printReceipt(data: {
  title: string;
  subtitle?: string;
  items: Array<{ label: string; value: string }>;
  total?: { label: string; value: string };
  footer?: string;
}): void {
  const itemsHTML = data.items
    .map((item) => `
      <div class="receipt-item">
        <span>${item.label}</span>
        <span>${item.value}</span>
      </div>
    `)
    .join('');

  const content = `
    <div class="receipt">
      <div class="receipt-header">
        <h2>${data.title}</h2>
        ${data.subtitle ? `<p>${data.subtitle}</p>` : ''}
      </div>
      
      <div class="receipt-body">
        ${itemsHTML}
      </div>
      
      ${data.total ? `
        <div class="receipt-total">
          <span>${data.total.label}</span>
          <span>${data.total.value}</span>
        </div>
      ` : ''}
      
      ${data.footer ? `
        <div class="receipt-footer">
          <p>${data.footer}</p>
        </div>
      ` : ''}
      
      <p class="receipt-timestamp">
        ${new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;

  const styles = `
    .receipt {
      max-width: 300px;
      margin: 0 auto;
      font-family: 'Courier New', monospace;
    }
    
    .receipt-header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
      margin-bottom: 10px;
    }
    
    .receipt-header h2 {
      font-size: 16pt;
      margin-bottom: 5px;
    }
    
    .receipt-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 10pt;
    }
    
    .receipt-total {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px dashed #000;
      margin-top: 10px;
      font-weight: bold;
      font-size: 12pt;
    }
    
    .receipt-footer {
      text-align: center;
      padding-top: 10px;
      border-top: 1px dashed #000;
      margin-top: 10px;
      font-size: 9pt;
    }
    
    .receipt-timestamp {
      text-align: center;
      font-size: 8pt;
      margin-top: 10px;
      color: #666;
    }
  `;

  printHTML(content, { 
    title: data.title,
    pageSize: 'A4',
    styles,
  });
}

/**
 * Print financial report
 */
export function printFinancialReport(data: {
  title: string;
  period: string;
  company?: string;
  sections: Array<{
    title: string;
    items: Array<{ label: string; value: number }>;
    total?: { label: string; value: number };
  }>;
  summary?: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
}): void {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const sectionsHTML = data.sections
    .map((section) => {
      const itemsHTML = section.items
        .map((item) => `
          <tr>
            <td>${item.label}</td>
            <td class="text-right">${formatCurrency(item.value)}</td>
          </tr>
        `)
        .join('');

      return `
        <div class="report-section avoid-break">
          <h3>${section.title}</h3>
          <table>
            <tbody>
              ${itemsHTML}
            </tbody>
            ${section.total ? `
              <tfoot>
                <tr class="font-bold">
                  <td>${section.total.label}</td>
                  <td class="text-right">${formatCurrency(section.total.value)}</td>
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      `;
    })
    .join('');

  const summaryHTML = data.summary ? `
    <div class="report-summary avoid-break">
      <h3>Resumo</h3>
      <table>
        <tbody>
          <tr>
            <td>Total de Receitas</td>
            <td class="text-right text-success">${formatCurrency(data.summary.receitas)}</td>
          </tr>
          <tr>
            <td>Total de Despesas</td>
            <td class="text-right text-danger">${formatCurrency(data.summary.despesas)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-bold">
            <td>Saldo</td>
            <td class="text-right ${data.summary.saldo >= 0 ? 'text-success' : 'text-danger'}">
              ${formatCurrency(data.summary.saldo)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  ` : '';

  const content = `
    <div class="report">
      <div class="report-header">
        ${data.company ? `<p class="text-muted">${data.company}</p>` : ''}
        <h1>${data.title}</h1>
        <p>Período: ${data.period}</p>
      </div>
      
      ${sectionsHTML}
      
      ${summaryHTML}
    </div>
  `;

  const styles = `
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .report-section {
      margin-bottom: 30px;
    }
    
    .report-section h3 {
      background: #f9fafb;
      padding: 10px;
      margin-bottom: 0;
    }
    
    .report-summary {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    
    .report-summary h3 {
      background: #1f2937;
      color: white;
    }
  `;

  printHTML(content, {
    title: data.title,
    orientation: 'portrait',
    styles,
    footer: `Finance Hub - Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
  });
}

export default printHTML;
