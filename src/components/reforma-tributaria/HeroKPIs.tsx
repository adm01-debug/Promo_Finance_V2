// ============================================
// HERO KPIs - REFORMA TRIBUTÁRIA
// Cards de métricas com hierarquia visual forte
// ============================================

import { motion } from 'framer-motion';
import { 
  Percent, Receipt, Landmark, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface HeroMetric {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color: 'primary' | 'blue' | 'emerald' | 'amber' | 'green' | 'red';
  trend?: {
    value: number;
    direction: 'up' | 'down';
    isGood?: boolean;
  };
  progress?: number;
  badge?: string;
  size?: 'hero' | 'normal';
}

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
}

const colorClasses = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    glow: 'shadow-[0_0_30px_hsl(210_100%_50%/0.15)]',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    glow: 'shadow-[0_0_30px_hsl(150_70%_40%/0.15)]',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    glow: 'shadow-[0_0_30px_hsl(45_100%_50%/0.15)]',
  },
  green: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    glow: 'shadow-[0_0_30px_hsl(140_70%_40%/0.15)]',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    glow: 'shadow-[0_0_30px_hsl(0_70%_50%/0.15)]',
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
}: Props) {
  const percentualCreditos = creditosAcumulados > 0 
    ? (creditosUtilizados / creditosAcumulados) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Hero Cards - 2 grandes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Carga Tributária - Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
            colorClasses.primary.border,
            colorClasses.primary.bg,
            colorClasses.primary.glow
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Carga Tributária Efetiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl font-bold", colorClasses.primary.text)}>
                  {cargaTributaria.toFixed(2)}
                </span>
                <span className="text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Alíquota efetiva sobre faturamento
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  CBS: {aliquotaCbs}%
                </Badge>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
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
          <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
            colorClasses.green.border,
            colorClasses.green.bg,
            colorClasses.green.glow
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Créditos Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-4xl font-bold", colorClasses.green.text)}>
                {formatCurrency(creditosDisponiveis)}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Utilização</span>
                  <span>{percentualCreditos.toFixed(1)}%</span>
                </div>
                <Progress value={percentualCreditos} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                De {formatCurrency(creditosAcumulados)} acumulados
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* CBS a Recolher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className={cn(
            "transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
            colorClasses.blue.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CBS</CardTitle>
              <Receipt className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", colorClasses.blue.text)}>
                {formatCurrency(cbsSaldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">A recolher</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* IBS a Recolher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card className={cn(
            "transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700",
            colorClasses.emerald.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">IBS</CardTitle>
              <Landmark className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", colorClasses.emerald.text)}>
                {formatCurrency(ibsSaldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">A recolher</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Migração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className={cn(
            "transition-all duration-200 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700",
            colorClasses.amber.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Migração</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", colorClasses.amber.text)}>
                {percentualMigracao.toFixed(0)}%
              </div>
              <Progress value={percentualMigracao} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className={cn(
            "transition-all duration-200 hover:shadow-md",
            alertasCriticos > 0 
              ? `${colorClasses.red.border} animate-pulse` 
              : colorClasses.green.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
              {alertasCriticos > 0 
                ? <AlertTriangle className="h-4 w-4 text-red-500" />
                : <CheckCircle className="h-4 w-4 text-green-500" />
              }
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                alertasCriticos > 0 ? colorClasses.red.text : colorClasses.green.text
              )}>
                {alertasCriticos > 0 ? alertasCriticos : '✓'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {alertasCriticos > 0 ? 'Críticos' : 'Em dia'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default HeroKPIs;
