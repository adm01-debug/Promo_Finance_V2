import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Legend, Line, Area,
} from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface FluxoCaixaChartProps {
  data: Array<{ data: string; receitas: number; despesas: number; saldo: number }>;
  periodoFluxo: string;
  setPeriodoFluxo: (value: string) => void;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground text-sm">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold text-foreground tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function FluxoCaixaChart({ data, periodoFluxo, setPeriodoFluxo }: FluxoCaixaChartProps) {
  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="h-[320px] sm:h-[360px] md:h-[400px] overflow-hidden">
        <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">Fluxo de Caixa</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block mt-1">Projeção de receitas vs despesas</CardDescription>
            </div>
            <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo}>
              <TabsList className="h-8 bg-muted/60">
                {['7', '15', '30'].map(v => (
                  <TabsTrigger key={v} value={v} className="text-[10px] sm:text-xs px-2.5 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {v}d
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[220px] sm:h-[260px] md:h-[300px] p-2 sm:p-4 md:p-6 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="data"
                tickFormatter={(v) => v.slice(8)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                width={35}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
              />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--success))" fill="url(#gradReceitas)" strokeWidth={2} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--destructive))" fill="url(#gradDespesas)" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
