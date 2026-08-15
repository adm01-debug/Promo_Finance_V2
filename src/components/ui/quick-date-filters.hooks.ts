import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateFilterOption } from './quick-date-filters';

// Hook para usar os filtros de data
export function useQuickDateFilter(initialValue: DateFilterOption = 'all') {
  const [filterType, setFilterType] = React.useState<DateFilterOption>(initialValue);
  const [dateRange, setDateRange] = React.useState<{ start: Date; end: Date } | null>(null);

  const handleFilterChange = React.useCallback((
    type: DateFilterOption,
    range: { start: Date; end: Date } | null
  ) => {
    setFilterType(type);
    setDateRange(range);
  }, []);

  const filterByDate = React.useCallback(<T extends { data_vencimento?: string }>(items: T[]): T[] => {
    if (!dateRange) return items;

    return items.filter(item => {
      if (!item.data_vencimento) return true;
      const itemDate = new Date(item.data_vencimento);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  }, [dateRange]);

  const getFilterDescription = React.useCallback(() => {
    if (!dateRange) return 'Todos os períodos';

    return `${format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`;
  }, [dateRange]);

  return {
    filterType,
    dateRange,
    handleFilterChange,
    filterByDate,
    getFilterDescription,
  };
}
