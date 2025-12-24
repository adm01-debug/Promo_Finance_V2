import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, CalendarDays, CalendarRange, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateFilterOption = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'overdue';

interface QuickDateFilter {
  id: DateFilterOption;
  label: string;
  icon: typeof Calendar;
  getRange: () => { start: Date; end: Date } | null;
  color?: string;
}

const filters: QuickDateFilter[] = [
  {
    id: 'all',
    label: 'Todos',
    icon: RotateCcw,
    getRange: () => null,
  },
  {
    id: 'today',
    label: 'Hoje',
    icon: Calendar,
    getRange: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    }),
  },
  {
    id: 'week',
    label: 'Esta Semana',
    icon: CalendarDays,
    getRange: () => ({
      start: startOfWeek(new Date(), { locale: ptBR }),
      end: endOfWeek(new Date(), { locale: ptBR }),
    }),
  },
  {
    id: 'month',
    label: 'Este Mês',
    icon: CalendarRange,
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
];

const extendedFilters: QuickDateFilter[] = [
  ...filters,
  {
    id: 'last7',
    label: 'Últimos 7 dias',
    icon: CalendarDays,
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date()),
    }),
  },
  {
    id: 'last30',
    label: 'Últimos 30 dias',
    icon: CalendarRange,
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date()),
    }),
  },
];

interface QuickDateFiltersProps {
  value: DateFilterOption;
  onChange: (value: DateFilterOption, range: { start: Date; end: Date } | null) => void;
  extended?: boolean;
  className?: string;
  showOverdue?: boolean;
}

export function QuickDateFilters({ 
  value, 
  onChange, 
  extended = false,
  className,
  showOverdue = false,
}: QuickDateFiltersProps) {
  const activeFilters = extended ? extendedFilters : filters;
  
  const allFilters = showOverdue 
    ? [...activeFilters, {
        id: 'overdue' as DateFilterOption,
        label: 'Vencidos',
        icon: Calendar,
        getRange: () => ({
          start: new Date(2000, 0, 1),
          end: subDays(startOfDay(new Date()), 1),
        }),
        color: 'text-destructive',
      }]
    : activeFilters;

  const handleClick = (filter: QuickDateFilter) => {
    const range = filter.getRange();
    onChange(filter.id, range);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {allFilters.map((filter) => {
        const Icon = filter.icon;
        const isActive = value === filter.id;
        
        return (
          <motion.div
            key={filter.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleClick(filter)}
              className={cn(
                "gap-2 transition-all duration-200",
                isActive && "shadow-md",
                !isActive && filter.color && filter.color,
                !isActive && "hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.id === 'all' ? 'Todos' : filter.label.split(' ')[0]}</span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

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

  const filterByDate = React.useCallback(<T extends { data_vencimento: string }>(items: T[]): T[] => {
    if (!dateRange) return items;
    
    return items.filter(item => {
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
