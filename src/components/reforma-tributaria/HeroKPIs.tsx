// HERO KPIs - REFORMA TRIBUTÁRIA
// Cards de métricas com hierarquia visual forte

import { motion } from 'framer-motion';
import {
  Percent,
  Receipt,
  Landmark,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/motion/StatCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface Props {
  cargaTributaria: number;
  cbsSaldo: number;
  ibsSaldo: number;
  creditosDisponiveis: number;
  creditosUtilizados: number;
  creditosAcumulados: number;
  percentualMigracao: number;
  aliquotaCbs: number;
  aliquotaIbs: number;
  alertasCriticos?: number;
  onKPIClick?: (tabId: string) => void;
}

const colorClasses = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
  },
  blue: {
    text: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
  },
  emerald: {
    text: 'text-success',
    bg: 'bg-success/5',
    border: 'border-success/20',
    glow: 'shadow-[0_0_30px_hsl(var(--success)/0.15)]',
  },
  amber: {
    text: 'text-warning',
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    glow: 'shadow-[0_0_30px_hsl(var(--warning)/0.15)]',
  },
  green: {
    text: 'text-success',
    bg: 'bg-success/5',
    border: 'border-success/20',
    glow: 'shadow-[0_0_30px_hsl(var(--success)/0.15)]',
  },
  red: {
    text: 'text-destructive',
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    glow: 'shadow-[0_0_30px_hsl(var(--destructive)/0.15)]',
  },
};

export function HeroKPIs({
  cargaTributaria,
  cbsSaldo,
  ibsSaldo,
  creditosDisponiveis,
  creditosUtilizados,
  creditosAcumulados,
  percentualMigracao,
  aliquotaCbs,
  aliquotaIbs,
  alertasCriticos = 0,
  onKPIClick,
}: Props) {
  const percentualCreditos =
    creditosAcumulados > 0 ? (creditosUtilizados / creditosAcumulados) * 100 : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Cards - 2 grandes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Carga Tributária - Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer',
              colorClasses.primary.border,
              colorClasses.primary.bg,
              colorClasses.primary.glow
            )}
            onClick={() => onKPIClick?.('metricas')}
          >
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Carga Tributária Efetiva</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span
                  className={cn(
                    'text-3xl sm:text-4xl md:text-5xl font-bold',
                    colorClasses.primary.text
                  )}
                >
                  {cargaTributaria.toFixed(2)}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                Alíquota efetiva sobre faturamento
              </p>
              <div className="mt-2 sm:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2"
                >
                  CBS: {aliquotaCbs}%
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs bg-success/10 text-success px-1.5 sm:px-2"
                >
                  IBS: {aliquotaIbs}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Créditos Disponíveis - Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer',
              colorClasses.green.border,
              colorClasses.green.bg,
              colorClasses.green.glow
            )}
            onClick={() => onKPIClick?.('creditos')}
          >
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Créditos Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div
                className={cn(
                  'text-2xl sm:text-3xl md:text-4xl font-bold truncate',
                  colorClasses.green.text
                )}
              >
                {formatCurrency(creditosDisponiveis)}
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
                  <span>Utilização</span>
                  <span>{percentualCreditos.toFixed(1)}%</span>
                </div>
                <Progress value={percentualCreditos} className="h-1.5 sm:h-2" />
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 truncate hidden sm:block">
                De {formatCurrency(creditosAcumulados)} acumulados
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            label="CBS"
            value={formatCurrency(cbsSaldo)}
            sub="A recolher"
            icon={<Receipt className="h-5 w-5" />}
            iconColor="var(--acc)"
            iconBg="var(--acc-soft)"
            onClick={() => onKPIClick?.('apuracao')}
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <StatCard
            label="IBS"
            value={formatCurrency(ibsSaldo)}
            sub="A recolher"
            icon={<Landmark className="h-5 w-5" />}
            iconColor="var(--ok)"
            iconBg="var(--ok-soft)"
            onClick={() => onKPIClick?.('apuracao')}
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatCard
            label="Migração"
            value={`${percentualMigracao.toFixed(0)}%`}
            icon={<Zap className="h-5 w-5" />}
            iconColor="var(--warn)"
            iconBg="var(--warn-soft)"
            onClick={() => onKPIClick?.('cronograma')}
            sparkline={<Progress value={percentualMigracao} className="h-1.5 w-full" />}
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <StatCard
            label="Alertas"
            value={alertasCriticos > 0 ? alertasCriticos : '✓'}
            sub={alertasCriticos > 0 ? 'Críticos' : 'Em dia'}
            icon={
              alertasCriticos > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )
            }
            iconColor={alertasCriticos > 0 ? 'var(--bad)' : 'var(--ok)'}
            iconBg={alertasCriticos > 0 ? 'var(--bad-soft)' : 'var(--ok-soft)'}
            valueClassName={alertasCriticos > 0 ? 'text-bad' : 'text-ok'}
            onClick={() => onKPIClick?.('alertas')}
            className={cn('h-full', alertasCriticos > 0 && 'animate-pulse border-bad/40')}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default HeroKPIs;
