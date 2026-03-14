import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface DataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

interface TrendLineProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showArea?: boolean;
  areaOpacity?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
  showDots?: boolean;
  dotSize?: number;
  curved?: boolean;
  animated?: boolean;
  formatX?: (value: string | number | Date) => string;
  formatY?: (value: number) => string;
  className?: string;
}

export function TrendLine({
  data,
  width = 400,
  height = 200,
  color = 'hsl(var(--primary))',
  strokeWidth = 2,
  showArea = true,
  areaOpacity = 0.1,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  showDots = false,
  dotSize = 4,
  curved = true,
  animated = true,
  formatX = (v) => String(v),
  formatY = (v) => v.toLocaleString('pt-BR'),
  className,
}: TrendLineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const padding = { top: 20, right: 20, bottom: showXAxis ? 40 : 20, left: showYAxis ? 60 : 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { path, areaPath, points, yTicks, xTicks, minY, maxY } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', areaPath: '', points: [], yTicks: [], xTicks: [], minY: 0, maxY: 0 };
    }

    const values = data.map((d) => d.y);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const rangeY = maxY - minY || 1;

    const paddedMinY = minY - rangeY * 0.1;
    const paddedMaxY = maxY + rangeY * 0.1;
    const paddedRangeY = paddedMaxY - paddedMinY;

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.y - paddedMinY) / paddedRangeY) * chartHeight,
      data: d,
    }));

    let path: string;
    if (curved && points.length > 2) {
      path = points.reduce((acc, point, i, arr) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        
        const p0 = arr[Math.max(i - 2, 0)];
        const p1 = arr[i - 1];
        const p2 = point;
        const p3 = arr[Math.min(i + 1, arr.length - 1)];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }, '');
    } else {
      path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }

    const areaPath = showArea
      ? `${path} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
      : '';

    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount }, (_, i) => {
      const value = paddedMinY + (paddedRangeY * i) / (yTickCount - 1);
      const y = padding.top + chartHeight - (i / (yTickCount - 1)) * chartHeight;
      return { value, y };
    });

    const xTickCount = Math.min(data.length, 6);
    const step = Math.floor(data.length / (xTickCount - 1));
    const xTicks = Array.from({ length: xTickCount }, (_, i) => {
      const index = Math.min(i * step, data.length - 1);
      return {
        value: data[index].x,
        x: points[index].x,
      };
    });

    return { path, areaPath, points, yTicks, xTicks, minY: paddedMinY, maxY: paddedMaxY };
  }, [data, chartWidth, chartHeight, padding, curved, showArea]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className={cn('relative', className)}>
      <svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid && (
          <g className="text-border">
            {yTicks.map((tick, i) => (
              <line
                key={`grid-y-${i}`}
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray="4"
              />
            ))}
          </g>
        )}

        {/* Area */}
        {showArea && areaPath && (
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={areaOpacity * 2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        {showArea && areaPath && (
          <path
            d={areaPath}
            fill="url(#area-gradient)"
            className={animated ? 'animate-in fade-in duration-500' : ''}
          />
        )}

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'animate-in fade-in duration-500' : ''}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? dotSize + 2 : dotSize}
            fill={color}
            className="transition-all duration-150"
          />
        ))}

        {/* Y Axis */}
        {showYAxis && (
          <>
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            {yTicks.map((tick, i) => (
              <text
                key={`y-${i}`}
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {formatY(tick.value)}
              </text>
            ))}
          </>
        )}

        {/* X Axis */}
        {showXAxis && (
          <>
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={width - padding.right}
              y2={padding.top + chartHeight}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            {xTicks.map((tick, i) => (
              <text
                key={`x-${i}`}
                x={tick.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {formatX(tick.value)}
              </text>
            ))}
          </>
        )}

        {/* Hover detection areas */}
        {showTooltip && points.map((point, i) => (
          <rect
            key={`hover-${i}`}
            x={point.x - chartWidth / data.length / 2}
            y={padding.top}
            width={chartWidth / data.length}
            height={chartHeight}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Hover indicator */}
        {showTooltip && hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + chartHeight}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={6}
              fill="hsl(var(--card))"
              stroke={color}
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredPoint && (
        <div
          className="absolute z-10 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg pointer-events-none border border-border"
          style={{
            left: hoveredPoint.x,
            top: hoveredPoint.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">{formatY(hoveredPoint.data.y)}</div>
          <div className="text-muted-foreground text-xs">{formatX(hoveredPoint.data.x)}</div>
        </div>
      )}
    </div>
  );
}

// Multi-line trend chart
interface MultiLineData {
  id: string;
  name: string;
  color: string;
  data: DataPoint[];
}

interface MultiTrendLineProps {
  series: MultiLineData[];
  width?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  formatX?: (value: string | number | Date) => string;
  formatY?: (value: number) => string;
  className?: string;
}

export function MultiTrendLine({
  series,
  width = 400,
  height = 200,
  showLegend = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  formatX = (v) => String(v),
  formatY = (v) => v.toLocaleString('pt-BR'),
  className,
}: MultiTrendLineProps) {
  const [activeSeries, setActiveSeries] = useState<Set<string>>(
    new Set(series.map((s) => s.id))
  );

  const toggleSeries = (id: string) => {
    setActiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const padding = { top: 20, right: 20, bottom: showXAxis ? 40 : 20, left: showYAxis ? 60 : 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { paths, yTicks, xTicks } = useMemo(() => {
    const activeData = series.filter((s) => activeSeries.has(s.id));
    const allValues = activeData.flatMap((s) => s.data.map((d) => d.y));
    
    if (allValues.length === 0) {
      return { paths: [], yTicks: [], xTicks: [] };
    }

    const minY = Math.min(...allValues);
    const maxY = Math.max(...allValues);
    const rangeY = maxY - minY || 1;
    const paddedMinY = minY - rangeY * 0.1;
    const paddedMaxY = maxY + rangeY * 0.1;
    const paddedRangeY = paddedMaxY - paddedMinY;

    const paths = activeData.map((s) => {
      const points = s.data.map((d, i) => ({
        x: padding.left + (i / (s.data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - ((d.y - paddedMinY) / paddedRangeY) * chartHeight,
      }));

      const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      return { id: s.id, color: s.color, path };
    });

    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount }, (_, i) => {
      const value = paddedMinY + (paddedRangeY * i) / (yTickCount - 1);
      const y = padding.top + chartHeight - (i / (yTickCount - 1)) * chartHeight;
      return { value, y };
    });

    const firstSeries = activeData[0];
    const xTickCount = Math.min(firstSeries?.data.length || 0, 6);
    const step = Math.floor((firstSeries?.data.length || 1) / (xTickCount - 1));
    const xTicks = Array.from({ length: xTickCount }, (_, i) => {
      const index = Math.min(i * step, (firstSeries?.data.length || 1) - 1);
      const x = padding.left + (index / ((firstSeries?.data.length || 1) - 1)) * chartWidth;
      return {
        value: firstSeries?.data[index]?.x || '',
        x,
      };
    });

    return { paths, yTicks, xTicks };
  }, [series, activeSeries, chartWidth, chartHeight, padding]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4">
          {series.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                activeSeries.has(s.id)
                  ? 'bg-muted'
                  : 'bg-muted/50 opacity-50'
              )}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <svg width={width} height={height}>
        {/* Grid */}
        {showGrid && (
          <g>
            {yTicks.map((tick, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="hsl(var(--border))"
                strokeDasharray="4"
              />
            ))}
          </g>
        )}

        {/* Lines */}
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.path}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Axes */}
        {showYAxis && yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
          >
            {formatY(tick.value)}
          </text>
        ))}

        {showXAxis && xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={padding.top + chartHeight + 20}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {formatX(tick.value)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export type { DataPoint, MultiLineData };
export default TrendLine;
