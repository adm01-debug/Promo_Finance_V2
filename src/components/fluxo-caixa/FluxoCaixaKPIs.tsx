import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface FluxoCaixaKPIsProps {
  saldoAtual: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoFinal: number;
  variacao: number;
  diasCriticos: number;
  cenarioAtivo: string;
  loadingKpis: boolean;
  loadingFluxo: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export const FluxoCaixaKPIs = memo(function FluxoCaixaKPIs({
  saldoAtual,
  totalReceitas,
  totalDespesas,
  saldoFinal,
  variacao,
  diasCriticos,
  cenarioAtivo,
  loadingKpis,
  loadingFluxo,
}: FluxoCaixaKPIsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
      <Card className="stat-card group col-span-2 sm:col-span-1">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Saldo Atual</p>
              {loadingKpis ? (
                <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 mt-1" />
              ) : (
                <p className="text-base sm:text-lg lg:text-xl font-bold font-display mt-1 truncate">{formatCurrency(saldoAtual)}</p>
              )}
            </div>
            <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ml-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                <span className="hidden sm:inline">Entradas ({cenarioAtivo})</span>
                <span className="sm:hidden">Entradas</span>
              </p>
              {loadingFluxo ? (
                <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 mt-1" />
              ) : (
                <p className="text-base sm:text-lg lg:text-xl font-bold font-display mt-1 text-success truncate">{formatCurrency(totalReceitas)}</p>
              )}
            </div>
            <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ml-2">
              <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                <span className="hidden sm:inline">Saídas ({cenarioAtivo})</span>
                <span className="sm:hidden">Saídas</span>
              </p>
              {loadingFluxo ? (
                <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 mt-1" />
              ) : (
                <p className="text-base sm:text-lg lg:text-xl font-bold font-display mt-1 text-destructive truncate">{formatCurrency(totalDespesas)}</p>
              )}
            </div>
            <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ml-2">
              <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Saldo Projetado</p>
              {loadingFluxo ? (
                <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 mt-1" />
              ) : (
                <>
                  <p className="text-base sm:text-lg lg:text-xl font-bold font-display mt-1 truncate">{formatCurrency(saldoFinal)}</p>
                  <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs font-medium mt-1", variacao >= 0 ? "text-success" : "text-destructive")}>
                    {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="truncate">{formatCurrency(variacao)}</span>
                  </div>
                </>
              )}
            </div>
            <div className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ml-2",
              variacao >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {variacao >= 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("stat-card group", diasCriticos > 0 && "border-warning")}>
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Dias Críticos</p>
              {loadingFluxo ? (
                <Skeleton className="h-5 sm:h-7 w-10 sm:w-12 mt-1" />
              ) : (
                <>
                  <p className="text-base sm:text-lg lg:text-xl font-bold font-display mt-1">{diasCriticos}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                    <span className="hidden sm:inline">Saldo &lt; R$ 100k</span>
                    <span className="sm:hidden">&lt; 100k</span>
                  </p>
                </>
              )}
            </div>
            <div className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ml-2",
              diasCriticos > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
            )}>
              {diasCriticos > 0 ? <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" /> : <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
