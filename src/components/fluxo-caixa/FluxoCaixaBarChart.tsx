import { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Bar,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend,
} from 'recharts';

interface BarDataItem {
  data: string;
  receitas: number;
  despesas: number;
  liquido: number;
  saldo: number;
}

interface FluxoCaixaBarChartProps {
  barData: BarDataItem[];
  cenarioAtivo: string;
  isLoading: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export const FluxoCaixaBarChart = memo(function FluxoCaixaBarChart({
  barData,
  cenarioAtivo,
  isLoading,
}: FluxoCaixaBarChartProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Entradas vs Saídas - Cenário {cenarioAtivo.charAt(0).toUpperCase() + cenarioAtivo.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                />
                <YAxis 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                />
                <Tooltip 
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(150, 70%, 32%)" name="Receitas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0, 78%, 45%)" name="Despesas" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="liquido" stroke="hsl(24, 95%, 46%)" strokeWidth={2} name="Líquido" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
