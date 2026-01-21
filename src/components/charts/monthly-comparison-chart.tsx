import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface MonthlyData {
  mes: string;
  receitas: number;
  despesas: number;
  resultado?: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showResult?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const receitas = payload.find((p: any) => p.dataKey === 'receitas')?.value || 0;
    const despesas = payload.find((p: any) => p.dataKey === 'despesas')?.value || 0;
    const resultado = receitas - despesas;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Receitas:</span>
            </div>
            <span className="font-medium text-green-600">{formatCurrency(receitas)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Despesas:</span>
            </div>
            <span className="font-medium text-red-600">{formatCurrency(despesas)}</span>
          </div>
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Resultado:</span>
              <span
                className={cn(
                  'font-bold',
                  resultado >= 0 ? 'text-blue-600' : 'text-red-600'
                )}
              >
                {formatCurrency(resultado)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function MonthlyComparisonChart({
  data,
  className,
  height = 300,
  showLegend = true,
  showGrid = true,
  showResult = false,
}: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      resultado: item.receitas - item.despesas,
    }));
  }, [data]);

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barGap={4}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="mes"
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {value}
                </span>
              )}
            />
          )}
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="#22C55E"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          {showResult && (
            <Bar
              dataKey="resultado"
              name="Resultado"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal version for category comparison
export function HorizontalBarChart({
  data,
  className,
  height = 300,
  barColor = '#3B82F6',
}: {
  data: { nome: string; valor: number }[];
  className?: string;
  height?: number;
  barColor?: string;
}) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [data]);

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
          />
          <YAxis
            type="category"
            dataKey="nome"
            stroke="currentColor"
            className="text-gray-500 dark:text-gray-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Bar
            dataKey="valor"
            fill={barColor}
            radius={[0, 4, 4, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyComparisonChart;
