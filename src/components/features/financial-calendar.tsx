import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  category?: string;
  categoryColor?: string;
}

interface FinancialCalendarProps {
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: (date: Date) => void;
  className?: string;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function FinancialCalendar({
  events,
  onDayClick,
  onEventClick,
  onAddClick,
  className,
}: FinancialCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter === 'all') return true;
      return event.type === filter;
    });
  }, [events, filter]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.date, date));
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthEvents = events.filter((event) => 
      event.date >= monthStart && event.date <= monthEnd
    );

    const income = monthEvents
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expense = monthEvents
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const pending = monthEvents
      .filter((e) => e.status === 'pending')
      .length;

    const overdue = monthEvents
      .filter((e) => e.status === 'overdue')
      .length;

    return { income, expense, pending, overdue };
  }, [events, currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDayClick?.(date);
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['all', 'income', 'expense'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    filter === f
                      ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Receitas</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(monthlyTotals.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(monthlyTotals.expense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="text-sm font-semibold text-yellow-600">
              {monthlyTotals.pending}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Vencidas</p>
            <p className="text-sm font-semibold text-red-600">
              {monthlyTotals.overdue}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            const totalIncome = dayEvents
              .filter((e) => e.type === 'income')
              .reduce((sum, e) => sum + e.amount, 0);
            const totalExpense = dayEvents
              .filter((e) => e.type === 'expense')
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors',
                  isCurrentMonth
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-900',
                  isSelected
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                  isTodayDate && 'bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
                      isTodayDate && 'text-primary-600 dark:text-primary-400',
                      isCurrentMonth && !isTodayDate && 'text-gray-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {onAddClick && isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddClick(day);
                      }}
                      className="p-1 text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        'w-full text-left px-1.5 py-0.5 text-xs rounded truncate transition-colors',
                        event.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
                        event.status === 'paid' && 'opacity-60'
                      )}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-gray-400 pl-1">
                      +{dayEvents.length - 3} mais
                    </p>
                  )}
                </div>

                {/* Day totals */}
                {(totalIncome > 0 || totalExpense > 0) && (
                  <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700 text-xs">
                    {totalIncome > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpCircle className="w-3 h-3" />
                        {formatCurrencyCompact(totalIncome)}
                      </div>
                    )}
                    {totalExpense > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <ArrowDownCircle className="w-3 h-3" />
                        {formatCurrencyCompact(totalExpense)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            {onAddClick && (
              <Button size="sm" onClick={() => onAddClick(selectedDate)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            )}
          </div>

          {getEventsForDay(selectedDate).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum evento nesta data
            </p>
          ) : (
            <div className="space-y-2">
              {getEventsForDay(selectedDate).map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                    event.type === 'income'
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {event.type === 'income' ? (
                      <ArrowUpCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      {event.category && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {event.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      event.type === 'income' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {event.type === 'income' ? '+' : '-'}
                      {formatCurrency(event.amount)}
                    </p>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      event.status === 'paid' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                      event.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
                      event.status === 'overdue' && 'bg-red-100 dark:bg-red-900/30 text-red-600'
                    )}>
                      {event.status === 'paid' ? 'Pago' : event.status === 'pending' ? 'Pendente' : 'Vencido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}

export type { CalendarEvent };
export default FinancialCalendar;
