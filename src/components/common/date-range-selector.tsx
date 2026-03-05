import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, getDateRange, DateRangeType } from '@/lib/date-utils';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
  presets?: DateRangeType[];
}

const defaultPresets: DateRangeType[] = [
  'today',
  'yesterday',
  'last7Days',
  'last30Days',
  'thisMonth',
  'lastMonth',
  'thisYear',
];

const presetLabels: Record<DateRangeType, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  thisWeek: 'Esta semana',
  lastWeek: 'Semana passada',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado',
  thisQuarter: 'Este trimestre',
  lastQuarter: 'Trimestre passado',
  thisYear: 'Este ano',
  lastYear: 'Ano passado',
  last7Days: 'Últimos 7 dias',
  last30Days: 'Últimos 30 dias',
  last90Days: 'Últimos 90 dias',
  last365Days: 'Últimos 365 dias',
};

export function DateRangeSelector({
  value,
  onChange,
  className,
  placeholder = 'Selecione o período',
  presets = defaultPresets,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<DateRangeType | 'custom' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: DateRangeType) => {
    const range = getDateRange(preset);
    setSelectedPreset(preset);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (start <= end) {
        setSelectedPreset('custom');
        onChange({ start, end });
        setIsOpen(false);
      }
    }
  };

  const displayText = value
    ? `${formatDate(value.start)} - ${formatDate(value.end)}`
    : placeholder;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={cn(!value && 'text-gray-400')}>{displayText}</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* Presets */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
              Período predefinido
            </p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                    selectedPreset === preset
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span>{presetLabels[preset]}</span>
                  {selectedPreset === preset && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Período personalizado
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="w-full mt-2"
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for tables/filters
export function DateRangeSelectorCompact({
  value,
  onChange,
  className,
}: Omit<DateRangeSelectorProps, 'presets' | 'placeholder'>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickPresets: DateRangeType[] = ['today', 'last7Days', 'last30Days', 'thisMonth'];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <Calendar className="w-4 h-4" />
        {value ? (
          <span className="text-gray-900 dark:text-white">
            {formatDate(value.start)} - {formatDate(value.end)}
          </span>
        ) : (
          <span>Período</span>
        )}
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                onChange(getDateRange(preset));
                setIsOpen(false);
              }}
              className="block w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {presetLabels[preset]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DateRangeSelector;
