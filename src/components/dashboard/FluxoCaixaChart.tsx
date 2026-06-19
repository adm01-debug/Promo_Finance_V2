import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Legend, Line, Area,
} from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
} as const;

interface FluxoCaixaChartProps {
  data: Array<{ data: string; receitas: number; despesas: number; saldo: number }>;
  periodoFluxo: string;
  setPeriodoFluxo: (value: string) => void;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-2 min-w-[180px]">
      <p className="font-bold text-foreground border-b border-border pb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
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
      <Card className="h-[400px] border border-border bg-card shadow-sm rounded-xl group overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground font-heading">Fluxo de Caixa</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Projeção de entradas e saídas</CardDescription>
              </div>
            </div>
            <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo} className="bg-muted/50 p-0.5 rounded-lg border border-border">
              <TabsList className="h-8 bg-transparent border-none p-0">
                {['7', '15', '30'].map(v => (
                  <TabsTrigger key={v} value={v} className="text-[11px] px-3 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold rounded-md h-7">
                    {v}d
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] p-6 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: -15, right: 0, top: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="data"
                tickFormatter={(v) => v.slice(8)}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                fontSize={10}
                width={35}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeDasharray: '4 4' }} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '15px' }}
                formatter={(value: string) => <span className="text-muted-foreground font-medium">{value}</span>}
              />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fill="url(#gradReceitas)" strokeWidth={2} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="url(#gradDespesas)" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}