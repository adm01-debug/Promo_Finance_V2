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
      <Card className="h-[320px] sm:h-[360px] md:h-[400px]">
        <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
            <span className="truncate">Saldo por Banco</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Distribuição entre contas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[200px] sm:max-h-[240px] md:max-h-[300px] p-3 sm:p-4 md:p-6 pt-0">
          {contasBancariasFiltradas.map((banco, index) => {
            const percentual = saldoTotal > 0 ? (banco.saldo_atual / saldoTotal) * 100 : 0;
            return (
              <div key={banco.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs sm:text-sm font-medium truncate">{banco.banco}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold shrink-0">{formatCurrency(banco.saldo_atual)}</span>
                </div>
                <Progress value={percentual} className="h-1.5 sm:h-2" />
              </div>
            );
          })}
          <div className="pt-2 sm:pt-3 border-t">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium">Total</span>
              <span className="text-sm sm:text-base md:text-lg font-bold text-primary truncate">{formatCurrency(saldoTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
