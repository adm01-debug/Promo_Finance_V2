import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HeatMapData {
  date: string; // YYYY-MM-DD
  value: number;
  label?: string;
}

interface CalendarHeatMapProps {
  data: HeatMapData[];
  startDate?: Date;
  endDate?: Date;
  colorScale?: string[];
  emptyColor?: string;
  onDayClick?: (date: string, value: number) => void;
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  cellSize?: number;
  cellGap?: number;
  title?: string;
  legend?: boolean;
}

const DEFAULT_COLOR_SCALE = [
  '#ebedf0', // 0 - empty
  '#9be9a8', // 1 - low
  '#40c463', // 2 - medium
  '#30a14e', // 3 - high
  '#216e39', // 4 - very high
];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function CalendarHeatMap({
  data,
  startDate,
  endDate,
  colorScale = DEFAULT_COLOR_SCALE,
  emptyColor = '#ebedf0',
  onDayClick,
  showMonthLabels = true,
  showWeekdayLabels = true,
  cellSize = 12,
  cellGap = 3,
  title,
  legend = true,
}: CalendarHeatMapProps) {
  // Calculate date range
  const { start, end, weeks, dataMap, maxValue } = useMemo(() => {
    const now = new Date();
    const end = endDate || now;
    const start = startDate || new Date(end.getFullYear(), end.getMonth() - 11, 1);
    
    // Create data map for quick lookup
    const dataMap = new Map<string, HeatMapData>();
    data.forEach((item) => {
      dataMap.set(item.date, item);
    });
    
    // Find max value for color scaling
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    
    // Calculate weeks
    const weeks: Array<Array<{ date: Date; value: number; label?: string } | null>> = [];
    let currentWeek: Array<{ date: Date; value: number; label?: string } | null> = [];
    
    const current = new Date(start);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday
    
    while (current <= end || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      if (current > end && currentWeek.length === 0) break;
      
      if (current < start || current > end) {
        currentWeek.push(null);
      } else {
        const dateStr = formatDate(current);
        const dayData = dataMap.get(dateStr);
        currentWeek.push({
          date: new Date(current),
          value: dayData?.value || 0,
          label: dayData?.label,
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return { start, end, weeks, dataMap, maxValue };
  }, [data, startDate, endDate]);

  // Get color for value
  const getColor = (value: number): string => {
    if (value === 0) return emptyColor;
    
    const index = Math.min(
      Math.ceil((value / maxValue) * (colorScale.length - 1)),
      colorScale.length - 1
    );
    return colorScale[index];
  };

  // Get month labels positions
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: number; position: number }> = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((d) => d !== null);
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month, position: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  const width = weeks.length * (cellSize + cellGap) + (showWeekdayLabels ? 30 : 0);
  const height = 7 * (cellSize + cellGap) + (showMonthLabels ? 20 : 0);

  return (
    <div className="inline-block">
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-3">
          {title}
        </h3>
      )}
      
      <svg width={width} height={height} className="overflow-visible">
        {/* Month labels */}
        {showMonthLabels && (
          <g transform={`translate(${showWeekdayLabels ? 30 : 0}, 0)`}>
            {monthLabels.map(({ month, position }) => (
              <text
                key={`${month}-${position}`}
                x={position * (cellSize + cellGap)}
                y={12}
                className="text-[10px] fill-muted-foreground"
              >
                {MONTH_LABELS[month]}
              </text>
            ))}
          </g>
        )}
        
        {/* Weekday labels */}
        {showWeekdayLabels && (
          <g transform={`translate(0, ${showMonthLabels ? 20 : 0})`}>
            {[1, 3, 5].map((day) => (
              <text
                key={day}
                x={0}
                y={day * (cellSize + cellGap) + cellSize / 2 + 4}
                className="text-[10px] fill-muted-foreground"
              >
                {WEEKDAY_LABELS[day]}
              </text>
            ))}
          </g>
        )}
        
        {/* Cells */}
        <g transform={`translate(${showWeekdayLabels ? 30 : 0}, ${showMonthLabels ? 20 : 0})`}>
          {weeks.map((week, weekIndex) => (
            <g key={weekIndex} transform={`translate(${weekIndex * (cellSize + cellGap)}, 0)`}>
              {week.map((day, dayIndex) => {
                if (!day) return null;
                
                const dateStr = formatDate(day.date);
                
                return (
                  <rect
                    key={dayIndex}
                    x={0}
                    y={dayIndex * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={getColor(day.value)}
                    className={cn(
                      'transition-colors',
                      onDayClick && 'cursor-pointer hover:stroke-muted-foreground hover:stroke-1'
                    )}
                    onClick={() => onDayClick?.(dateStr, day.value)}
                  >
                    <title>
                      {day.label || `${formatDateDisplay(day.date)}: ${day.value}`}
                    </title>
                  </rect>
                );
              })}
            </g>
          ))}
        </g>
      </svg>
      
      {/* Legend */}
      {legend && (
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
          <span>Menos</span>
          <div className="flex gap-1">
            {colorScale.map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>Mais</span>
        </div>
      )}
    </div>
  );
}

// Financial Heat Map (specialized for showing financial activity)
interface FinancialHeatMapProps {
  data: Array<{
    date: string;
    receitas: number;
    despesas: number;
  }>;
  type?: 'receitas' | 'despesas' | 'saldo';
  onDayClick?: (date: string) => void;
}

export function FinancialHeatMap({ data, type = 'saldo', onDayClick }: FinancialHeatMapProps) {
  const heatMapData = useMemo(() => {
    return data.map((item) => {
      let value: number;
      switch (type) {
        case 'receitas':
          value = item.receitas;
          break;
        case 'despesas':
          value = item.despesas;
          break;
        case 'saldo':
        default:
          value = item.receitas - item.despesas;
      }
      
      return {
        date: item.date,
        value: Math.abs(value),
        label: `${formatDateDisplay(new Date(item.date))}: R$ ${value.toLocaleString('pt-BR')}`,
      };
    });
  }, [data, type]);

  const colorScale = type === 'receitas' 
    ? ['#ebedf0', '#d4edda', '#9be9a8', '#40c463', '#216e39']
    : type === 'despesas'
    ? ['#ebedf0', '#f8d7da', '#f5c6cb', '#e76f7d', '#c82333']
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  return (
    <CalendarHeatMap
      data={heatMapData}
      colorScale={colorScale}
      onDayClick={(date) => onDayClick?.(date)}
      title={
        type === 'receitas' 
          ? 'Receitas por Dia' 
          : type === 'despesas' 
          ? 'Despesas por Dia' 
          : 'Saldo por Dia'
      }
    />
  );
}

// Activity Heat Map (for showing user activity)
interface ActivityHeatMapProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  onDayClick?: (date: string) => void;
}

export function ActivityHeatMap({ data, onDayClick }: ActivityHeatMapProps) {
  const heatMapData = useMemo(() => {
    return data.map((item) => ({
      date: item.date,
      value: item.count,
      label: `${formatDateDisplay(new Date(item.date))}: ${item.count} atividade${item.count !== 1 ? 's' : ''}`,
    }));
  }, [data]);

  return (
    <CalendarHeatMap
      data={heatMapData}
      onDayClick={(date) => onDayClick?.(date)}
      title="Atividade por Dia"
    />
  );
}

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default CalendarHeatMap;
