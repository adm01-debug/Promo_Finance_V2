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
    <div className="space-y-3">
      {/* Main KPIs */}
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
              <Card
                className={cn(
                  "stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full",
                  onKpiClick && "cursor-pointer"
                )}
                onClick={() => onKpiClick?.(kpi.filter)}
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{kpi.label}</p>
                      <p className={cn("text-lg sm:text-2xl font-bold font-display mt-1 truncate tabular-nums", kpi.valueColor)}>
                        {kpi.value}
                      </p>
                      {kpi.variation && (
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs font-medium",
                          kpi.label === 'Vencido'
                            ? (kpi.variation.positive ? 'text-destructive' : 'text-success')
                            : (kpi.variation.positive ? 'text-success' : 'text-destructive')
                        )}>
                          {kpi.variation.positive
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />
                          }
                          <span>{kpi.variation.text} vs mês anterior</span>
                        </div>
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

      {/* Urgency Badges - Vence Hoje / Vence Semana (#5, #34) */}
      {(venceHoje > 0 || venceSemana > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3"
        >
          {venceHoje > 0 && (
            <Card
              className={cn(
                "flex-1 min-w-[200px] border-warning/30 bg-warning/5 hover:shadow-md transition-all",
                onKpiClick && "cursor-pointer"
              )}
              onClick={() => onKpiClick?.('vence_hoje')}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs font-medium text-warning">Vence Hoje</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    {venceHoje} {venceHoje === 1 ? 'título' : 'títulos'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {venceSemana > 0 && (
            <Card
              className={cn(
                "flex-1 min-w-[200px] border-primary/30 bg-primary/5 hover:shadow-md transition-all",
                onKpiClick && "cursor-pointer"
              )}
              onClick={() => onKpiClick?.('vence_semana')}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarClock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary">Vence esta Semana</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    {venceSemana} {venceSemana === 1 ? 'título' : 'títulos'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
