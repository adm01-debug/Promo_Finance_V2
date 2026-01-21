import { formatCurrency } from '@/lib/financial-calculations';

// Types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

interface InvoiceParty {
  name: string;
  document?: string; // CPF/CNPJ
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  series?: string;
  type: 'invoice' | 'receipt' | 'budget' | 'order';
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  issueDate: string;
  dueDate?: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  bankInfo?: {
    bankName: string;
    agency: string;
    account: string;
    pixKey?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  showLogo: boolean;
  showTerms: boolean;
  showBankInfo: boolean;
  footerText?: string;
}

// Default template
const defaultTemplate: InvoiceTemplate = {
  id: 'default',
  name: 'Padrão',
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  fontFamily: 'Inter, sans-serif',
  showLogo: true,
  showTerms: true,
  showBankInfo: true,
};

// Invoice generator service
export const invoiceService = {
  // Calculate invoice totals
  calculateTotals(items: InvoiceItem[]): {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    total: number;
  } {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTax = item.tax || 0;

      subtotal += itemTotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  },

  // Generate invoice number
  generateNumber(prefix: string = 'INV', series?: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return series
      ? `${prefix}${series}${year}${month}${random}`
      : `${prefix}${year}${month}${random}`;
  },

  // Create new invoice
  createInvoice(
    data: Omit<Invoice, 'id' | 'number' | 'subtotal' | 'totalDiscount' | 'totalTax' | 'total' | 'createdAt' | 'updatedAt'>
  ): Invoice {
    const totals = this.calculateTotals(data.items);
    const now = new Date().toISOString();

    return {
      ...data,
      ...totals,
      id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: this.generateNumber('INV', data.series),
      createdAt: now,
      updatedAt: now,
    };
  },

  // Generate HTML for invoice
  generateHTML(invoice: Invoice, template: InvoiceTemplate = defaultTemplate): string {
    const typeLabels: Record<Invoice['type'], string> = {
      invoice: 'Fatura',
      receipt: 'Recibo',
      budget: 'Orçamento',
      order: 'Pedido',
    };

    const statusLabels: Record<Invoice['status'], string> = {
      draft: 'Rascunho',
      pending: 'Pendente',
      sent: 'Enviada',
      paid: 'Paga',
      cancelled: 'Cancelada',
      overdue: 'Vencida',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${typeLabels[invoice.type]} #${invoice.number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${template.fontFamily};
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${template.primaryColor};
    }
    .logo {
      max-width: 200px;
      max-height: 80px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: bold;
      color: ${template.primaryColor};
      margin-bottom: 8px;
    }
    .invoice-number {
      font-size: 16px;
      color: #6b7280;
    }
    .invoice-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
      background: ${template.primaryColor}20;
      color: ${template.primaryColor};
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .party {
      width: 48%;
    }
    .party-label {
      font-size: 12px;
      font-weight: 600;
      color: ${template.primaryColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .party-info {
      font-size: 13px;
      color: #6b7280;
    }
    .dates {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .date-item {
      text-align: center;
    }
    .date-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .date-value {
      font-size: 14px;
      font-weight: 600;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: ${template.primaryColor};
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row.total {
      border-bottom: none;
      font-size: 18px;
      font-weight: bold;
      color: ${template.primaryColor};
      padding-top: 16px;
    }
    .notes {
      margin-bottom: 30px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .notes-label {
      font-size: 12px;
      font-weight: 600;
      color: ${template.primaryColor};
      margin-bottom: 8px;
    }
    .bank-info {
      margin-bottom: 30px;
      padding: 16px;
      background: ${template.primaryColor}10;
      border-radius: 8px;
    }
    .bank-info-label {
      font-size: 12px;
      font-weight: 600;
      color: ${template.primaryColor};
      margin-bottom: 8px;
    }
    .bank-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .bank-info-item {
      font-size: 13px;
    }
    .bank-info-item strong {
      color: #6b7280;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .invoice {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        ${template.showLogo && template.logo ? `<img src="${template.logo}" class="logo" alt="Logo">` : ''}
        <div class="party-name" style="margin-top: ${template.logo ? '16px' : '0'}">${invoice.seller.name}</div>
        ${invoice.seller.document ? `<div class="party-info">${this.formatDocument(invoice.seller.document)}</div>` : ''}
      </div>
      <div class="invoice-info">
        <div class="invoice-title">${typeLabels[invoice.type]}</div>
        <div class="invoice-number">#${invoice.number}</div>
        <div class="invoice-status">${statusLabels[invoice.status]}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Emitente</div>
        <div class="party-name">${invoice.seller.name}</div>
        ${invoice.seller.document ? `<div class="party-info">${this.formatDocument(invoice.seller.document)}</div>` : ''}
        ${invoice.seller.email ? `<div class="party-info">${invoice.seller.email}</div>` : ''}
        ${invoice.seller.phone ? `<div class="party-info">${invoice.seller.phone}</div>` : ''}
        ${invoice.seller.address ? `
          <div class="party-info">
            ${invoice.seller.address.street}, ${invoice.seller.address.number}
            ${invoice.seller.address.complement ? ` - ${invoice.seller.address.complement}` : ''}
          </div>
          <div class="party-info">
            ${invoice.seller.address.neighborhood} - ${invoice.seller.address.city}/${invoice.seller.address.state}
          </div>
          <div class="party-info">CEP: ${invoice.seller.address.zipCode}</div>
        ` : ''}
      </div>
      <div class="party">
        <div class="party-label">Cliente</div>
        <div class="party-name">${invoice.buyer.name}</div>
        ${invoice.buyer.document ? `<div class="party-info">${this.formatDocument(invoice.buyer.document)}</div>` : ''}
        ${invoice.buyer.email ? `<div class="party-info">${invoice.buyer.email}</div>` : ''}
        ${invoice.buyer.phone ? `<div class="party-info">${invoice.buyer.phone}</div>` : ''}
        ${invoice.buyer.address ? `
          <div class="party-info">
            ${invoice.buyer.address.street}, ${invoice.buyer.address.number}
            ${invoice.buyer.address.complement ? ` - ${invoice.buyer.address.complement}` : ''}
          </div>
          <div class="party-info">
            ${invoice.buyer.address.neighborhood} - ${invoice.buyer.address.city}/${invoice.buyer.address.state}
          </div>
          <div class="party-info">CEP: ${invoice.buyer.address.zipCode}</div>
        ` : ''}
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <div class="date-label">Data de Emissão</div>
        <div class="date-value">${this.formatDate(invoice.issueDate)}</div>
      </div>
      ${invoice.dueDate ? `
        <div class="date-item">
          <div class="date-label">Data de Vencimento</div>
          <div class="date-value">${this.formatDate(invoice.dueDate)}</div>
        </div>
      ` : ''}
      ${invoice.paymentMethod ? `
        <div class="date-item">
          <div class="date-label">Forma de Pagamento</div>
          <div class="date-value">${invoice.paymentMethod}</div>
        </div>
      ` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th class="text-right">Qtd</th>
          <th class="text-right">Preço Unit.</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item) => `
          <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.totalDiscount > 0 ? `
          <div class="totals-row">
            <span>Desconto</span>
            <span>-${formatCurrency(invoice.totalDiscount)}</span>
          </div>
        ` : ''}
        ${invoice.totalTax > 0 ? `
          <div class="totals-row">
            <span>Impostos</span>
            <span>${formatCurrency(invoice.totalTax)}</span>
          </div>
        ` : ''}
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes && template.showTerms ? `
      <div class="notes">
        <div class="notes-label">Observações</div>
        <div>${invoice.notes}</div>
      </div>
    ` : ''}

    ${invoice.bankInfo && template.showBankInfo ? `
      <div class="bank-info">
        <div class="bank-info-label">Dados Bancários</div>
        <div class="bank-info-grid">
          <div class="bank-info-item"><strong>Banco:</strong> ${invoice.bankInfo.bankName}</div>
          <div class="bank-info-item"><strong>Agência:</strong> ${invoice.bankInfo.agency}</div>
          <div class="bank-info-item"><strong>Conta:</strong> ${invoice.bankInfo.account}</div>
          ${invoice.bankInfo.pixKey ? `<div class="bank-info-item"><strong>PIX:</strong> ${invoice.bankInfo.pixKey}</div>` : ''}
        </div>
      </div>
    ` : ''}

    ${template.footerText ? `
      <div class="footer">${template.footerText}</div>
    ` : ''}
  </div>
</body>
</html>
    `.trim();
  },

  // Format document (CPF/CNPJ)
  formatDocument(doc: string): string {
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  },

  // Format date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  // Download invoice as PDF (using browser print)
  downloadPDF(invoice: Invoice, template?: InvoiceTemplate): void {
    const html = this.generateHTML(invoice, template);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  },
};

export type { Invoice, InvoiceItem, InvoiceParty, InvoiceTemplate };
export default invoiceService;
