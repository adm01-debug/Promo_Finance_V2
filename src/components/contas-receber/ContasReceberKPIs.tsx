import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasReceberKPIsProps {
  totalReceber: number;
  totalRecebidoMes: number;
  totalVencido: number;
  taxaInadimplencia: number;
}

export function ContasReceberKPIs({
  totalReceber,
  totalRecebidoMes,
  totalVencido,
  taxaInadimplencia,
}: ContasReceberKPIsProps) {
  const kpis = [
    { label: 'Total a Receber', value: formatCurrency(totalReceber), icon: DollarSign, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Recebido no Mês', value: formatCurrency(totalRecebidoMes), icon: CheckCircle2, iconBg: 'bg-success/10', iconColor: 'text-success' },
    { label: 'Vencido', value: formatCurrency(totalVencido), icon: AlertTriangle, iconBg: 'bg-destructive/10', iconColor: 'text-destructive', valueColor: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{kpi.label}</p>
                    <p className={cn("text-lg sm:text-2xl font-bold font-display mt-1 truncate tabular-nums", kpi.valueColor)}>
                      {kpi.value}
                    </p>
                  </div>
                  <div className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                    kpi.iconBg, kpi.iconColor
                  )}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Inadimplência com Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Inadimplência</p>
                <p className={cn(
                  "text-lg sm:text-2xl font-bold font-display mt-1 tabular-nums",
                  taxaInadimplencia > 10 ? 'text-destructive' : taxaInadimplencia > 5 ? 'text-warning' : 'text-success'
                )}>
                  {taxaInadimplencia.toFixed(1)}%
                </p>
                <div className="mt-2">
                  <Progress value={taxaInadimplencia} className="h-1.5" />
                </div>
              </div>
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                taxaInadimplencia > 10 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              )}>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
