import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DollarSign, CheckCircle2, Target, Clock, Eye, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface KPIs {
  totalVencido?: number;
  totalRecuperado?: number;
  taxaRecuperacao?: number;
  qtdVencidas?: number;
  qtdRecuperadas?: number;
}

export function CobrancaKpis({ kpis, isLoading }: { kpis?: KPIs; isLoading: boolean }) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
              {isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : (
                <p className="text-xl font-bold font-display mt-1 text-destructive">
                  {formatCurrency(kpis?.totalVencido || 0)}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recuperado (30d)</p>
              {isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : (
                <p className="text-xl font-bold font-display mt-1 text-success">
                  {formatCurrency(kpis?.totalRecuperado || 0)}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa Recuperação</p>
              {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                <>
                  <p className="text-xl font-bold font-display mt-1">{kpis?.taxaRecuperacao || 0}%</p>
                  <Progress value={kpis?.taxaRecuperacao || 0} className="h-1.5 mt-2" />
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <Target className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Títulos Vencidos</p>
              {isLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
                <>
                  <p className="text-xl font-bold font-display mt-1">{kpis?.qtdVencidas || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Em aberto</p>
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recuperados (30d)</p>
              {isLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
                <>
                  <p className="text-xl font-bold font-display mt-1">{kpis?.qtdRecuperadas || 0}</p>
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Títulos pagos
                  </p>
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center transition-transform group-hover:scale-110">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
