/**
 * FINANCE HUB - Hook para Importação de Dados
 * 
 * @module hooks/useImportData
 * @description Importação de CSV com validação Zod
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  total: number;
  fileName: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export type ImportStatus = 'idle' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error';

interface UseImportDataOptions<T> {
  schema: z.ZodSchema<T>;
  onImport: (data: T[]) => Promise<void>;
  maxRows?: number;
}

// ============================================
// HOOK
// ============================================

export function useImportData<T>(options: UseImportDataOptions<T>) {
  const { schema, onImport, maxRows = 10000 } = options;

  const [status, setStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult<T> | null>(null);

  // Parsear CSV simples
  const parseCSV = useCallback(async (file: File): Promise<unknown[]> => {
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
          const headers = parseLine(lines[0], separator).map(h => 
            h.trim().toLowerCase().replace(/\s+/g, '_')
          );
          
          const data: Record<string, unknown>[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i], separator);
            const row: Record<string, unknown> = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || null;
            });
            
            data.push(row);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  // Validar dados com Zod
  const validateData = useCallback((data: unknown[], fileName: string): ImportResult<T> => {
    const success: T[] = [];
    const errors: ImportError[] = [];

    data.slice(0, maxRows).forEach((row, index) => {
      try {
        const validated = schema.parse(row);
        success.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            errors.push({
              row: index + 2,
              field: err.path.join('.'),
              message: err.message,
              value: (row as Record<string, unknown>)[err.path[0] as string],
            });
          });
        }
      }
    });

    return { success, errors, total: data.length, fileName };
  }, [schema, maxRows]);

  // Processar arquivo
  const processFile = useCallback(async (file: File) => {
    setStatus('parsing');
    setProgress(10);
    setResult(null);

    try {
      const data = await parseCSV(file);

      setStatus('validating');
      setProgress(40);

      const validationResult = validateData(data, file.name);

      setResult(validationResult);
      setProgress(60);
      setStatus('complete');

      if (validationResult.errors.length > 0) {
        toast.warning(`${validationResult.success.length} válidos, ${validationResult.errors.length} com erros`);
      } else {
        toast.success(`${validationResult.success.length} registros prontos para importar`);
      }
    } catch (error) {
      setStatus('error');
      toast.error(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [parseCSV, validateData]);

  // Confirmar importação
  const confirmImport = useCallback(async () => {
    if (!result || result.success.length === 0) {
      toast.error('Nenhum dado válido para importar');
      return;
    }

    setStatus('importing');
    setProgress(70);

    try {
      await onImport(result.success);
      setProgress(100);
      toast.success(`${result.success.length} registros importados com sucesso!`);
      
      setTimeout(() => {
        setStatus('idle');
        setResult(null);
        setProgress(0);
      }, 2000);
    } catch (error) {
      setStatus('error');
      toast.error(`Erro ao importar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [result, onImport]);

  // Reset
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
  }, []);

  return {
    status,
    progress,
    result,
    processFile,
    confirmImport,
    reset,
    isProcessing: status === 'parsing' || status === 'validating' || status === 'importing',
  };
}

// Helper para parsear linha CSV
function parseLine(line: string, separator: string): string[] {
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

export default useImportData;
