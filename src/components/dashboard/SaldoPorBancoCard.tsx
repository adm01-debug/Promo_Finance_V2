import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['hsl(150, 70%, 42%)', 'hsl(42, 95%, 48%)', 'hsl(0, 78%, 55%)', 'hsl(215, 90%, 52%)', 'hsl(275, 75%, 48%)'];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface SaldoPorBancoCardProps {
  contasBancariasFiltradas: Array<{
    id: string;
    banco: string;
    saldo_atual: number;
  }>;
  saldoTotal: number;
}

export function SaldoPorBancoCard({ contasBancariasFiltradas, saldoTotal }: SaldoPorBancoCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            Saldo por Banco
          </CardTitle>
          <CardDescription>Distribuição entre contas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto max-h-[300px]">
          {contasBancariasFiltradas.map((banco, index) => {
            const percentual = saldoTotal > 0 ? (banco.saldo_atual / saldoTotal) * 100 : 0;
            return (
              <div key={banco.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium truncate max-w-[120px]">{banco.banco}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(banco.saldo_atual)}</span>
                </div>
                <Progress value={percentual} className="h-2" />
              </div>
            );
          })}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Consolidado</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(saldoTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
