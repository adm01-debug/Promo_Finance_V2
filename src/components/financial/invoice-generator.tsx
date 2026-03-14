import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  FileText,
  Send,
  Download,
  Printer,
  Copy,
  Trash2,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';
import { Button } from '@/components/ui/button';

// Types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  total: number;
}

interface InvoiceData {
  id?: string;
  number: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  client: {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  company: {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  taxType?: 'percentage' | 'fixed';
  total: number;
  notes?: string;
  paymentInfo?: string;
}

interface InvoiceGeneratorProps {
  invoice?: Partial<InvoiceData>;
  companyDefaults?: InvoiceData['company'];
  onSave?: (invoice: InvoiceData) => void;
  onSend?: (invoice: InvoiceData) => void;
  onDownload?: (invoice: InvoiceData) => void;
  onPrint?: (invoice: InvoiceData) => void;
}

// Generate unique ID
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default empty item
const createEmptyItem = (): InvoiceItem => ({
  id: generateId(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
});

export function InvoiceGenerator({
  invoice: initialInvoice,
  companyDefaults,
  onSave,
  onSend,
  onDownload,
  onPrint,
}: InvoiceGeneratorProps) {
  // Initialize state
  const [invoice, setInvoice] = useState<Partial<InvoiceData>>(() => ({
    number: `INV-${Date.now().toString(36).toUpperCase()}`,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'draft',
    client: { name: '' },
    company: companyDefaults || { name: '' },
    items: [createEmptyItem()],
    subtotal: 0,
    total: 0,
    ...initialInvoice,
  }));

  // Calculate totals
  const calculations = useMemo(() => {
    const items = invoice.items || [];
    
    // Calculate item totals
    const updatedItems = items.map(item => {
      let itemTotal = item.quantity * item.unitPrice;
      if (item.discount) {
        if (item.discountType === 'percentage') {
          itemTotal -= (itemTotal * item.discount) / 100;
        } else {
          itemTotal -= item.discount;
        }
      }
      return { ...item, total: Math.max(0, itemTotal) };
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    // Apply invoice discount
    let afterDiscount = subtotal;
    if (invoice.discount) {
      if (invoice.discountType === 'percentage') {
        afterDiscount -= (subtotal * invoice.discount) / 100;
      } else {
        afterDiscount -= invoice.discount;
      }
    }

    // Apply tax
    let total = afterDiscount;
    let taxAmount = 0;
    if (invoice.tax) {
      if (invoice.taxType === 'percentage') {
        taxAmount = (afterDiscount * invoice.tax) / 100;
      } else {
        taxAmount = invoice.tax;
      }
      total += taxAmount;
    }

    return {
      items: updatedItems,
      subtotal,
      discountAmount: subtotal - afterDiscount,
      taxAmount,
      total: Math.max(0, total),
    };
  }, [invoice.items, invoice.discount, invoice.discountType, invoice.tax, invoice.taxType]);

  // Update item
  const updateItem = useCallback((id: string, updates: Partial<InvoiceItem>) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  // Add item
  const addItem = useCallback(() => {
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), createEmptyItem()],
    }));
  }, []);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== id),
    }));
  }, []);

  // Duplicate item
  const duplicateItem = useCallback((id: string) => {
    setInvoice(prev => {
      const itemToCopy = prev.items?.find(item => item.id === id);
      if (!itemToCopy) return prev;
      
      const newItem = { ...itemToCopy, id: generateId() };
      const itemIndex = prev.items?.findIndex(item => item.id === id) ?? 0;
      const newItems = [...(prev.items || [])];
      newItems.splice(itemIndex + 1, 0, newItem);
      
      return { ...prev, items: newItems };
    });
  }, []);

  // Build final invoice
  const buildInvoice = useCallback((): InvoiceData => {
    return {
      ...invoice,
      items: calculations.items,
      subtotal: calculations.subtotal,
      total: calculations.total,
    } as InvoiceData;
  }, [invoice, calculations]);

  // Handlers
  const handleSave = () => onSave?.(buildInvoice());
  const handleSend = () => onSend?.(buildInvoice());
  const handleDownload = () => onDownload?.(buildInvoice());
  const handlePrint = () => onPrint?.(buildInvoice());

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-xl shadow-lg border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {invoice.id ? 'Editar Fatura' : 'Nova Fatura'}
            </h2>
            <p className="text-sm text-muted-foreground">#{invoice.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button size="sm" onClick={handleSend}>
            <Send className="w-4 h-4 mr-1" />
            Enviar
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Client & Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Cliente
            </h3>
            <input
              type="text"
              value={invoice.client?.name || ''}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, name: e.target.value },
              }))}
              placeholder="Nome do cliente"
               className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
            />
            <input
              type="text"
              value={invoice.client?.document || ''}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, document: e.target.value },
              }))}
              placeholder="CPF/CNPJ"
               className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
            />
            <input
              type="email"
              value={invoice.client?.email || ''}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, email: e.target.value },
              }))}
              placeholder="Email"
               className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
            />
          </div>

          {/* Invoice Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Informações da Fatura
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Data Emissão</label>
                <input
                  type="date"
                  value={invoice.issueDate?.toISOString().split('T')[0]}
                  onChange={(e) => setInvoice(prev => ({
                    ...prev,
                    issueDate: new Date(e.target.value),
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Vencimento</label>
                <input
                  type="date"
                  value={invoice.dueDate?.toISOString().split('T')[0]}
                  onChange={(e) => setInvoice(prev => ({
                    ...prev,
                    dueDate: new Date(e.target.value),
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Itens
            </h3>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
              <div className="col-span-5">Descrição</div>
              <div className="col-span-2 text-center">Qtd</div>
              <div className="col-span-2 text-right">Preço Unit.</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
              {calculations.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Descrição do item"
                      className="w-full px-2 py-1 border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                      min={1}
                      className="w-full px-2 py-1 text-center border border-border rounded bg-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                      min={0}
                      step={0.01}
                      className="w-full px-2 py-1 text-right border border-border rounded bg-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">
                    {formatCurrency(item.total)}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      onClick={() => duplicateItem(item.id)}
                      className="p-1 hover:bg-muted rounded"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-destructive/10 rounded"
                      title="Remover"
                      disabled={(invoice.items?.length || 0) <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex-1">Desconto</span>
              <select
                value={invoice.discountType || 'percentage'}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  discountType: e.target.value as 'percentage' | 'fixed',
                }))}
                 className="px-2 py-1 border border-border rounded text-sm bg-transparent"
              >
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
              <input
                type="number"
                value={invoice.discount || 0}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  discount: Number(e.target.value),
                }))}
                min={0}
                className="w-20 px-2 py-1 text-right border border-gray-200 dark:border-gray-700 rounded text-sm bg-transparent"
              />
            </div>
            {calculations.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span></span>
                <span>-{formatCurrency(calculations.discountAmount)}</span>
              </div>
            )}

            {/* Tax */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">Impostos</span>
              <select
                value={invoice.taxType || 'percentage'}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  taxType: e.target.value as 'percentage' | 'fixed',
                }))}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-transparent"
              >
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
              <input
                type="number"
                value={invoice.tax || 0}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  tax: Number(e.target.value),
                }))}
                min={0}
                className="w-20 px-2 py-1 text-right border border-gray-200 dark:border-gray-700 rounded text-sm bg-transparent"
              />
            </div>
            {calculations.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span></span>
                <span>+{formatCurrency(calculations.taxAmount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(calculations.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            value={invoice.notes || ''}
            onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Observações, termos e condições..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent resize-none"
          />
        </div>

        {/* Payment Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Informações de Pagamento
          </label>
          <textarea
            value={invoice.paymentInfo || ''}
            onChange={(e) => setInvoice(prev => ({ ...prev, paymentInfo: e.target.value }))}
            rows={2}
            placeholder="PIX, dados bancários, formas de pagamento..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent resize-none"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button variant="outline" onClick={handleSave}>
          Salvar Rascunho
        </Button>
        <Button onClick={handleSend}>
          <Send className="w-4 h-4 mr-2" />
          Enviar para Cliente
        </Button>
      </div>
    </div>
  );
}

export type { InvoiceData, InvoiceItem };
export default InvoiceGenerator;
