import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency, getPercentage } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CategoryData {
  nome: string;
  valor: number;
  cor: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  className?: string;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  title?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.cor }}
          />
          <span className="font-medium text-foreground">
            {data.nome}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.valor)}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {data.percentual?.toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show label for very small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CategoryPieChart({
  data,
  className,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  title,
}: CategoryPieChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.valor, 0);
    return data
      .filter((item) => item.valor > 0)
      .map((item) => ({
        ...item,
        percentual: getPercentage(item.valor, total),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [data]);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.valor, 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-gray-500 dark:text-gray-400',
          className
        )}
        style={{ height }}
      >
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="valor"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center label showing total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact version without legend
export function CategoryPieChartCompact({
  data,
  className,
  size = 120,
}: {
  data: CategoryData[];
  className?: string;
  size?: number;
}) {
  const chartData = useMemo(() => {
    return data
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-gray-400 text-sm',
          className
        )}
        style={{ width: size, height: size }}
      >
        Sem dados
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="valor"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryPieChart;
