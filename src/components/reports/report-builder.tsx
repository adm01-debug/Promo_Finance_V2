import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters';

// Types
export interface ReportColumn<T = any> {
  key: string;
  header: string;
  accessor: (row: T) => any;
  format?: 'currency' | 'date' | 'percent' | 'number' | 'text';
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  summary?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportConfig<T = any> {
  title: string;
  description?: string;
  columns: ReportColumn<T>[];
  data: T[];
  groupBy?: string;
  sortBy?: { key: string; direction: 'asc' | 'desc' };
  showSummary?: boolean;
  showFooter?: boolean;
  emptyMessage?: string;
}

interface ReportBuilderProps<T = any> {
  config: ReportConfig<T>;
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void;
  onPrint?: () => void;
  className?: string;
}

// Format helpers
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'date':
      return formatDate(value);
    case 'percent':
      return formatPercent(Number(value));
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(Number(value));
    default:
      return String(value);
  }
}

// Calculate summary
function calculateSummary<T>(
  data: T[],
  column: ReportColumn<T>
): number | string {
  if (!column.summary || data.length === 0) return '-';

  const values = data
    .map((row) => column.accessor(row))
    .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number);

  if (values.length === 0) return '-';

  switch (column.summary) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return '-';
  }
}

// Group data
function groupData<T>(data: T[], groupKey: string): Record<string, T[]> {
  return data.reduce((acc, item) => {
    const key = String((item as any)[groupKey] || 'Outros');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// Sort data
function sortData<T>(
  data: T[],
  sortBy: { key: string; direction: 'asc' | 'desc' } | undefined,
  columns: ReportColumn<T>[]
): T[] {
  if (!sortBy) return data;

  const column = columns.find((c) => c.key === sortBy.key);
  if (!column) return data;

  return [...data].sort((a, b) => {
    const aVal = column.accessor(a);
    const bVal = column.accessor(b);

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return sortBy.direction === 'asc' ? comparison : -comparison;
  });
}

export function ReportBuilder<T>({
  config,
  onExport,
  onPrint,
  className,
}: ReportBuilderProps<T>) {
  const [currentSort, setCurrentSort] = useState(config.sortBy);

  // Process data
  const processedData = useMemo(() => {
    let result = sortData(config.data, currentSort, config.columns);
    return result;
  }, [config.data, currentSort, config.columns]);

  // Group if needed
  const groupedData = useMemo(() => {
    if (!config.groupBy) return null;
    return groupData(processedData, config.groupBy);
  }, [processedData, config.groupBy]);

  // Handle sort
  const handleSort = (key: string) => {
    const column = config.columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    setCurrentSort((prev) => ({
      key,
      direction:
        prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Render table header
  const renderHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        {config.columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-1">
              {column.header}
              {column.sortable && (
                <span className="text-gray-400">
                  {currentSort?.key === column.key ? (
                    currentSort.direction === 'asc' ? '↑' : '↓'
                  ) : (
                    '↕'
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render table row
  const renderRow = (row: T, index: number) => (
    <tr
      key={index}
      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {config.columns.map((column) => (
        <td
          key={column.key}
          className={cn(
            'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap',
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right'
          )}
        >
          {formatValue(column.accessor(row), column.format)}
        </td>
      ))}
    </tr>
  );

  // Render group
  const renderGroup = (groupName: string, rows: T[]) => (
    <tbody key={groupName} className="divide-y divide-gray-200 dark:divide-gray-700">
      <tr className="bg-gray-100 dark:bg-gray-800">
        <td
          colSpan={config.columns.length}
          className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          {groupName} ({rows.length})
        </td>
      </tr>
      {rows.map((row, index) => renderRow(row, index))}
      {config.showSummary && (
        <tr className="bg-gray-50 dark:bg-gray-800/50 font-medium">
          {config.columns.map((column) => (
            <td
              key={column.key}
              className={cn(
                'px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right'
              )}
            >
              {column.summary
                ? formatValue(calculateSummary(rows, column), column.format)
                : ''}
            </td>
          ))}
        </tr>
      )}
    </tbody>
  );

  // Render summary footer
  const renderFooter = () => {
    if (!config.showFooter) return null;

    return (
      <tfoot className="bg-gray-100 dark:bg-gray-800 font-semibold">
        <tr>
          {config.columns.map((column, index) => (
            <td
              key={column.key}
              className={cn(
                'px-4 py-3 text-sm text-gray-900 dark:text-white',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right'
              )}
            >
              {index === 0
                ? `Total (${processedData.length})`
                : column.summary
                ? formatValue(
                    calculateSummary(processedData, column),
                    column.format
                  )
                : ''}
            </td>
          ))}
        </tr>
      </tfoot>
    );
  };

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h2>
            {config.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {config.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                🖨️ Imprimir
              </button>
            )}
            {onExport && (
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  📥 Exportar
                </button>
                <div className="absolute right-0 z-10 hidden pt-2 group-hover:block">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => onExport('csv')}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      📄 CSV
                    </button>
                    <button
                      onClick={() => onExport('excel')}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => onExport('pdf')}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      📕 PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {processedData.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {config.emptyMessage || 'Nenhum dado encontrado'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {renderHeader()}
            {groupedData
              ? Object.entries(groupedData).map(([name, rows]) =>
                  renderGroup(name, rows)
                )
              : (
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {processedData.map((row, index) => renderRow(row, index))}
                </tbody>
              )}
            {renderFooter()}
          </table>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {processedData.length} registro(s) • Gerado em {formatDate(new Date())}
      </div>
    </div>
  );
}

// Preset report configs
export const presetReports = {
  contasPagar: (data: any[]): ReportConfig => ({
    title: 'Relatório de Contas a Pagar',
    description: 'Lista de todas as contas a pagar do período',
    columns: [
      { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao, sortable: true },
      { key: 'fornecedor', header: 'Fornecedor', accessor: (r) => r.fornecedor?.nome, sortable: true },
      { key: 'valor', header: 'Valor', accessor: (r) => r.valor, format: 'currency', align: 'right', summary: 'sum', sortable: true },
      { key: 'vencimento', header: 'Vencimento', accessor: (r) => r.dataVencimento, format: 'date', sortable: true },
      { key: 'status', header: 'Status', accessor: (r) => r.status },
    ],
    data,
    showSummary: true,
    showFooter: true,
  }),

  contasReceber: (data: any[]): ReportConfig => ({
    title: 'Relatório de Contas a Receber',
    description: 'Lista de todas as contas a receber do período',
    columns: [
      { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao, sortable: true },
      { key: 'cliente', header: 'Cliente', accessor: (r) => r.cliente?.nome, sortable: true },
      { key: 'valor', header: 'Valor', accessor: (r) => r.valor, format: 'currency', align: 'right', summary: 'sum', sortable: true },
      { key: 'vencimento', header: 'Vencimento', accessor: (r) => r.dataVencimento, format: 'date', sortable: true },
      { key: 'status', header: 'Status', accessor: (r) => r.status },
    ],
    data,
    showSummary: true,
    showFooter: true,
  }),

  fluxoCaixa: (data: any[]): ReportConfig => ({
    title: 'Fluxo de Caixa',
    description: 'Movimentações financeiras do período',
    columns: [
      { key: 'data', header: 'Data', accessor: (r) => r.data, format: 'date', sortable: true },
      { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao },
      { key: 'tipo', header: 'Tipo', accessor: (r) => r.tipo },
      { key: 'entrada', header: 'Entrada', accessor: (r) => r.tipo === 'receita' ? r.valor : null, format: 'currency', align: 'right', summary: 'sum' },
      { key: 'saida', header: 'Saída', accessor: (r) => r.tipo === 'despesa' ? r.valor : null, format: 'currency', align: 'right', summary: 'sum' },
      { key: 'saldo', header: 'Saldo', accessor: (r) => r.saldo, format: 'currency', align: 'right' },
    ],
    data,
    showFooter: true,
  }),
};
