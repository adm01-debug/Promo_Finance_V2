import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface StatusData { name: string; value: number; fill: string }

interface StatusContasPieChartProps {
  statusContasPagar: StatusData[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0];
  const total = data.payload?.total || 0;
  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border/60 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 min-w-[160px]">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full ring-1 ring-white/10" style={{ background: data.payload.fill }} />
        <span className="font-semibold text-foreground">{data.name}</span>
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-border/40">
        <span className="text-muted-foreground">Quantidade</span>
        <span className="font-bold text-foreground tabular-nums">{data.value}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-bold text-foreground tabular-nums">{percentage}%</span>
      </div>
    </div>
  );
}

function CenterLabel({ viewBox, total }: any) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" className="fill-foreground text-2xl font-bold">{total}</tspan>
      <tspan x={cx} dy="20" className="fill-muted-foreground text-[10px]">total</tspan>
    </text>
  );
}

export function StatusContasPieChart({ statusContasPagar }: StatusContasPieChartProps) {
  const total = statusContasPagar.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div variants={itemVariants}>
      <Card className="h-[450px] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-warning" />
            </div>
            Status Contas a Pagar
          </CardTitle>
          <CardDescription>Distribuição por status</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusContasPagar}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {statusContasPagar.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <CenterLabel total={total} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => <span className="text-muted-foreground text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
