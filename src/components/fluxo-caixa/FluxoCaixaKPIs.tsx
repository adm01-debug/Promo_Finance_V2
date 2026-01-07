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
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
              {loadingKpis ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-xl font-bold font-display mt-1">{formatCurrency(saldoAtual)}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entradas ({cenarioAtivo})</p>
              {loadingFluxo ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-xl font-bold font-display mt-1 text-success">{formatCurrency(totalReceitas)}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saídas ({cenarioAtivo})</p>
              {loadingFluxo ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-xl font-bold font-display mt-1 text-destructive">{formatCurrency(totalDespesas)}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
              {loadingFluxo ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <>
                  <p className="text-xl font-bold font-display mt-1">{formatCurrency(saldoFinal)}</p>
                  <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", variacao >= 0 ? "text-success" : "text-destructive")}>
                    {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatCurrency(variacao)}
                  </div>
                </>
              )}
            </div>
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              variacao >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {variacao >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("stat-card group", diasCriticos > 0 && "border-warning")}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dias Críticos</p>
              {loadingFluxo ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <>
                  <p className="text-xl font-bold font-display mt-1">{diasCriticos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Saldo &lt; R$ 100k</p>
                </>
              )}
            </div>
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              diasCriticos > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
            )}>
              {diasCriticos > 0 ? <AlertTriangle className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
