import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart,
  Legend,
  Line,
  Area,
} from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface FluxoCaixaChartProps {
  data: Array<{
    data: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
  periodoFluxo: string;
  setPeriodoFluxo: (value: string) => void;
}

export function FluxoCaixaChart({ data, periodoFluxo, setPeriodoFluxo }: FluxoCaixaChartProps) {
  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="h-[320px] sm:h-[360px] md:h-[400px]">
        <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Fluxo de Caixa</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">Receitas vs Despesas</CardDescription>
            </div>
            <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo}>
              <TabsList className="h-7 sm:h-8">
                <TabsTrigger value="7" className="text-[10px] sm:text-xs px-2 sm:px-3">7d</TabsTrigger>
                <TabsTrigger value="15" className="text-[10px] sm:text-xs px-2 sm:px-3">15d</TabsTrigger>
                <TabsTrigger value="30" className="text-[10px] sm:text-xs px-2 sm:px-3">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[220px] sm:h-[260px] md:h-[300px] p-2 sm:p-4 md:p-6 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="data" 
                tickFormatter={(v) => v.slice(8)} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={9} 
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={9}
                width={35}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(v: number) => formatCurrency(v)} 
                labelFormatter={(l) => `Data: ${l}`}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(150, 70%, 42%)" fill="url(#colorReceitas)" strokeWidth={2} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 78%, 55%)" fill="url(#colorDespesas)" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(215, 90%, 52%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
