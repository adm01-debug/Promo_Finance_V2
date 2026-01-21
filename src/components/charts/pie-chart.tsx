import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  size?: number;
  className?: string;
  showLabels?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  showPercentages?: boolean;
  innerRadius?: number; // 0 = pie, > 0 = donut
  animate?: boolean;
  formatValue?: (value: number) => string;
}

/**
 * Calcula coordenadas de um ponto no círculo
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Cria path de arco para SVG
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  if (innerRadius === 0) {
    // Pie slice (wedge)
    return [
      `M ${x} ${y}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  } else {
    // Donut slice
    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }
}

/**
 * Componente de gráfico de pizza/donut usando SVG
 */
export function PieChart({
  data,
  size = 200,
  className,
  showLabels = false,
  showValues = false,
  showLegend = true,
  showPercentages = true,
  innerRadius = 0,
  animate = true,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: PieChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 10; // padding
  const actualInnerRadius = innerRadius * radius;

  const { slices, total } = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    let currentAngle = 0;

    const calculatedSlices = data.map((d) => {
      const percentage = (d.value / (sum || 1)) * 100;
      const angle = (d.value / (sum || 1)) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const midAngle = startAngle + angle / 2;
      
      currentAngle = endAngle;

      // Posição do label
      const labelRadius = radius * 0.7;
      const labelPos = polarToCartesian(center, center, labelRadius, midAngle);

      return {
        ...d,
        percentage,
        startAngle,
        endAngle,
        midAngle,
        labelX: labelPos.x,
        labelY: labelPos.y,
        path: describeArc(center, center, radius, actualInnerRadius, startAngle, endAngle),
      };
    });

    return { slices: calculatedSlices, total: sum };
  }, [data, center, radius, actualInnerRadius]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-gray-400 dark:text-gray-600',
          className
        )}
        style={{ width: size, height: size }}
      >
        Sem dados
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {slices.map((slice, i) => (
          <g key={i}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth={2}
              className={cn(
                'transition-all duration-200 hover:opacity-80 cursor-pointer',
                animate && 'origin-center'
              )}
              style={animate ? {
                animation: `pie-slice-appear 0.5s ease-out ${i * 100}ms backwards`,
              } : undefined}
            >
              <title>{`${slice.label}: ${formatValue(slice.value)} (${slice.percentage.toFixed(1)}%)`}</title>
            </path>

            {/* Labels inside */}
            {showLabels && slice.percentage > 5 && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-medium pointer-events-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {showPercentages ? `${slice.percentage.toFixed(0)}%` : slice.label}
              </text>
            )}
          </g>
        ))}

        {/* Center text for donut */}
        {actualInnerRadius > 0 && showValues && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-700 dark:fill-gray-300 text-lg font-bold"
          >
            {formatValue(total)}
          </text>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-xs">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {slice.label}
                {showPercentages && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">
                    ({slice.percentage.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Donut Chart (PieChart com buraco no meio)
 */
export function DonutChart(props: Omit<PieChartProps, 'innerRadius'> & { innerRadius?: number }) {
  return <PieChart {...props} innerRadius={props.innerRadius ?? 0.6} />;
}

/**
 * Semi-circle / Gauge Chart
 */
interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  label?: string;
  formatValue?: (value: number) => string;
}

export function GaugeChart({
  value,
  max = 100,
  size = 200,
  className,
  color = 'rgb(59, 130, 246)',
  backgroundColor = 'rgb(229, 231, 235)',
  showValue = true,
  label,
  formatValue = (v) => `${v}%`,
}: GaugeChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 20;
  const innerRadius = radius * 0.7;
  
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const angle = percentage * 180;

  const backgroundPath = describeArc(center, size - 20, radius, innerRadius, 0, 180);
  const valuePath = describeArc(center, size - 20, radius, innerRadius, 0, angle);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill={backgroundColor}
          className="dark:fill-gray-700"
        />

        {/* Value arc */}
        <path
          d={valuePath}
          fill={color}
          className="transition-all duration-500"
        />

        {/* Center value */}
        {showValue && (
          <text
            x={center}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-700 dark:fill-gray-300 text-2xl font-bold"
          >
            {formatValue(value)}
          </text>
        )}
      </svg>

      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {label}
        </span>
      )}
    </div>
  );
}
