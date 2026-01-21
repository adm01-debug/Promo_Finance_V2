import { z } from 'zod';

export type ImportFormat = 'csv' | 'json';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: unknown;
}

export interface ImportOptions<T> {
  format?: ImportFormat;
  delimiter?: string;
  hasHeaders?: boolean;
  schema?: z.ZodSchema<T>;
  columnMap?: Record<string, keyof T>;
  transform?: (row: Record<string, unknown>) => Partial<T>;
  validate?: (row: T) => string | null;
  skipEmptyRows?: boolean;
  maxRows?: number;
}

class ImportService {
  /**
   * Parse CSV string into array of objects
   */
  parseCSV(
    content: string,
    options: {
      delimiter?: string;
      hasHeaders?: boolean;
    } = {}
  ): Record<string, unknown>[] {
    const { delimiter = ',', hasHeaders = true } = options;

    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return [];

    const parseRow = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return values;
    };

    const headers = hasHeaders
      ? parseRow(lines[0]).map((h) => this.normalizeHeader(h))
      : parseRow(lines[0]).map((_, i) => `column_${i}`);

    const dataLines = hasHeaders ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const values = parseRow(line);
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        row[header] = this.parseValue(value);
      });

      return row;
    });
  }

  /**
   * Parse JSON string into array of objects
   */
  parseJSON(content: string): Record<string, unknown>[] {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Import data from file content
   */
  async import<T extends Record<string, unknown>>(
    content: string,
    options: ImportOptions<T> = {}
  ): Promise<ImportResult<T>> {
    const {
      format = 'csv',
      delimiter = ',',
      hasHeaders = true,
      schema,
      columnMap,
      transform,
      validate,
      skipEmptyRows = true,
      maxRows,
    } = options;

    const errors: ImportError[] = [];
    const validData: T[] = [];

    // Parse content
    let rawData: Record<string, unknown>[];
    try {
      rawData = format === 'json'
        ? this.parseJSON(content)
        : this.parseCSV(content, { delimiter, hasHeaders });
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Erro ao processar arquivo: ${(error as Error).message}` }],
        totalRows: 0,
        validRows: 0,
        invalidRows: 1,
      };
    }

    // Apply max rows limit
    if (maxRows && rawData.length > maxRows) {
      rawData = rawData.slice(0, maxRows);
    }

    // Process each row
    rawData.forEach((rawRow, index) => {
      const rowNumber = hasHeaders ? index + 2 : index + 1;

      // Skip empty rows
      if (skipEmptyRows && this.isEmptyRow(rawRow)) {
        return;
      }

      try {
        // Map columns if specified
        let mappedRow = columnMap
          ? this.mapColumns(rawRow, columnMap)
          : rawRow;

        // Apply transform if specified
        if (transform) {
          mappedRow = { ...mappedRow, ...transform(rawRow) };
        }

        // Validate with schema if specified
        if (schema) {
          const result = schema.safeParse(mappedRow);
          if (!result.success) {
            result.error.errors.forEach((err) => {
              errors.push({
                row: rowNumber,
                field: err.path.join('.'),
                message: err.message,
                value: mappedRow[err.path[0] as string],
              });
            });
            return;
          }
          mappedRow = result.data;
        }

        // Apply custom validation if specified
        if (validate) {
          const error = validate(mappedRow as T);
          if (error) {
            errors.push({ row: rowNumber, message: error });
            return;
          }
        }

        validData.push(mappedRow as T);
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: `Erro ao processar linha: ${(error as Error).message}`,
        });
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      totalRows: rawData.length,
      validRows: validData.length,
      invalidRows: errors.length,
    };
  }

  /**
   * Import from file input
   */
  async importFromFile<T extends Record<string, unknown>>(
    file: File,
    options: ImportOptions<T> = {}
  ): Promise<ImportResult<T>> {
    const format = this.detectFormat(file.name);
    const content = await this.readFile(file);
    return this.import<T>(content, { ...options, format });
  }

  /**
   * Read file content
   */
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Detect file format from filename
   */
  private detectFormat(filename: string): ImportFormat {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'json' ? 'json' : 'csv';
  }

  /**
   * Normalize header name
   */
  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Parse value to appropriate type
   */
  private parseValue(value: string | undefined): unknown {
    if (value === undefined || value === '') return null;

    // Boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'sim') return true;
    if (value.toLowerCase() === 'false' || value.toLowerCase() === 'não' || value.toLowerCase() === 'nao') return false;

    // Number
    const cleanNumber = value.replace(/[R$\s.]/g, '').replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(cleanNumber)) {
      return parseFloat(cleanNumber);
    }

    // Date (DD/MM/YYYY)
    const dateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  /**
   * Map columns according to mapping
   */
  private mapColumns<T>(
    row: Record<string, unknown>,
    columnMap: Record<string, keyof T>
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    Object.entries(columnMap).forEach(([sourceKey, targetKey]) => {
      const normalizedKey = this.normalizeHeader(sourceKey);
      if (normalizedKey in row) {
        mapped[targetKey as string] = row[normalizedKey];
      } else if (sourceKey in row) {
        mapped[targetKey as string] = row[sourceKey];
      }
    });

    return mapped;
  }

  /**
   * Check if row is empty
   */
  private isEmptyRow(row: Record<string, unknown>): boolean {
    return Object.values(row).every(
      (v) => v === null || v === undefined || v === ''
    );
  }

  /**
   * Create sample CSV template
   */
  createTemplate(columns: { key: string; header: string; example?: string }[]): string {
    const headers = columns.map((col) => col.header);
    const examples = columns.map((col) => col.example || '');
    return [headers.join(','), examples.join(',')].join('\n');
  }

  /**
   * Download template file
   */
  downloadTemplate(
    columns: { key: string; header: string; example?: string }[],
    filename: string = 'template'
  ): void {
    const content = this.createTemplate(columns);
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Specific import methods

  /**
   * Get template for contas a pagar
   */
  getContasPagarTemplate(): void {
    this.downloadTemplate([
      { key: 'descricao', header: 'Descrição', example: 'Conta de luz' },
      { key: 'valor', header: 'Valor', example: '150.00' },
      { key: 'dataVencimento', header: 'Data Vencimento', example: '15/02/2025' },
      { key: 'fornecedor', header: 'Fornecedor', example: 'CEMIG' },
      { key: 'categoria', header: 'Categoria', example: 'Utilidades' },
    ], 'template_contas_pagar');
  }

  /**
   * Get template for contas a receber
   */
  getContasReceberTemplate(): void {
    this.downloadTemplate([
      { key: 'descricao', header: 'Descrição', example: 'Venda #001' },
      { key: 'valor', header: 'Valor', example: '500.00' },
      { key: 'dataVencimento', header: 'Data Vencimento', example: '20/02/2025' },
      { key: 'cliente', header: 'Cliente', example: 'João Silva' },
      { key: 'categoria', header: 'Categoria', example: 'Vendas' },
    ], 'template_contas_receber');
  }

  /**
   * Get template for fornecedores
   */
  getFornecedoresTemplate(): void {
    this.downloadTemplate([
      { key: 'nome', header: 'Nome', example: 'Fornecedor ABC' },
      { key: 'cnpj', header: 'CNPJ', example: '12.345.678/0001-90' },
      { key: 'email', header: 'E-mail', example: 'contato@fornecedor.com' },
      { key: 'telefone', header: 'Telefone', example: '(11) 99999-9999' },
      { key: 'endereco', header: 'Endereço', example: 'Rua A, 123' },
      { key: 'categoria', header: 'Categoria', example: 'Material de escritório' },
    ], 'template_fornecedores');
  }

  /**
   * Get template for clientes
   */
  getClientesTemplate(): void {
    this.downloadTemplate([
      { key: 'nome', header: 'Nome', example: 'Cliente XYZ' },
      { key: 'cpfCnpj', header: 'CPF/CNPJ', example: '123.456.789-00' },
      { key: 'email', header: 'E-mail', example: 'cliente@email.com' },
      { key: 'telefone', header: 'Telefone', example: '(11) 98888-8888' },
      { key: 'endereco', header: 'Endereço', example: 'Av. B, 456' },
    ], 'template_clientes');
  }
}

export const importService = new ImportService();
