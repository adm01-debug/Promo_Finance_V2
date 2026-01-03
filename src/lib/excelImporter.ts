/**
 * Utilitários de Importação/Exportação Excel
 * 
 * @module lib/excelImporter
 */

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: unknown) => string;
}

/**
 * Exporta dados para CSV (formato Excel compatível)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName?: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Header row
  const headers = columns.map(col => col.label);
  
  // Data rows
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      if (col.format) {
        return col.format(value);
      }
      if (value === null || value === undefined) {
        return '';
      }
      if (value instanceof Date) {
        return value.toLocaleDateString('pt-BR');
      }
      if (typeof value === 'number') {
        return value.toLocaleString('pt-BR');
      }
      return String(value);
    })
  );

  // Build CSV
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importa dados de arquivo Excel/CSV
 */
export async function importExcel<T>(
  file: File,
  columnMapping: Record<string, keyof T>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('Arquivo vazio ou sem dados'));
          return;
        }

        // Parse header
        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = parseCSVLine(lines[0], separator);
        
        // Parse rows
        const results: T[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i], separator);
          const row: Record<string, unknown> = {};
          
          headers.forEach((header, index) => {
            const mappedKey = columnMapping[header.trim()];
            if (mappedKey) {
              row[mappedKey as string] = values[index]?.trim() || null;
            }
          });
          
          if (Object.keys(row).length > 0) {
            results.push(row as T);
          }
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Gera template de importação
 */
export function generateExcelTemplate(
  columns: { key: string; label: string; example?: string }[],
  filename: string
): void {
  const headers = columns.map(col => col.label);
  const examples = columns.map(col => col.example || '');
  
  const csvContent = [
    headers.join(';'),
    examples.join(';')
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `template_${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
