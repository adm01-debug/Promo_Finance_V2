import { useMemo } from 'react';
import { Check, X, Minus, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  highlighted?: boolean;
  badge?: string;
}

interface ComparisonRow {
  id: string;
  feature: string;
  description?: string;
  category?: string;
  values: Record<string, boolean | string | number | null>;
}

interface ComparisonTableProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  title?: string;
  showCategory?: boolean;
  stickyHeader?: boolean;
  highlightDifferences?: boolean;
}

export function ComparisonTable({
  columns,
  rows,
  title,
  showCategory = true,
  stickyHeader = true,
  highlightDifferences = false,
}: ComparisonTableProps) {
  // Group rows by category
  const groupedRows = useMemo(() => {
    if (!showCategory) return { '': rows };
    
    return rows.reduce((acc, row) => {
      const category = row.category || 'Geral';
      if (!acc[category]) acc[category] = [];
      acc[category].push(row);
      return acc;
    }, {} as Record<string, ComparisonRow[]>);
  }, [rows, showCategory]);

  // Check if values differ across columns
  const hasDifference = (row: ComparisonRow): boolean => {
    const values = Object.values(row.values);
    const firstValue = JSON.stringify(values[0]);
    return values.some((v) => JSON.stringify(v) !== firstValue);
  };

  const renderValue = (value: boolean | string | number | null) => {
    if (value === true) {
      return (
        <div className="flex items-center justify-center">
          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      );
    }
    
    if (value === false) {
      return (
        <div className="flex items-center justify-center">
          <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        </div>
      );
    }
    
    if (value === null || value === undefined) {
      return (
        <div className="flex items-center justify-center">
          <Minus className="w-4 h-4 text-gray-400" />
        </div>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <span className="font-medium text-gray-900 dark:text-white">
          {value.toLocaleString('pt-BR')}
        </span>
      );
    }
    
    return (
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[200px]">
                Recurso
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-6 py-4 text-center min-w-[150px]',
                    column.highlighted && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="space-y-1">
                    {column.badge && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                        {column.badge}
                      </span>
                    )}
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </div>
                    {column.subtitle && (
                      <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {column.subtitle}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(groupedRows).map(([category, categoryRows]) => (
              <>
                {/* Category header */}
                {showCategory && category && (
                  <tr key={`cat-${category}`}>
                    <td
                      colSpan={columns.length + 1}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {category}
                    </td>
                  </tr>
                )}
                
                {/* Rows */}
                {categoryRows.map((row) => {
                  const isDifferent = highlightDifferences && hasDifference(row);
                  
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        isDifferent && 'bg-yellow-50/50 dark:bg-yellow-900/10'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {row.feature}
                            </div>
                            {row.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {row.description}
                              </div>
                            )}
                          </div>
                          {isDifferent && (
                            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-400" />
                          )}
                        </div>
                      </td>
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            'px-6 py-4 text-center',
                            column.highlighted && 'bg-primary-50/50 dark:bg-primary-900/10'
                          )}
                        >
                          {renderValue(row.values[column.id])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Period comparison component
interface PeriodComparisonProps {
  current: {
    label: string;
    value: number;
  };
  previous: {
    label: string;
    value: number;
  };
  format?: (value: number) => string;
  positiveIsGood?: boolean;
}

export function PeriodComparison({
  current,
  previous,
  format = (v) => v.toLocaleString('pt-BR'),
  positiveIsGood = true,
}: PeriodComparisonProps) {
  const diff = current.value - previous.value;
  const percentChange = previous.value !== 0 
    ? ((diff / previous.value) * 100) 
    : 0;
  
  const isPositive = diff >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {current.label}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {format(current.value)}
        </div>
      </div>
      
      <div className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
        isGood
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}>
        {isPositive ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
        <span>{Math.abs(percentChange).toFixed(1)}%</span>
      </div>
      
      <div className="flex-1 text-right">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {previous.label}
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {format(previous.value)}
        </div>
      </div>
    </div>
  );
}

// Simple yes/no comparison
interface YesNoComparisonProps {
  items: Array<{
    id: string;
    label: string;
    values: boolean[];
  }>;
  headers: string[];
}

export function YesNoComparison({ items, headers }: YesNoComparisonProps) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Recurso
        </div>
        {headers.map((header, index) => (
          <div
            key={index}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center"
          >
            {header}
          </div>
        ))}
      </div>
      
      {/* Items */}
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-3 gap-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
        >
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {item.label}
          </div>
          {item.values.map((value, index) => (
            <div key={index} className="flex justify-center">
              {value ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ComparisonTable;
