import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CashFlowData {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span
              className={cn(
                'font-medium',
                entry.name === 'Receitas' && 'text-green-600',
                entry.name === 'Despesas' && 'text-red-600',
                entry.name === 'Saldo' && (entry.value >= 0 ? 'text-blue-600' : 'text-red-600')
              )}
            >
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CashFlowChart({
  data,
  className,
  height = 300,
  showLegend = true,
  showGrid = true,
}: CashFlowChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: item.data,
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
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
          )}
          <XAxis
            dataKey="name"
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
                <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
              )}
            />
          )}
          <defs>
            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="receitas"
            name="Receitas"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#colorReceitas)"
          />
          <Area
            type="monotone"
            dataKey="despesas"
            name="Despesas"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#colorDespesas)"
          />
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorSaldo)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CashFlowChart;
