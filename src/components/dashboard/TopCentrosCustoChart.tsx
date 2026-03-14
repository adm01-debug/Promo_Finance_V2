import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface CentroCustoData { nome: string; pagar: number; receber: number; saldo: number }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border/60 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[180px]">
      <p className="font-semibold text-foreground text-sm border-b border-border/40 pb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold text-foreground tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TopCentrosCustoChart({ dadosPorCentroCusto }: { dadosPorCentroCusto: CentroCustoData[] }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-[450px] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            Top Centros de Custo
          </CardTitle>
          <CardDescription>Por volume financeiro</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosPorCentroCusto.slice(0, 5)} layout="vertical">
              <defs>
                <linearGradient id="gradReceber" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="gradPagar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={100}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => <span className="text-muted-foreground text-xs">{value}</span>}
              />
              <Bar dataKey="receber" name="A Receber" fill="url(#gradReceber)" radius={[0, 6, 6, 0]} />
              <Bar dataKey="pagar" name="A Pagar" fill="url(#gradPagar)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
