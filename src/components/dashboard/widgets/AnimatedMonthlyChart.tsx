import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, Activity, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/micro-interactions';

interface EvolucaoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

interface AnimatedMonthlyChartProps {
  data: EvolucaoMensal[] | undefined;
  isLoading: boolean;
}

type ChartType = 'area' | 'bar' | 'composed';

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.3 }
  }
} as const;

const summaryVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const }
  })
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-popover border border-border rounded-lg p-3 shadow-lg"
      >
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

export const AnimatedMonthlyChart = ({ data, isLoading }: AnimatedMonthlyChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('composed');

  // Calculate totals for summary
  const totals = data?.reduce(
    (acc, item) => ({
      receitas: acc.receitas + item.receitas,
      despesas: acc.despesas + item.despesas,
      lucro: acc.lucro + item.lucro,
    }),
    { receitas: 0, despesas: 0, lucro: 0 }
  ) || { receitas: 0, despesas: 0, lucro: 0 };

  const summaryItems = [
    { label: 'Total Receitas', value: totals.receitas, color: 'text-green-600' },
    { label: 'Total Despesas', value: totals.despesas, color: 'text-red-500' },
    { label: 'Lucro Líquido', value: totals.lucro, color: totals.lucro >= 0 ? 'text-blue-600' : 'text-red-500' },
  ];

  const renderChart = () => {
    if (!data) return null;

    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceitasAnim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDespesasAnim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="mes" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="receitas" 
              name="Receitas"
              stroke="hsl(150, 70%, 42%)" 
              fill="url(#colorReceitasAnim)" 
              strokeWidth={2}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Area 
              type="monotone" 
              dataKey="despesas" 
              name="Despesas"
              stroke="hsl(0, 78%, 55%)" 
              fill="url(#colorDespesasAnim)" 
              strokeWidth={2}
              animationDuration={1500}
              animationEasing="ease-out"
              animationBegin={300}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data} barGap={8}>
            <XAxis 
              dataKey="mes" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="receitas" 
              name="Receitas"
              fill="hsl(150, 70%, 42%)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Bar 
              dataKey="despesas" 
              name="Despesas"
              fill="hsl(0, 78%, 55%)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={200}
            />
          </BarChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorLucroAnim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215, 90%, 52%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(215, 90%, 52%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="mes" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="receitas" 
              name="Receitas"
              fill="hsl(150, 70%, 42%)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Bar 
              dataKey="despesas" 
              name="Despesas"
              fill="hsl(0, 78%, 55%)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={200}
            />
            <Area 
              type="monotone" 
              dataKey="lucro" 
              name="Lucro"
              stroke="hsl(215, 90%, 52%)" 
              fill="url(#colorLucroAnim)"
              strokeWidth={2}
              animationDuration={1500}
              animationEasing="ease-out"
              animationBegin={400}
            />
            <Line 
              type="monotone" 
              dataKey="lucro" 
              name="Tendência"
              stroke="hsl(275, 75%, 55%)" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: 'hsl(275, 75%, 55%)' }}
              animationDuration={1500}
              animationEasing="ease-out"
              animationBegin={600}
            />
          </ComposedChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-bold">
                  Evolução Mensal
                </CardTitle>
                <CardDescription>Receitas, despesas e lucro</CardDescription>
              </div>
            </div>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <TabsList className="h-9 bg-muted/80 backdrop-blur-sm">
                <TabsTrigger value="area" className="text-xs gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Área
                </TabsTrigger>
                <TabsTrigger value="bar" className="text-xs gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Barras
                </TabsTrigger>
                <TabsTrigger value="composed" className="text-xs gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <Activity className="h-3.5 w-3.5" />
                  Misto
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={summaryVariants}
                whileHover={{ scale: 1.03, y: -2 }}
                className={cn(
                  "rounded-xl p-3 text-center cursor-pointer transition-all duration-200",
                  index === 0 && "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30",
                  index === 1 && "bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-900/30",
                  index === 2 && "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30"
                )}
              >
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 mx-auto mt-1" />
                ) : (
                  <motion.p 
                    className={cn('text-sm font-bold tabular-nums', item.color)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <AnimatedCounter 
                      value={item.value} 
                      duration={1000}
                      formatter={(v) => formatCurrency(v)} 
                    />
                  </motion.p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[280px] relative">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent rounded-xl pointer-events-none" />
            
            {isLoading ? (
              <div className="h-full flex items-end gap-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="flex-1 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <motion.div
                      className="w-full bg-gradient-to-t from-muted to-muted/50 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 60 + 30}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                    <Skeleton className="w-8 h-3" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={chartType}
                  variants={chartVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
