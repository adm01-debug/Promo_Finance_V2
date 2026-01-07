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
    <motion.div variants={itemVariants} className="lg:col-span-2">
      <Card className="h-[400px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Fluxo de Caixa Projetado
              </CardTitle>
              <CardDescription>Receitas vs Despesas nos próximos dias</CardDescription>
            </div>
            <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo}>
              <TabsList className="h-8">
                <TabsTrigger value="7" className="text-xs">7d</TabsTrigger>
                <TabsTrigger value="15" className="text-xs">15d</TabsTrigger>
                <TabsTrigger value="30" className="text-xs">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
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
              <XAxis dataKey="data" tickFormatter={(v) => v.slice(8)} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip 
                formatter={(v: number) => formatCurrency(v)} 
                labelFormatter={(l) => `Data: ${l}`}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(150, 70%, 42%)" fill="url(#colorReceitas)" strokeWidth={2} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 78%, 55%)" fill="url(#colorDespesas)" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo Projetado" stroke="hsl(215, 90%, 52%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
