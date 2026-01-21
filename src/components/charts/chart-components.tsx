import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  meta?: Record<string, any>;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'progress';
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  format?: 'currency' | 'percent' | 'number';
  showLegend?: boolean;
  showValues?: boolean;
  height?: number;
  colors?: string[];
}

interface ChartContainerProps {
  config: ChartConfig;
  className?: string;
}

// Default colors
const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

// Format value helper
function formatChartValue(value: number, format?: string): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    default:
      return new Intl.NumberFormat('pt-BR').format(value);
  }
}

// Bar Chart Component
function BarChart({ data, format, showValues, colors = defaultColors }: {
  data: ChartDataPoint[];
  format?: string;
  showValues?: boolean;
  colors?: string[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = item.color || colors[index % colors.length];

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              {showValues && (
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatChartValue(item.value, format)}
                </span>
              )}
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Donut/Pie Chart Component
function DonutChart({ data, format, showValues, colors = defaultColors, isDonut = true }: {
  data: ChartDataPoint[];
  format?: string;
  showValues?: boolean;
  colors?: string[];
  isDonut?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate segments
  const segments = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      return {
        ...item,
        color: item.color || colors[index % colors.length],
        percentage,
        startAngle,
        endAngle: currentAngle,
      };
    });
  }, [data, total, colors]);

  // Generate SVG path for each segment
  const generateArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = 50 + outerRadius * Math.cos(startRad);
    const y1 = 50 + outerRadius * Math.sin(startRad);
    const x2 = 50 + outerRadius * Math.cos(endRad);
    const y2 = 50 + outerRadius * Math.sin(endRad);
    
    const x3 = 50 + innerRadius * Math.cos(endRad);
    const y3 = 50 + innerRadius * Math.sin(endRad);
    const x4 = 50 + innerRadius * Math.cos(startRad);
    const y4 = 50 + innerRadius * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    if (innerRadius === 0) {
      return `M 50 50 L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const innerRadius = isDonut ? 25 : 0;
  const outerRadius = 45;

  return (
    <div className="flex items-center gap-6">
      {/* Chart */}
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-0">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={generateArcPath(segment.startAngle, segment.endAngle, innerRadius, outerRadius)}
              fill={segment.color}
              className="transition-all duration-300 hover:opacity-80"
            >
              <title>{`${segment.label}: ${formatChartValue(segment.value, format)} (${segment.percentage.toFixed(1)}%)`}</title>
            </path>
          ))}
        </svg>
        {isDonut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {formatChartValue(total, format)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
              {segment.label}
            </span>
            {showValues && (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatChartValue(segment.value, format)}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progress Chart Component
function ProgressChart({ data, format, showValues, colors = defaultColors }: {
  data: ChartDataPoint[];
  format?: string;
  showValues?: boolean;
  colors?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((item, index) => {
        const percentage = Math.min(100, Math.max(0, item.value));
        const color = item.color || colors[index % colors.length];

        return (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              {showValues && (
                <span className="font-medium" style={{ color }}>
                  {format === 'percent' ? `${percentage.toFixed(0)}%` : formatChartValue(item.value, format)}
                </span>
              )}
            </div>
            <div className="relative w-20 h-20 mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {/* Background circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Line Chart Component (Simple)
function LineChart({ data, format, showValues, colors = defaultColors, height = 200 }: {
  data: ChartDataPoint[];
  format?: string;
  showValues?: boolean;
  colors?: string[];
  height?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 80 - 10;
    return { x, y, ...item };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-gray-200 dark:text-gray-700"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaD}
          fill={colors[0]}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={colors[0]}
            className="hover:r-3 transition-all"
          >
            <title>{`${point.label}: ${formatChartValue(point.value, format)}`}</title>
          </circle>
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {data.map((item, index) => (
          <span key={index} className="truncate max-w-[60px]">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

// Main Chart Container
export function ChartContainer({ config, className }: ChartContainerProps) {
  const {
    type,
    data,
    title,
    subtitle,
    format,
    showLegend = true,
    showValues = true,
    height = 200,
    colors = defaultColors,
  } = config;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <BarChart data={data} format={format} showValues={showValues} colors={colors} />;
      case 'pie':
        return <DonutChart data={data} format={format} showValues={showValues} colors={colors} isDonut={false} />;
      case 'donut':
        return <DonutChart data={data} format={format} showValues={showValues} colors={colors} isDonut={true} />;
      case 'progress':
        return <ProgressChart data={data} format={format} showValues={showValues} colors={colors} />;
      case 'line':
        return <LineChart data={data} format={format} showValues={showValues} colors={colors} height={height} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg p-4', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {renderChart()}
    </div>
  );
}

// Export chart types for external use
export { BarChart, DonutChart, ProgressChart, LineChart };
