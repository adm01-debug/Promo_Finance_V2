import { motion } from 'framer-motion';
import { BarChart3, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
} from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface CentroCustoData {
  nome: string;
  pagar: number;
  receber: number;
  saldo: number;
}

interface TopCentrosCustoChartProps {
  dadosPorCentroCusto: CentroCustoData[];
}

export function TopCentrosCustoChart({ dadosPorCentroCusto }: TopCentrosCustoChartProps) {
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
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
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
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="receber" name="A Receber" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} />
              <Bar dataKey="pagar" name="A Pagar" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
