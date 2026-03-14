import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  fillOpacity?: number;
  showDots?: boolean;
  dotSize?: number;
  showMin?: boolean;
  showMax?: boolean;
  showLast?: boolean;
  animated?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 30,
  color = '#3b82f6',
  strokeWidth = 2,
  filled = false,
  fillOpacity = 0.2,
  showDots = false,
  dotSize = 3,
  showMin = false,
  showMax = false,
  showLast = false,
  animated = true,
  className,
}: SparklineProps) {
  const { path, fillPath, points, min, max, minIndex, maxIndex } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', fillPath: '', points: [], min: 0, max: 0, minIndex: 0, maxIndex: 0 };
    }

    const padding = showDots ? dotSize : 0;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((value - minValue) / range) * effectiveHeight,
      value,
    }));

    const minIndex = data.indexOf(minValue);
    const maxIndex = data.indexOf(maxValue);

    // Build SVG path
    const pathCommands = points.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    );
    const path = pathCommands.join(' ');

    // Build fill path (closed path for area fill)
    const fillPath = filled
      ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`
      : '';

    return { path, fillPath, points, min: minValue, max: maxValue, minIndex, maxIndex };
  }, [data, width, height, showDots, dotSize, filled]);

  if (data.length < 2) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
    >
      {/* Gradient definition for fill */}
      {filled && (
        <defs>
          <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      {/* Fill area */}
      {filled && fillPath && (
        <path
          d={fillPath}
          fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
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
          r={dotSize}
          fill={color}
          className={animated ? 'animate-in zoom-in duration-300' : ''}
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}

      {/* Min point */}
      {showMin && points[minIndex] && (
        <circle
          cx={points[minIndex].x}
          cy={points[minIndex].y}
          r={dotSize + 1}
          fill="#ef4444"
          stroke="white"
          strokeWidth={1}
        />
      )}

      {/* Max point */}
      {showMax && points[maxIndex] && (
        <circle
          cx={points[maxIndex].x}
          cy={points[maxIndex].y}
          r={dotSize + 1}
          fill="#22c55e"
          stroke="white"
          strokeWidth={1}
        />
      )}

      {/* Last point */}
      {showLast && points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={dotSize + 1}
          fill={color}
          stroke="white"
          strokeWidth={1}
        />
      )}
    </svg>
  );
}

// Bar sparkline variant
interface BarSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  negativeColor?: string;
  gap?: number;
  radius?: number;
  className?: string;
}

export function BarSparkline({
  data,
  width = 120,
  height = 30,
  color = '#3b82f6',
  negativeColor = '#ef4444',
  gap = 2,
  radius = 1,
  className,
}: BarSparklineProps) {
  const bars = useMemo(() => {
    if (data.length === 0) return [];

    const barWidth = (width - gap * (data.length - 1)) / data.length;
    const maxAbs = Math.max(...data.map(Math.abs));
    const hasNegative = data.some((v) => v < 0);
    const baseline = hasNegative ? height / 2 : height;

    return data.map((value, index) => {
      const normalizedHeight = (Math.abs(value) / maxAbs) * (hasNegative ? height / 2 : height);
      const isNegative = value < 0;
      
      return {
        x: index * (barWidth + gap),
        y: isNegative ? baseline : baseline - normalizedHeight,
        width: barWidth,
        height: normalizedHeight,
        color: isNegative ? negativeColor : color,
      };
    });
  }, [data, width, height, gap, color, negativeColor]);

  if (data.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <svg width={width} height={height} className={className}>
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={Math.max(bar.width, 1)}
          height={Math.max(bar.height, 1)}
          fill={bar.color}
          rx={radius}
          className="animate-in slide-in-from-bottom-1 duration-300"
          style={{ animationDelay: `${i * 30}ms` }}
        />
      ))}
    </svg>
  );
}

// Win/Loss sparkline (for boolean/binary data)
interface WinLossSparklineProps {
  data: boolean[];
  width?: number;
  height?: number;
  winColor?: string;
  lossColor?: string;
  gap?: number;
  className?: string;
}

export function WinLossSparkline({
  data,
  width = 120,
  height = 20,
  winColor = '#22c55e',
  lossColor = '#ef4444',
  gap = 2,
  className,
}: WinLossSparklineProps) {
  const bars = useMemo(() => {
    if (data.length === 0) return [];

    const barWidth = (width - gap * (data.length - 1)) / data.length;
    const halfHeight = height / 2;

    return data.map((isWin, index) => ({
      x: index * (barWidth + gap),
      y: isWin ? 0 : halfHeight,
      width: barWidth,
      height: halfHeight - 1,
      color: isWin ? winColor : lossColor,
    }));
  }, [data, width, height, gap, winColor, lossColor]);

  if (data.length === 0) return null;

  return (
    <svg width={width} height={height} className={className}>
      {/* Center line */}
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={Math.max(bar.width, 1)}
          height={bar.height}
          fill={bar.color}
          rx={1}
        />
      ))}
    </svg>
  );
}

// Trend indicator with sparkline
interface TrendSparklineProps {
  data: number[];
  label?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  width?: number;
  height?: number;
}

export function TrendSparkline({
  data,
  label,
  value,
  trend,
  width = 80,
  height = 24,
}: TrendSparklineProps) {
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (data.length < 2) return 'neutral';
    return data[data.length - 1] >= data[0] ? 'up' : 'down';
  }, [data, trend]);

  const color = calculatedTrend === 'up' 
    ? '#22c55e' 
    : calculatedTrend === 'down' 
    ? '#ef4444' 
    : '#6b7280';

  return (
    <div className="flex items-center gap-3">
      {(label || value) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {label}
            </span>
          )}
          {value && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {value}
            </span>
          )}
        </div>
      )}
      <Sparkline
        data={data}
        width={width}
        height={height}
        color={color}
        strokeWidth={1.5}
        showLast
      />
    </div>
  );
}

export default Sparkline;
