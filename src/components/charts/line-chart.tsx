import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  className?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  showDots?: boolean;
  lineColor?: string;
  fillColor?: string;
  gridColor?: string;
  animate?: boolean;
  formatValue?: (value: number) => string;
}

/**
 * Componente de gráfico de linha usando SVG
 */
export function LineChart({
  data,
  height = 200,
  width = 400,
  className,
  showGrid = true,
  showLabels = true,
  showValues = false,
  showDots = true,
  lineColor = 'rgb(59, 130, 246)', // blue-500
  fillColor = 'rgba(59, 130, 246, 0.1)',
  gridColor = 'rgb(229, 231, 235)', // gray-200
  animate = true,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { points, minValue, maxValue, path, areaPath } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], minValue: 0, maxValue: 0, path: '', areaPath: '' };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const calculatedPoints = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
      ...d,
    }));

    const linePath = calculatedPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const area = `${linePath} L ${calculatedPoints[calculatedPoints.length - 1]?.x || 0} ${
      padding.top + chartHeight
    } L ${padding.left} ${padding.top + chartHeight} Z`;

    return {
      points: calculatedPoints,
      minValue: min,
      maxValue: max,
      path: linePath,
      areaPath: area,
    };
  }, [data, chartWidth, chartHeight, padding]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const numLines = 5;
    const range = maxValue - minValue || 1;

    for (let i = 0; i <= numLines; i++) {
      const y = padding.top + (i / numLines) * chartHeight;
      const value = maxValue - (i / numLines) * range;
      
      lines.push({
        y,
        value,
        label: formatValue(value),
      });
    }

    return lines;
  }, [maxValue, minValue, chartHeight, padding, formatValue]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        Sem dados
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Grid */}
      {showGrid && (
        <g className="grid">
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke={gridColor}
                strokeDasharray="2,2"
                className="dark:stroke-border"
              />
              <text
                x={padding.left - 8}
                y={line.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-500 dark:fill-gray-400 text-xs"
              >
                {line.label}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Area fill */}
      {fillColor && (
        <path
          d={areaPath}
          fill={fillColor}
          className={cn(animate && 'animate-fade-in')}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(animate && 'animate-draw-line')}
        style={animate ? {
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          animation: 'draw-line 1s ease-out forwards',
        } : undefined}
      />

      {/* Dots */}
      {showDots && points.map((point, i) => (
        <g key={i}>
          <circle
            cx={point.x}
            cy={point.y}
            r={4}
            fill="white"
            stroke={lineColor}
            strokeWidth={2}
            className={cn(
              'transition-transform hover:scale-150 cursor-pointer',
              animate && 'animate-scale-in'
            )}
            style={animate ? { animationDelay: `${i * 50}ms` } : undefined}
          />
          {showValues && (
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              className="fill-gray-700 dark:fill-gray-300 text-xs font-medium"
            >
              {formatValue(point.value)}
            </text>
          )}
        </g>
      ))}

      {/* Labels */}
      {showLabels && points.map((point, i) => (
        <text
          key={i}
          x={point.x}
          y={height - 10}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400 text-xs"
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Componente para múltiplas linhas
 */
interface MultiLineDataSeries {
  name: string;
  data: DataPoint[];
  color: string;
}

interface MultiLineChartProps extends Omit<LineChartProps, 'data' | 'lineColor' | 'fillColor'> {
  series: MultiLineDataSeries[];
  showLegend?: boolean;
}

export function MultiLineChart({
  series,
  showLegend = true,
  ...props
}: MultiLineChartProps) {
  // Normalizar dados
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  return (
    <div className="space-y-2">
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        {series.map((s, i) => (
          <div
            key={s.name}
            className={i === 0 ? '' : 'absolute inset-0'}
          >
            <LineChart
              {...props}
              data={s.data}
              lineColor={s.color}
              fillColor={i === 0 ? `${s.color}20` : 'transparent'}
              showLabels={i === 0}
              showGrid={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
