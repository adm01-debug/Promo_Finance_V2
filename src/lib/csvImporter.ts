/**
 * Utilitários de Importação/Exportação CSV
 * 
 * @module lib/csvImporter
 */

export interface CSVColumn<T> {
  key: keyof T;
  label: string;
  example?: string;
  transform?: (value: string) => unknown;
}

/**
 * Importa dados de arquivo CSV
 */
export async function importCSV<T>(
  file: File,
  columns: CSVColumn<T>[]
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

        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = parseCSVLine(lines[0], separator).map(h => h.trim().toLowerCase());

        const columnMap = new Map<number, CSVColumn<T>>();
        columns.forEach(col => {
          const index = headers.findIndex(h => 
            h === col.label.toLowerCase() || h === String(col.key).toLowerCase()
          );
          if (index !== -1) {
            columnMap.set(index, col);
          }
        });

        const results: T[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i], separator);
          const row: Record<string, unknown> = {};

          columnMap.forEach((col, index) => {
            const rawValue = values[index]?.trim() || '';
            row[col.key as string] = col.transform ? col.transform(rawValue) : rawValue;
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
 * Gera template CSV para download
 */
export function generateCSVTemplate<T>(
  columns: CSVColumn<T>[],
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
