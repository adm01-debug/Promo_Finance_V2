import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths, startOfYear, endOfYear, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  presets?: boolean;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

interface PresetOption {
  label: string;
  getValue: () => DateRange;
}

const defaultPresets: PresetOption[] = [
  {
    label: 'Hoje',
    getValue: () => {
      const today = new Date();
      return { start: today, end: today };
    },
  },
  {
    label: 'Ontem',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: yesterday, end: yesterday };
    },
  },
  {
    label: 'Últimos 7 dias',
    getValue: () => ({
      start: subDays(new Date(), 6),
      end: new Date(),
    }),
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => ({
      start: subDays(new Date(), 29),
      end: new Date(),
    }),
  },
  {
    label: 'Este mês',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'Este ano',
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecione o período',
  presets = true,
  className,
  disabled = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>({ start: null, end: null });
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync temp range with value
  useEffect(() => {
    if (value) {
      setTempRange(value);
    }
  }, [value]);

  const handlePresetSelect = (preset: PresetOption) => {
    const range = preset.getValue();
    setTempRange(range);
    onChange?.(range);
    setIsOpen(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (isValid(date)) {
      const newRange = { ...tempRange, start: date };
      setTempRange(newRange);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (isValid(date)) {
      const newRange = { ...tempRange, end: date };
      setTempRange(newRange);
    }
  };

  const handleApply = () => {
    onChange?.(tempRange);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyRange = { start: null, end: null };
    setTempRange(emptyRange);
    onChange?.(emptyRange);
  };

  const formatDateRange = () => {
    if (!value?.start && !value?.end) return placeholder;
    
    const formatStr = 'dd/MM/yyyy';
    const startStr = value.start ? format(value.start, formatStr, { locale: ptBR }) : '';
    const endStr = value.end ? format(value.end, formatStr, { locale: ptBR }) : '';
    
    if (startStr && endStr) {
      return `${startStr} - ${endStr}`;
    }
    return startStr || endStr;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2',
          'border border-gray-300 dark:border-gray-600 rounded-lg',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          'hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-primary-500 border-transparent'
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={cn(
            'text-sm',
            !value?.start && !value?.end && 'text-gray-400'
          )}>
            {formatDateRange()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(value?.start || value?.end) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex">
            {/* Presets */}
            {presets && (
              <div className="w-40 border-r border-gray-200 dark:border-gray-700 p-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">
                  Atalhos
                </p>
                <div className="space-y-1">
                  {defaultPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date inputs */}
            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={tempRange.start ? format(tempRange.start, 'yyyy-MM-dd') : ''}
                    onChange={handleStartDateChange}
                    min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                    max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={tempRange.end ? format(tempRange.end, 'yyyy-MM-dd') : ''}
                    onChange={handleEndDateChange}
                    min={tempRange.start ? format(tempRange.start, 'yyyy-MM-dd') : minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                    max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!tempRange.start || !tempRange.end}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
