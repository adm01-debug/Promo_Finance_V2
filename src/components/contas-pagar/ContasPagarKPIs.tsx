import { motion } from 'framer-motion';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasPagarKPIsProps {
  totalPagar: number;
  totalPagoMes: number;
  totalVencido: number;
  venceHoje: number;
  countAprovacoesUrgentes: number;
  valorAprovacoesUrgentes: number;
  onAprovacaoClick: () => void;
}

const kpiConfig = [
  { key: 'totalPagar', label: 'Total a Pagar', icon: DollarSign, iconBg: 'bg-destructive/10', iconColor: 'text-destructive', isCurrency: true },
  { key: 'totalPagoMes', label: 'Pago no Mês', icon: CheckCircle2, iconBg: 'bg-success/10', iconColor: 'text-success', isCurrency: true },
  { key: 'totalVencido', label: 'Vencido', icon: AlertTriangle, iconBg: 'bg-destructive/10', iconColor: 'text-destructive', isCurrency: true, valueColor: 'text-destructive' },
  { key: 'venceHoje', label: 'Vence Hoje', icon: Calendar, iconBg: 'bg-warning/10', iconColor: 'text-warning', isCurrency: false, suffix: 'Contas' },
] as const;

export function ContasPagarKPIs({
  totalPagar,
  totalPagoMes,
  totalVencido,
  venceHoje,
  countAprovacoesUrgentes,
  valorAprovacoesUrgentes,
  onAprovacaoClick,
}: ContasPagarKPIsProps) {
  const values: Record<string, number> = { totalPagar, totalPagoMes, totalVencido, venceHoje };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {kpiConfig.map((kpi, index) => {
        const Icon = kpi.icon;
        const value = values[kpi.key];
        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{kpi.label}</p>
                    <p className={cn(
                      "text-lg sm:text-2xl font-bold font-display mt-1 truncate tabular-nums",
                      'valueColor' in kpi && kpi.valueColor
                    )}>
                      {kpi.isCurrency ? formatCurrency(value) : value}
                    </p>
                    {'suffix' in kpi && kpi.suffix && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.suffix}</p>
                    )}
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

      {/* Aprovações Urgentes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Card 
          className={cn(
            "stat-card group cursor-pointer transition-all duration-200 col-span-2 sm:col-span-1 hover:shadow-md hover:-translate-y-0.5",
            countAprovacoesUrgentes > 0 && "ring-2 ring-warning/40 shadow-[0_0_12px_hsl(var(--warning)/0.15)]"
          )} 
          onClick={onAprovacaoClick}
        >
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Aprovações Urgentes</p>
                <p className={cn(
                  "text-lg sm:text-2xl font-bold font-display mt-1",
                  countAprovacoesUrgentes > 0 ? "text-warning" : ""
                )}>{countAprovacoesUrgentes}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {countAprovacoesUrgentes > 0 ? formatCurrency(valorAprovacoesUrgentes) : 'Nenhuma pendente'}
                </p>
              </div>
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                countAprovacoesUrgentes > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
              )}>
                <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
