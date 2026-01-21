import { formatCurrency, formatDate } from '@/lib/formatters';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
  width?: number;
}

export interface ExportOptions<T> {
  columns?: ExportColumn<T>[];
  filename?: string;
  format?: ExportFormat;
  includeHeaders?: boolean;
  delimiter?: string;
  dateFormat?: string;
  currencyFormat?: boolean;
}

class ExportService {
  /**
   * Export data to CSV format
   */
  toCSV<T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions<T> = {}
  ): string {
    const {
      columns,
      includeHeaders = true,
      delimiter = ',',
    } = options;

    if (data.length === 0) return '';

    const headers = columns
      ? columns.map((col) => col.header)
      : Object.keys(data[0]);

    const keys = columns
      ? columns.map((col) => col.key as string)
      : Object.keys(data[0]);

    const formatValue = (value: unknown, row: T, column?: ExportColumn<T>): string => {
      if (column?.formatter) {
        return column.formatter(value, row);
      }

      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
      if (value instanceof Date) return formatDate(value);
      if (typeof value === 'number' && column?.key.toString().includes('valor')) {
        return formatCurrency(value);
      }

      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains delimiter or newline
      if (stringValue.includes(delimiter) || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows: string[] = [];

    if (includeHeaders) {
      rows.push(headers.join(delimiter));
    }

    data.forEach((row) => {
      const values = keys.map((key, index) => {
        const column = columns?.[index];
        const value = this.getNestedValue(row, key);
        return formatValue(value, row, column);
      });
      rows.push(values.join(delimiter));
    });

    return rows.join('\n');
  }

  /**
   * Export data to JSON format
   */
  toJSON<T>(data: T[], options: ExportOptions<T> = {}): string {
    const { columns } = options;

    if (!columns) {
      return JSON.stringify(data, null, 2);
    }

    const transformedData = data.map((row) => {
      const transformed: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = this.getNestedValue(row as Record<string, unknown>, col.key as string);
        transformed[col.header] = col.formatter
          ? col.formatter(value, row)
          : value;
      });
      return transformed;
    });

    return JSON.stringify(transformedData, null, 2);
  }

  /**
   * Download data as a file
   */
  download<T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions<T> = {}
  ): void {
    const {
      filename = 'export',
      format = 'csv',
    } = options;

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = this.toJSON(data, options);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
      default:
        content = this.toCSV(data, options);
        mimeType = 'text/csv;charset=utf-8';
        extension = 'csv';
        break;
    }

    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${filename}_${this.getTimestamp()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get nested object value by dot notation key
   */
  private getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce((value, part) => {
      return value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
    }, obj as unknown);
  }

  /**
   * Get timestamp for filename
   */
  private getTimestamp(): string {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('');
  }

  /**
   * Export contas a pagar
   */
  exportContasPagar(data: ContaPagar[]): void {
    this.download(data, {
      filename: 'contas_pagar',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'descricao', header: 'Descrição' },
        { key: 'valor', header: 'Valor', formatter: (v) => formatCurrency(v as number) },
        { key: 'dataVencimento', header: 'Vencimento', formatter: (v) => formatDate(v as string) },
        { key: 'dataPagamento', header: 'Pagamento', formatter: (v) => v ? formatDate(v as string) : '-' },
        { key: 'status', header: 'Status' },
        { key: 'fornecedor.nome', header: 'Fornecedor' },
        { key: 'categoria', header: 'Categoria' },
      ],
    });
  }

  /**
   * Export contas a receber
   */
  exportContasReceber(data: ContaReceber[]): void {
    this.download(data, {
      filename: 'contas_receber',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'descricao', header: 'Descrição' },
        { key: 'valor', header: 'Valor', formatter: (v) => formatCurrency(v as number) },
        { key: 'dataVencimento', header: 'Vencimento', formatter: (v) => formatDate(v as string) },
        { key: 'dataRecebimento', header: 'Recebimento', formatter: (v) => v ? formatDate(v as string) : '-' },
        { key: 'status', header: 'Status' },
        { key: 'cliente.nome', header: 'Cliente' },
        { key: 'categoria', header: 'Categoria' },
      ],
    });
  }

  /**
   * Export fornecedores
   */
  exportFornecedores(data: Fornecedor[]): void {
    this.download(data, {
      filename: 'fornecedores',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
        { key: 'cnpj', header: 'CNPJ' },
        { key: 'email', header: 'E-mail' },
        { key: 'telefone', header: 'Telefone' },
        { key: 'endereco', header: 'Endereço' },
        { key: 'categoria', header: 'Categoria' },
        { key: 'ativo', header: 'Ativo', formatter: (v) => v ? 'Sim' : 'Não' },
      ],
    });
  }

  /**
   * Export clientes
   */
  exportClientes(data: Cliente[]): void {
    this.download(data, {
      filename: 'clientes',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
        { key: 'cpfCnpj', header: 'CPF/CNPJ' },
        { key: 'email', header: 'E-mail' },
        { key: 'telefone', header: 'Telefone' },
        { key: 'endereco', header: 'Endereço' },
        { key: 'ativo', header: 'Ativo', formatter: (v) => v ? 'Sim' : 'Não' },
      ],
    });
  }

  /**
   * Export report summary
   */
  exportReportSummary(data: ReportSummary): void {
    const rows = [
      { label: 'Total Receitas', value: formatCurrency(data.totalReceitas) },
      { label: 'Total Despesas', value: formatCurrency(data.totalDespesas) },
      { label: 'Saldo Líquido', value: formatCurrency(data.saldoLiquido) },
      { label: 'Contas a Pagar', value: formatCurrency(data.contasAPagar) },
      { label: 'Contas a Receber', value: formatCurrency(data.contasAReceber) },
      { label: 'Contas Atrasadas', value: formatCurrency(data.contasAtrasadas) },
    ];

    this.download(rows as unknown as Record<string, unknown>[], {
      filename: 'resumo_financeiro',
      columns: [
        { key: 'label', header: 'Indicador' },
        { key: 'value', header: 'Valor' },
      ],
    });
  }

  /**
   * Export cash flow
   */
  exportCashFlow(data: CashFlowItem[]): void {
    this.download(data, {
      filename: 'fluxo_caixa',
      columns: [
        { key: 'date', header: 'Data', formatter: (v) => formatDate(v as string) },
        { key: 'entradas', header: 'Entradas', formatter: (v) => formatCurrency(v as number) },
        { key: 'saidas', header: 'Saídas', formatter: (v) => formatCurrency(v as number) },
        { key: 'saldo', header: 'Saldo', formatter: (v) => formatCurrency(v as number) },
        { key: 'saldoAcumulado', header: 'Saldo Acumulado', formatter: (v) => formatCurrency(v as number) },
      ],
    });
  }
}

// Types for export
interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  fornecedor?: { nome: string };
  categoria?: string;
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataRecebimento?: string;
  status: string;
  cliente?: { nome: string };
  categoria?: string;
}

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  categoria?: string;
  ativo: boolean;
}

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
}

interface ReportSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  contasAPagar: number;
  contasAReceber: number;
  contasAtrasadas: number;
}

interface CashFlowItem {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export const exportService = new ExportService();
