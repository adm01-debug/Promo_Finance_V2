import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  width?: number;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  barColor?: string;
  gridColor?: string;
  animate?: boolean;
  barRadius?: number;
  barGap?: number;
  formatValue?: (value: number) => string;
}

/**
 * Componente de gráfico de barras usando SVG
 */
export function BarChart({
  data,
  height = 200,
  width = 400,
  className,
  orientation = 'vertical',
  showGrid = true,
  showLabels = true,
  showValues = true,
  barColor = 'rgb(59, 130, 246)', // blue-500
  gridColor = 'rgb(229, 231, 235)', // gray-200
  animate = true,
  barRadius = 4,
  barGap = 0.2, // 20% gap entre barras
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: BarChartProps) {
  const isVertical = orientation === 'vertical';
  
  const padding = isVertical
    ? { top: 20, right: 20, bottom: showLabels ? 60 : 20, left: 60 }
    : { top: 20, right: 60, bottom: 20, left: showLabels ? 100 : 20 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { bars, maxValue, gridLines } = useMemo(() => {
    if (data.length === 0) {
      return { bars: [], maxValue: 0, gridLines: [] };
    }

    const max = Math.max(...data.map((d) => d.value));
    const barCount = data.length;
    
    // Calcular tamanho das barras
    const totalBarSpace = isVertical ? chartWidth : chartHeight;
    const barWidth = (totalBarSpace / barCount) * (1 - barGap);
    const gapWidth = (totalBarSpace / barCount) * barGap;

    const calculatedBars = data.map((d, i) => {
      const barLength = (d.value / (max || 1)) * (isVertical ? chartHeight : chartWidth);
      
      if (isVertical) {
        return {
          x: padding.left + i * (barWidth + gapWidth) + gapWidth / 2,
          y: padding.top + chartHeight - barLength,
          width: barWidth,
          height: barLength,
          ...d,
        };
      } else {
        return {
          x: padding.left,
          y: padding.top + i * (barWidth + gapWidth) + gapWidth / 2,
          width: barLength,
          height: barWidth,
          ...d,
        };
      }
    });

    // Grid lines
    const numLines = 5;
    const lines = [];
    for (let i = 0; i <= numLines; i++) {
      const value = (i / numLines) * max;
      lines.push({
        value,
        label: formatValue(value),
        position: isVertical
          ? padding.top + chartHeight - (i / numLines) * chartHeight
          : padding.left + (i / numLines) * chartWidth,
      });
    }

    return { bars: calculatedBars, maxValue: max, gridLines: lines };
  }, [data, chartWidth, chartHeight, padding, isVertical, barGap, formatValue]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-gray-400 dark:text-gray-600',
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
              {isVertical ? (
                <>
                  <line
                    x1={padding.left}
                    y1={line.position}
                    x2={width - padding.right}
                    y2={line.position}
                    stroke={gridColor}
                    strokeDasharray="2,2"
                    className="dark:stroke-gray-700"
                  />
                  <text
                    x={padding.left - 8}
                    y={line.position}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-gray-500 dark:fill-gray-400 text-xs"
                  >
                    {line.label}
                  </text>
                </>
              ) : (
                <>
                  <line
                    x1={line.position}
                    y1={padding.top}
                    x2={line.position}
                    y2={height - padding.bottom}
                    stroke={gridColor}
                    strokeDasharray="2,2"
                    className="dark:stroke-gray-700"
                  />
                  <text
                    x={line.position}
                    y={height - padding.bottom + 15}
                    textAnchor="middle"
                    className="fill-gray-500 dark:fill-gray-400 text-xs"
                  >
                    {line.label}
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
      )}

      {/* Bars */}
      {bars.map((bar, i) => (
        <g key={i}>
          <rect
            x={bar.x}
            y={bar.y}
            width={isVertical ? bar.width : 0}
            height={isVertical ? 0 : bar.height}
            rx={barRadius}
            ry={barRadius}
            fill={bar.color || barColor}
            className={cn(
              'transition-all duration-300 hover:opacity-80 cursor-pointer',
              animate && 'animate-grow-bar'
            )}
            style={animate ? {
              animation: `grow-bar 0.5s ease-out ${i * 50}ms forwards`,
              ...(isVertical 
                ? { height: bar.height, y: bar.y }
                : { width: bar.width }),
            } : undefined}
          >
            <title>{`${bar.label}: ${formatValue(bar.value)}`}</title>
          </rect>

          {/* Value labels */}
          {showValues && (
            <text
              x={isVertical ? bar.x + bar.width / 2 : bar.x + bar.width + 8}
              y={isVertical ? bar.y - 8 : bar.y + bar.height / 2}
              textAnchor={isVertical ? 'middle' : 'start'}
              dominantBaseline={isVertical ? 'auto' : 'middle'}
              className="fill-gray-700 dark:fill-gray-300 text-xs font-medium"
            >
              {formatValue(bar.value)}
            </text>
          )}

          {/* Labels */}
          {showLabels && (
            <text
              x={isVertical ? bar.x + bar.width / 2 : padding.left - 8}
              y={isVertical ? height - padding.bottom + 15 : bar.y + bar.height / 2}
              textAnchor={isVertical ? 'middle' : 'end'}
              dominantBaseline={isVertical ? 'auto' : 'middle'}
              className="fill-gray-600 dark:fill-gray-400 text-xs"
              transform={isVertical ? `rotate(-45, ${bar.x + bar.width / 2}, ${height - padding.bottom + 15})` : undefined}
            >
              {bar.label.length > 10 ? `${bar.label.slice(0, 10)}...` : bar.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * Stacked Bar Chart
 */
interface StackedBarData {
  label: string;
  values: { name: string; value: number; color: string }[];
}

interface StackedBarChartProps extends Omit<BarChartProps, 'data' | 'barColor'> {
  data: StackedBarData[];
  showLegend?: boolean;
}

export function StackedBarChart({
  data,
  showLegend = true,
  height = 200,
  width = 400,
  ...props
}: StackedBarChartProps) {
  const { bars, legend, maxTotal } = useMemo(() => {
    const totals = data.map((d) => d.values.reduce((sum, v) => sum + v.value, 0));
    const max = Math.max(...totals);
    
    const legendItems = data[0]?.values.map((v) => ({
      name: v.name,
      color: v.color,
    })) || [];

    return { bars: data, legend: legendItems, maxTotal: max };
  }, [data]);

  return (
    <div className="space-y-2">
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {legend.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <BarChart
        {...props}
        height={height}
        width={width}
        data={bars.map((b) => ({
          label: b.label,
          value: b.values.reduce((sum, v) => sum + v.value, 0),
        }))}
      />
    </div>
  );
}

/**
 * Grouped Bar Chart
 */
interface GroupedBarData {
  group: string;
  items: { name: string; value: number; color: string }[];
}

interface GroupedBarChartProps extends Omit<BarChartProps, 'data' | 'barColor'> {
  data: GroupedBarData[];
  showLegend?: boolean;
}

export function GroupedBarChart({
  data,
  showLegend = true,
  ...props
}: GroupedBarChartProps) {
  const legend = useMemo(() => {
    return data[0]?.items.map((item) => ({
      name: item.name,
      color: item.color,
    })) || [];
  }, [data]);

  // Flatten para BarChart simples por enquanto
  const flatData = data.flatMap((group) =>
    group.items.map((item) => ({
      label: `${group.group} - ${item.name}`,
      value: item.value,
      color: item.color,
    }))
  );

  return (
    <div className="space-y-2">
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {legend.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <BarChart {...props} data={flatData} />
    </div>
  );
}
