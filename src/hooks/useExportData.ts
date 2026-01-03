/**
 * FINANCE HUB - Hook para Exportação de Dados
 * 
 * @module hooks/useExportData
 * @description Exportação para CSV
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export type ExportFormat = 'csv';

export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  width?: number;
  format?: (value: unknown) => string;
}

interface UseExportDataOptions<T> {
  columns: ExportColumn<T>[];
  fileName: string;
}

// ============================================
// HOOK
// ============================================

export function useExportData<T extends Record<string, unknown>>(
  options: UseExportDataOptions<T>
) {
  const { columns, fileName } = options;
  const [isExporting, setIsExporting] = useState(false);

  // Formatar dados para exportação
  const formatData = useCallback((data: T[]): Record<string, unknown>[] => {
    return data.map((row) => {
      const formatted: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = row[col.key];
        formatted[col.header] = col.format ? col.format(value) : value;
      });
      return formatted;
    });
  }, [columns]);

  // Exportar para CSV
  const exportCSV = useCallback((data: T[]) => {
    const formatted = formatData(data);
    const headers = columns.map((c) => c.header);
    
    const csvContent = [
      headers.join(';'),
      ...formatted.map((row) =>
        headers
          .map((h) => {
            const value = row[h];
            if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(';')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [columns, formatData, fileName]);

  // Função principal de exportação
  const exportData = useCallback(async (data: T[], format: ExportFormat = 'csv') => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    setIsExporting(true);

    try {
      exportCSV(data);
      toast.success(`Exportado ${data.length} registros para CSV`);
    } catch (error) {
      toast.error(`Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  }, [exportCSV]);

  return {
    exportData,
    exportCSV: (data: T[]) => exportData(data, 'csv'),
    isExporting,
  };
}

export default useExportData;
