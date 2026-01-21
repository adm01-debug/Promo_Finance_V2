import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface DonutChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  thickness?: number;
  gap?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showTotal?: boolean;
  totalLabel?: string;
  formatValue?: (value: number) => string;
  animated?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  gap = 2,
  showLabels = false,
  showLegend = true,
  showTotal = true,
  totalLabel = 'Total',
  formatValue = (v) => v.toLocaleString('pt-BR'),
  animated = true,
  className,
}: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { segments, total } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return { segments: [], total: 0 };
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - thickness) / 2;

    let currentAngle = -90; // Start from top
    const gapAngle = (gap / (2 * Math.PI * radius)) * 360;

    const segments = data.map((item, index) => {
      const percentage = item.value / total;
      const sweepAngle = percentage * 360 - gapAngle;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweepAngle;

      // Calculate arc path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = sweepAngle > 180 ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      `;

      // Calculate label position (middle of arc)
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelRadius = radius + thickness / 2 + 20;
      const labelX = centerX + labelRadius * Math.cos(midRad);
      const labelY = centerY + labelRadius * Math.sin(midRad);

      currentAngle = endAngle + gapAngle;

      return {
        id: item.id,
        label: item.label,
        value: item.value,
        percentage,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        path,
        labelX,
        labelY,
      };
    });

    return { segments, total };
  }, [data, size, thickness, gap]);

  const hoveredSegment = segments.find((s) => s.id === hoveredId);

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={segment.id}
              d={segment.path}
              fill="none"
              stroke={segment.color}
              strokeWidth={hoveredId === segment.id ? thickness + 6 : thickness}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-200',
                animated && 'animate-in fade-in duration-500'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredId(segment.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </svg>

        {/* Center content */}
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {hoveredSegment ? hoveredSegment.label : totalLabel}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(hoveredSegment ? hoveredSegment.value : total)}
            </span>
            {hoveredSegment && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(hoveredSegment.percentage * 100).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* Labels */}
        {showLabels && (
          <svg
            width={size + 100}
            height={size + 100}
            className="absolute -top-[50px] -left-[50px] pointer-events-none"
          >
            {segments.map((segment) => (
              <text
                key={segment.id}
                x={segment.labelX + 50}
                y={segment.labelY + 50}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {segment.label}
              </text>
            ))}
          </svg>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer',
                hoveredId === segment.id && 'bg-gray-100 dark:bg-gray-700'
              )}
              onMouseEnter={() => setHoveredId(segment.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {segment.label}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatValue(segment.value)}
              </div>
              <div className="text-xs text-gray-400 w-12 text-right">
                {(segment.percentage * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple pie chart (filled version)
interface PieChartProps {
  data: DonutChartData[];
  size?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  className,
}: PieChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { segments, total } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return { segments: [], total: 0 };

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;

    let currentAngle = -90;

    const segments = data.map((item, index) => {
      const percentage = item.value / total;
      const sweepAngle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweepAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = sweepAngle > 180 ? 1 : 0;

      const path = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;

      currentAngle = endAngle;

      return {
        id: item.id,
        label: item.label,
        value: item.value,
        percentage,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        path,
      };
    });

    return { segments, total };
  }, [data, size]);

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <svg width={size} height={size}>
        {segments.map((segment) => (
          <path
            key={segment.id}
            d={segment.path}
            fill={segment.color}
            className={cn(
              'transition-all duration-200',
              hoveredId === segment.id && 'opacity-80'
            )}
            onMouseEnter={() => setHoveredId(segment.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}
      </svg>

      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center gap-2"
              onMouseEnter={() => setHoveredId(segment.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.label}: {formatValue(segment.value)} ({(segment.percentage * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Half donut / gauge chart
interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function GaugeChart({
  value,
  max = 100,
  label,
  size = 200,
  thickness = 20,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  formatValue = (v) => `${v.toFixed(0)}%`,
  className,
}: GaugeChartProps) {
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size - thickness) / 2;

  const startAngle = 180;
  const endAngle = startAngle + percentage * 180;

  const describeArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + 20}>
        {/* Background arc */}
        <path
          d={describeArc(180, 360)}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        {percentage > 0 && (
          <path
            d={describeArc(180, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
      </svg>

      <div className="text-center -mt-8">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </div>
        {label && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

export type { DonutChartData };
export default DonutChart;
