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
  cargaTributaria, cbsSaldo, ibsSaldo, creditosDisponiveis, creditosUtilizados,
  creditosAcumulados, percentualMigracao, aliquotaCbs, aliquotaIbs, alertasCriticos = 0,
}: Props) {
  const percentualCreditos = creditosAcumulados > 0 
    ? (creditosUtilizados / creditosAcumulados) * 100 
    : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Cards - 2 grandes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Carga Tributária - Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className={cn("relative overflow-hidden transition-all duration-300 hover:scale-[1.02]", colorClasses.primary.border, colorClasses.primary.bg, colorClasses.primary.glow)}>
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Carga Tributária Efetiva</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className={cn("text-3xl sm:text-4xl md:text-5xl font-bold", colorClasses.primary.text)}>
                  {cargaTributaria.toFixed(2)}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                Alíquota efetiva sobre faturamento
              </p>
              <div className="mt-2 sm:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2">
                  CBS: {aliquotaCbs}%
                </Badge>
                <Badge variant="secondary" className="text-[10px] sm:text-xs bg-success/10 text-success px-1.5 sm:px-2">
                  IBS: {aliquotaIbs}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Créditos Disponíveis - Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className={cn("relative overflow-hidden transition-all duration-300 hover:scale-[1.02]", colorClasses.green.border, colorClasses.green.bg, colorClasses.green.glow)}>
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Créditos Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className={cn("text-2xl sm:text-3xl md:text-4xl font-bold truncate", colorClasses.green.text)}>
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
        {/* CBS a Recolher */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className={cn("transition-all duration-200 hover:shadow-md hover:border-primary/30", colorClasses.blue.border)}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">CBS</CardTitle>
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn("text-base sm:text-xl md:text-2xl font-bold truncate", colorClasses.blue.text)}>
                {formatCurrency(cbsSaldo)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">A recolher</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* IBS a Recolher */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className={cn("transition-all duration-200 hover:shadow-md hover:border-success/30", colorClasses.emerald.border)}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">IBS</CardTitle>
              <Landmark className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn("text-base sm:text-xl md:text-2xl font-bold truncate", colorClasses.emerald.text)}>
                {formatCurrency(ibsSaldo)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">A recolher</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Migração */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card className={cn("transition-all duration-200 hover:shadow-md hover:border-warning/30", colorClasses.amber.border)}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Migração</CardTitle>
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn("text-base sm:text-xl md:text-2xl font-bold", colorClasses.amber.text)}>
                {percentualMigracao.toFixed(0)}%
              </div>
              <Progress value={percentualMigracao} className="h-1 sm:h-1.5 mt-1 sm:mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
          <Card className={cn("transition-all duration-200 hover:shadow-md", alertasCriticos > 0 ? `${colorClasses.red.border} animate-pulse` : colorClasses.green.border)}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Alertas</CardTitle>
              {alertasCriticos > 0 
                ? <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                : <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
              }
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn("text-base sm:text-xl md:text-2xl font-bold", alertasCriticos > 0 ? colorClasses.red.text : colorClasses.green.text)}>
                {alertasCriticos > 0 ? alertasCriticos : '✓'}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
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
