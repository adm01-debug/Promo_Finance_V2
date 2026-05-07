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
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
    >
      {kpiConfig.map((kpi, index) => {
        const Icon = kpi.icon;
        const value = values[kpi.key];
        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Card className="border-none bg-background/20 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] rounded-[1.5rem] overflow-hidden ring-1 ring-white/10 group transition-all duration-500 hover:ring-primary/40">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{kpi.label}</p>
                      <p className={cn(
                        "text-2xl sm:text-3xl font-black font-display tracking-tighter tabular-nums truncate",
                        'valueColor' in kpi && kpi.valueColor
                      )}>
                        {kpi.isCurrency ? formatCurrency(value) : value}
                      </p>
                    </div>
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 shrink-0",
                      kpi.iconBg, kpi.iconColor
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  {'suffix' in kpi && kpi.suffix && (
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{kpi.suffix} Volume</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Aprovações Urgentes Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Card 
          className={cn(
            "border-none bg-background/20 backdrop-blur-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] rounded-[1.5rem] overflow-hidden transition-all duration-500 cursor-pointer group",
            countAprovacoesUrgentes > 0 ? "ring-2 ring-warning/40 shadow-warning/10" : "ring-1 ring-white/10"
          )} 
          onClick={onAprovacaoClick}
        >
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-warning/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warning/70">Governance Priority</p>
                  <p className={cn(
                    "text-3xl font-black font-display tracking-tighter",
                    countAprovacoesUrgentes > 0 ? "text-warning animate-pulse" : ""
                  )}>{countAprovacoesUrgentes}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-12 shrink-0",
                  countAprovacoesUrgentes > 0 ? "bg-warning/20 text-warning" : "bg-white/5 text-muted-foreground/40"
                )}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">
                {countAprovacoesUrgentes > 0 ? `Risk: ${formatCurrency(valorAprovacoesUrgentes)}` : 'Stable State'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
