import { motion } from 'framer-motion';
import { CreditCard, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];

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
      <Card className="h-[320px] sm:h-[360px] md:h-[400px] overflow-hidden">
        <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4 text-secondary" />
            </div>
            <span className="truncate">Saldo por Banco</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Distribuição entre contas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 sm:space-y-3 overflow-y-auto max-h-[200px] sm:max-h-[240px] md:max-h-[300px] p-3 sm:p-4 md:p-6 pt-0">
          {contasBancariasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma conta bancária</p>
            </div>
          ) : (
            <>
              {contasBancariasFiltradas.map((banco, index) => {
                const percentual = saldoTotal > 0 ? (banco.saldo_atual / saldoTotal) * 100 : 0;
                return (
                  <motion.div
                    key={banco.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0 ring-2 ring-background"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs sm:text-sm font-medium truncate group-hover:text-foreground transition-colors">
                          {banco.banco}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs sm:text-sm font-bold shrink-0 tabular-nums",
                        banco.saldo_atual >= 0 ? 'text-foreground' : 'text-destructive'
                      )}>
                        {formatCurrency(banco.saldo_atual)}
                      </span>
                    </div>
                    <Progress value={percentual} className="h-1.5 sm:h-2" />
                  </motion.div>
                );
              })}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Total Consolidado</span>
                  <span className="text-sm sm:text-base md:text-lg font-bold text-primary truncate tabular-nums">
                    {formatCurrency(saldoTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
