import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
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
      <Card className="h-[450px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top Centros de Custo
          </CardTitle>
          <CardDescription>Por volume financeiro</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosPorCentroCusto.slice(0, 5)} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} fontSize={11} />
              <YAxis type="category" dataKey="nome" width={100} fontSize={11} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="receber" name="A Receber" fill="hsl(150, 70%, 42%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pagar" name="A Pagar" fill="hsl(0, 78%, 55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
