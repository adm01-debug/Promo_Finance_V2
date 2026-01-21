/**
 * Data Import Utilities
 * Import data from CSV, JSON, and Excel files
 */

type ImportFormat = 'csv' | 'json' | 'xlsx';

interface ImportColumn {
  key: string;
  header: string;
  required?: boolean;
  parser?: (value: string) => unknown;
  validator?: (value: unknown) => boolean;
}

interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

interface ImportError {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
}

interface ImportOptions {
  columns: ImportColumn[];
  skipEmptyRows?: boolean;
  maxRows?: number;
  headerRow?: number;
}

/**
 * Import data from CSV
 */
export async function importFromCSV<T>(
  file: File,
  options: ImportOptions
): Promise<ImportResult<T>> {
  const { columns, skipEmptyRows = true, maxRows, headerRow = 0 } = options;
  
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  
  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  };
  
  if (lines.length <= headerRow) {
    result.success = false;
    result.errors.push({ row: 0, message: 'Arquivo vazio ou sem dados' });
    return result;
  }

  // Parse header
  const headerLine = lines[headerRow];
  const headers = parseCSVLine(headerLine);
  
  // Map header indices to columns
  const columnMap = new Map<number, ImportColumn>();
  columns.forEach((col) => {
    const index = headers.findIndex(
      (h) => h.toLowerCase().trim() === col.header.toLowerCase().trim()
    );
    if (index !== -1) {
      columnMap.set(index, col);
    } else if (col.required) {
      result.errors.push({
        row: headerRow,
        column: col.header,
        message: `Coluna obrigatória não encontrada: ${col.header}`,
      });
    }
  });

  if (result.errors.length > 0) {
    result.success = false;
    return result;
  }

  // Parse data rows
  for (let i = headerRow + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty rows
    if (skipEmptyRows && line.trim() === '') {
      continue;
    }

    // Check max rows
    if (maxRows && result.totalRows >= maxRows) {
      result.warnings.push(`Limite de ${maxRows} linhas atingido`);
      break;
    }

    result.totalRows++;
    
    const values = parseCSVLine(line);
    const row: Record<string, unknown> = {};
    let rowValid = true;

    // Map values to columns
    columnMap.forEach((col, index) => {
      const rawValue = values[index]?.trim() ?? '';
      
      // Parse value
      let value: unknown = rawValue;
      if (col.parser && rawValue !== '') {
        try {
          value = col.parser(rawValue);
        } catch (error) {
          result.errors.push({
            row: i + 1,
            column: col.header,
            message: `Erro ao processar valor: ${rawValue}`,
            value: rawValue,
          });
          rowValid = false;
        }
      }

      // Validate value
      if (col.required && (value === '' || value === null || value === undefined)) {
        result.errors.push({
          row: i + 1,
          column: col.header,
          message: `Campo obrigatório vazio: ${col.header}`,
        });
        rowValid = false;
      }

      if (col.validator && value !== '' && !col.validator(value)) {
        result.errors.push({
          row: i + 1,
          column: col.header,
          message: `Valor inválido: ${rawValue}`,
          value: rawValue,
        });
        rowValid = false;
      }

      row[col.key] = value;
    });

    if (rowValid) {
      result.data.push(row as T);
      result.validRows++;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import data from JSON
 */
export async function importFromJSON<T>(
  file: File,
  options: ImportOptions
): Promise<ImportResult<T>> {
  const { columns } = options;
  
  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  };

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    const items = Array.isArray(json) ? json : [json];
    
    items.forEach((item, index) => {
      result.totalRows++;
      const row: Record<string, unknown> = {};
      let rowValid = true;

      columns.forEach((col) => {
        const value = item[col.key] ?? item[col.header];
        
        // Check required
        if (col.required && (value === null || value === undefined || value === '')) {
          result.errors.push({
            row: index + 1,
            column: col.header,
            message: `Campo obrigatório vazio: ${col.header}`,
          });
          rowValid = false;
        }

        // Validate
        if (col.validator && value !== null && value !== undefined && !col.validator(value)) {
          result.errors.push({
            row: index + 1,
            column: col.header,
            message: `Valor inválido`,
            value,
          });
          rowValid = false;
        }

        row[col.key] = value;
      });

      if (rowValid) {
        result.data.push(row as T);
        result.validRows++;
      }
    });
  } catch (error) {
    result.success = false;
    result.errors.push({
      row: 0,
      message: 'Erro ao processar arquivo JSON: ' + (error as Error).message,
    });
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import data from Excel
 */
export async function importFromExcel<T>(
  file: File,
  options: ImportOptions & { sheetIndex?: number }
): Promise<ImportResult<T>> {
  const { columns, skipEmptyRows = true, maxRows, headerRow = 0, sheetIndex = 0 } = options;
  
  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  };

  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) {
      result.success = false;
      result.errors.push({ row: 0, message: 'Planilha não encontrada' });
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      header: 1,
      defval: '',
    }) as unknown[][];

    if (jsonData.length <= headerRow) {
      result.success = false;
      result.errors.push({ row: 0, message: 'Arquivo vazio ou sem dados' });
      return result;
    }

    // Get headers
    const headers = (jsonData[headerRow] as string[]).map((h) => String(h).trim());

    // Map columns
    const columnMap = new Map<number, ImportColumn>();
    columns.forEach((col) => {
      const index = headers.findIndex(
        (h) => h.toLowerCase() === col.header.toLowerCase()
      );
      if (index !== -1) {
        columnMap.set(index, col);
      } else if (col.required) {
        result.errors.push({
          row: headerRow + 1,
          column: col.header,
          message: `Coluna obrigatória não encontrada: ${col.header}`,
        });
      }
    });

    if (result.errors.length > 0) {
      result.success = false;
      return result;
    }

    // Parse data
    for (let i = headerRow + 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] as unknown[];
      
      // Skip empty rows
      if (skipEmptyRows && rowData.every((cell) => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      if (maxRows && result.totalRows >= maxRows) {
        result.warnings.push(`Limite de ${maxRows} linhas atingido`);
        break;
      }

      result.totalRows++;
      const row: Record<string, unknown> = {};
      let rowValid = true;

      columnMap.forEach((col, index) => {
        let value = rowData[index];
        
        // Parse value
        if (col.parser && value !== '' && value !== null && value !== undefined) {
          try {
            value = col.parser(String(value));
          } catch (error) {
            result.errors.push({
              row: i + 1,
              column: col.header,
              message: `Erro ao processar valor`,
              value,
            });
            rowValid = false;
          }
        }

        // Validate
        if (col.required && (value === '' || value === null || value === undefined)) {
          result.errors.push({
            row: i + 1,
            column: col.header,
            message: `Campo obrigatório vazio: ${col.header}`,
          });
          rowValid = false;
        }

        if (col.validator && value !== '' && value !== null && !col.validator(value)) {
          result.errors.push({
            row: i + 1,
            column: col.header,
            message: `Valor inválido`,
            value,
          });
          rowValid = false;
        }

        row[col.key] = value;
      });

      if (rowValid) {
        result.data.push(row as T);
        result.validRows++;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push({
      row: 0,
      message: 'Erro ao processar arquivo Excel: ' + (error as Error).message,
    });
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Generic import function
 */
export async function importData<T>(
  file: File,
  options: ImportOptions
): Promise<ImportResult<T>> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return importFromCSV<T>(file, options);
    case 'json':
      return importFromJSON<T>(file, options);
    case 'xlsx':
    case 'xls':
      return importFromExcel<T>(file, options);
    default:
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Formato não suportado: ${extension}` }],
        warnings: [],
        totalRows: 0,
        validRows: 0,
      };
  }
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Common parsers
 */
export const PARSERS = {
  number: (value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) throw new Error('Invalid number');
    return num;
  },
  
  currency: (value: string) => {
    const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) throw new Error('Invalid currency');
    return num;
  },
  
  date: (value: string) => {
    // Try BR format: DD/MM/YYYY
    const brMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try ISO format
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  },
  
  boolean: (value: string) => {
    const lower = value.toLowerCase();
    if (['true', 'yes', 'sim', '1', 'x'].includes(lower)) return true;
    if (['false', 'no', 'não', 'nao', '0', ''].includes(lower)) return false;
    throw new Error('Invalid boolean');
  },
};

/**
 * Common validators
 */
export const VALIDATORS = {
  required: (value: unknown) => value !== null && value !== undefined && value !== '',
  email: (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
  cpf: (value: unknown) => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(String(value)),
  cnpj: (value: unknown) => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(String(value)),
  phone: (value: unknown) => /^[\d\s\(\)\-\+]{8,}$/.test(String(value)),
  positive: (value: unknown) => typeof value === 'number' && value > 0,
  nonNegative: (value: unknown) => typeof value === 'number' && value >= 0,
};

export default importData;
