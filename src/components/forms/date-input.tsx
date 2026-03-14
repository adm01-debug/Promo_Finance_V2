import { forwardRef, useState, useCallback, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  format?: 'date' | 'datetime' | 'time';
  minDate?: Date;
  maxDate?: Date;
  error?: boolean;
  showIcon?: boolean;
}

/**
 * Formata Date para string ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
 */
function formatDateForInput(date: Date | string | null, format: 'date' | 'datetime' | 'time'): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  if (format === 'time') {
    return d.toTimeString().slice(0, 5);
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  if (format === 'datetime') {
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * Input para datas com suporte a Date object
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      format = 'date',
      minDate,
      maxDate,
      error,
      showIcon = true,
      className,
      ...props
    },
    ref
  ) => {
    const inputType = format === 'time' ? 'time' : format === 'datetime' ? 'datetime-local' : 'date';
    
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        if (!inputValue) {
          onChange?.(null);
          return;
        }
        
        const date = new Date(inputValue);
        
        if (!isNaN(date.getTime())) {
          onChange?.(date);
        }
      },
      [onChange]
    );

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={inputType}
          value={formatDateForInput(value ?? null, format)}
          onChange={handleChange}
          min={minDate ? formatDateForInput(minDate, format) : undefined}
          max={maxDate ? formatDateForInput(maxDate, format) : undefined}
          className={cn(
            showIcon && 'pr-10',
            error && 'border-destructive focus:border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
        {showIcon && (
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

/**
 * Range de datas (início e fim)
 */
interface DateRangeInputProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartChange?: (date: Date | null) => void;
  onEndChange?: (date: Date | null) => void;
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  error?: boolean;
  labels?: { start?: string; end?: string };
}

export function DateRangeInput({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onChange,
  minDate,
  maxDate,
  className,
  error,
  labels = { start: 'De', end: 'Até' },
}: DateRangeInputProps) {
  const handleStartChange = useCallback(
    (date: Date | null) => {
      onStartChange?.(date);
      onChange?.({ start: date, end: endDate ?? null });
    },
    [onStartChange, onChange, endDate]
  );

  const handleEndChange = useCallback(
    (date: Date | null) => {
      onEndChange?.(date);
      onChange?.({ start: startDate ?? null, end: date });
    },
    [onEndChange, onChange, startDate]
  );

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2 sm:gap-4', className)}>
      <div className="flex-1 space-y-1">
        {labels.start && (
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {labels.start}
          </label>
        )}
        <DateInput
          value={startDate}
          onChange={handleStartChange}
          minDate={minDate}
          maxDate={endDate || maxDate}
          error={error}
        />
      </div>
      <div className="flex-1 space-y-1">
        {labels.end && (
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {labels.end}
          </label>
        )}
        <DateInput
          value={endDate}
          onChange={handleEndChange}
          minDate={startDate || minDate}
          maxDate={maxDate}
          error={error}
        />
      </div>
    </div>
  );
}

/**
 * Presets comuns de período
 */
interface DatePreset {
  label: string;
  getRange: () => { start: Date; end: Date };
}

export const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Hoje',
    getRange: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    },
  },
  {
    label: 'Ontem',
    getRange: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { start: yesterday, end };
    },
  },
  {
    label: 'Últimos 7 dias',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: 'Últimos 30 dias',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: 'Este mês',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: 'Mês passado',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: 'Este ano',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    },
  },
];
