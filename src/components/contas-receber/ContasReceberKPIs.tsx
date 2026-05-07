import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, AlertTriangle, TrendingUp, Clock, CalendarClock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasReceberKPIsProps {
  totalReceber: number;
  totalRecebidoMes: number;
  totalVencido: number;
  taxaInadimplencia: number;
  venceHoje?: number;
  venceSemana?: number;
  totalReceberAnterior?: number;
  totalRecebidoMesAnterior?: number;
  totalVencidoAnterior?: number;
  onKpiClick?: (filter: string) => void;
}

function calcVariation(current: number, previous: number): { text: string; positive: boolean } | null {
  if (!previous || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export function ContasReceberKPIs({
  totalReceber,
  totalRecebidoMes,
  totalVencido,
  taxaInadimplencia,
  venceHoje = 0,
  venceSemana = 0,
  totalReceberAnterior,
  totalRecebidoMesAnterior,
  totalVencidoAnterior,
  onKpiClick,
}: ContasReceberKPIsProps) {
  const varReceber = useMemo(() => calcVariation(totalReceber, totalReceberAnterior || 0), [totalReceber, totalReceberAnterior]);
  const varRecebido = useMemo(() => calcVariation(totalRecebidoMes, totalRecebidoMesAnterior || 0), [totalRecebidoMes, totalRecebidoMesAnterior]);
  const varVencido = useMemo(() => calcVariation(totalVencido, totalVencidoAnterior || 0), [totalVencido, totalVencidoAnterior]);

  const kpis = [
    {
      label: 'Total a Receber', value: formatCurrency(totalReceber), icon: DollarSign,
      iconBg: 'bg-primary/10', iconColor: 'text-primary', filter: 'all', variation: varReceber,
    },
    {
      label: 'Recebido no Mês', value: formatCurrency(totalRecebidoMes), icon: CheckCircle2,
      iconBg: 'bg-success/10', iconColor: 'text-success', filter: 'pago', variation: varRecebido,
    },
    {
      label: 'Vencido', value: formatCurrency(totalVencido), icon: AlertTriangle,
      iconBg: 'bg-destructive/10', iconColor: 'text-destructive', valueColor: 'text-destructive',
      filter: 'vencido', variation: varVencido,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            >
              <Card
                className={cn(
                  "border-none bg-white/[0.03] backdrop-blur-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden ring-1 ring-white/10 group transition-all duration-700",
                  onKpiClick && "cursor-pointer hover:ring-primary/40 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                )}
                onClick={() => onKpiClick?.(kpi.filter)}
              >
                <CardContent className="p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{kpi.label}</p>
                        <p className={cn("text-3xl sm:text-4xl font-black font-display tracking-tighter tabular-nums drop-shadow-2xl", kpi.valueColor)}>
                          {kpi.value}
                        </p>
                      </div>
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-6",
                        kpi.iconBg, kpi.iconColor
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {kpi.variation && (
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight w-fit transition-all duration-500",
                        kpi.label === 'Vencido'
                          ? (kpi.variation.positive ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')
                          : (kpi.variation.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')
                      )}>
                        {kpi.variation.positive
                          ? <ArrowUpRight className="h-3 w-3" />
                          : <ArrowDownRight className="h-3 w-3" />
                        }
                        <span>{kpi.variation.text}</span>
                        <span className="opacity-40">vs prev</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Inadimplência with Neon Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 24 }}
        >
          <Card className="border-none bg-white/[0.03] backdrop-blur-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden ring-1 ring-white/10 group transition-all duration-700 hover:ring-primary/40">
            <CardContent className="p-6 relative">
              <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Risk Score</p>
                    <p className={cn(
                      "text-2xl sm:text-3xl font-black font-display tracking-tighter tabular-nums",
                      taxaInadimplencia > 10 ? 'text-destructive' : taxaInadimplencia > 5 ? 'text-warning' : 'text-success'
                    )}>
                      {taxaInadimplencia.toFixed(1)}%
                    </p>
                  </div>
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110",
                    taxaInadimplencia > 10 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  )}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${taxaInadimplencia}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn(
                        "h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]",
                        taxaInadimplencia > 10 ? "bg-destructive" : taxaInadimplencia > 5 ? "bg-warning" : "bg-success"
                      )} 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Global Default Rate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Urgency Alert System */}
      {(venceHoje > 0 || venceSemana > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {venceHoje > 0 && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Card
                className={cn(
                  "border-none bg-warning/10 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden ring-1 ring-warning/20 group transition-all",
                  onKpiClick && "cursor-pointer hover:ring-warning/40"
                )}
                onClick={() => onKpiClick?.('vence_hoje')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center shadow-inner">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warning/70">Vence Hoje</p>
                      <p className="text-xl font-black tabular-nums text-foreground tracking-tight">
                        {venceHoje} {venceHoje === 1 ? 'título prioritário' : 'títulos prioritários'}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-warning/40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </CardContent>
              </Card>
            </motion.div>
          )}
          {venceSemana > 0 && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Card
                className={cn(
                  "border-none bg-primary/10 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden ring-1 ring-primary/20 group transition-all",
                  onKpiClick && "cursor-pointer hover:ring-primary/40"
                )}
                onClick={() => onKpiClick?.('vence_semana')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner">
                      <CalendarClock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Vencimento Semanal</p>
                      <p className="text-xl font-black tabular-nums text-foreground tracking-tight">
                        {venceSemana} {venceSemana === 1 ? 'pendência estratégica' : 'pendências estratégicas'}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-primary/40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
