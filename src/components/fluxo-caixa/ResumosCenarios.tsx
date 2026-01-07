import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Wallet,
  AlertTriangle,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { CenarioTipo, CENARIOS_CONFIG } from '@/lib/cashflow-scenarios';

interface MetricaCenario {
  saldoFinal: number;
  saldoMinimo: number;
  diasCriticos: number;
}

interface ResumosCenariosProps {
  metricas: Record<CenarioTipo, MetricaCenario>;
  saldoAtual: number;
  cenarioAtivo: CenarioTipo;
  onCenarioClick?: (cenario: CenarioTipo) => void;
}

const cenarioIcons: Record<CenarioTipo, React.ReactNode> = {
  otimista: <TrendingUp className="h-5 w-5" />,
  realista: <Minus className="h-5 w-5" />,
  pessimista: <TrendingDown className="h-5 w-5" />,
};

export function ResumosCenarios({ metricas, saldoAtual, cenarioAtivo, onCenarioClick }: ResumosCenariosProps) {
  // Calcular variações
  const calcularVariacao = (saldoFinal: number) => {
    if (saldoAtual === 0) return 0;
    return ((saldoFinal - saldoAtual) / saldoAtual) * 100;
  };

  // Encontrar melhor e pior cenário
  const saldosFinais = Object.entries(metricas).map(([c, m]) => ({ cenario: c as CenarioTipo, saldo: m.saldoFinal }));
  const melhorCenario = saldosFinais.reduce((a, b) => a.saldo > b.saldo ? a : b).cenario;
  const piorCenario = saldosFinais.reduce((a, b) => a.saldo < b.saldo ? a : b).cenario;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {(Object.keys(CENARIOS_CONFIG) as CenarioTipo[]).map((cenario, index) => {
        const config = CENARIOS_CONFIG[cenario];
        const metrica = metricas[cenario];
        const variacao = calcularVariacao(metrica.saldoFinal);
        const isAtivo = cenarioAtivo === cenario;
        const isMelhor = cenario === melhorCenario;
        const isPior = cenario === piorCenario;

        return (
          <motion.div
            key={cenario}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                "stat-card group cursor-pointer transition-all",
                isAtivo && "ring-2 ring-primary shadow-lg",
                isMelhor && "border-success/50",
                isPior && metrica.diasCriticos > 0 && "border-destructive/50"
              )}
              onClick={() => onCenarioClick?.(cenario)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div 
                      className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0"
                      style={{ 
                        backgroundColor: `${config.cor}20`,
                        color: config.cor,
                      }}
                    >
                      <span className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                        {cenarioIcons[cenario]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-sm sm:text-base truncate">{config.nome}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{config.descricao}</p>
                    </div>
                  </div>
                  {isMelhor && (
                    <Badge variant="outline" className="text-success border-success/50 text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5 shrink-0">
                      Melhor
                    </Badge>
                  )}
                  {isPior && metrica.diasCriticos > 0 && (
                    <Badge variant="outline" className="text-destructive border-destructive/50 text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5 shrink-0">
                      Atenção
                    </Badge>
                  )}
                </div>

                {/* Saldo Final */}
                <div className="mb-2 sm:mb-3 lg:mb-4">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Saldo Projetado</span>
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1",
                      variacao >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {variacao >= 0 ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                      {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold font-display truncate" style={{ color: config.cor }}>
                    {formatCurrency(metrica.saldoFinal)}
                  </p>
                </div>

                {/* Métricas adicionais */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Saldo Mínimo */}
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Saldo Mínimo</span>
                      <span className="sm:hidden">Mínimo</span>
                    </span>
                    <span className={cn(
                      "font-medium truncate ml-1",
                      metrica.saldoMinimo < 0 ? "text-destructive" : 
                      metrica.saldoMinimo < 50000 ? "text-warning" : "text-foreground"
                    )}>
                      {formatCurrency(metrica.saldoMinimo)}
                    </span>
                  </div>

                  {/* Dias Críticos */}
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Dias Críticos</span>
                      <span className="sm:hidden">Críticos</span>
                    </span>
                    <span className={cn(
                      "font-medium",
                      metrica.diasCriticos > 5 ? "text-destructive" :
                      metrica.diasCriticos > 0 ? "text-warning" : "text-success"
                    )}>
                      {metrica.diasCriticos}d
                    </span>
                  </div>

                  {/* Barra de Risco */}
                  <div className="pt-1 sm:pt-2">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                      <span className="text-muted-foreground">Risco</span>
                      <span className={cn(
                        "font-medium",
                        metrica.diasCriticos > 5 ? "text-destructive" :
                        metrica.diasCriticos > 2 ? "text-warning" : "text-success"
                      )}>
                        {metrica.diasCriticos > 5 ? "Alto" :
                         metrica.diasCriticos > 2 ? "Médio" : "Baixo"}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metrica.diasCriticos / 10) * 100)} 
                      className={cn(
                        "h-1.5 sm:h-2",
                        metrica.diasCriticos > 5 ? "[&>div]:bg-destructive" :
                        metrica.diasCriticos > 2 ? "[&>div]:bg-warning" : "[&>div]:bg-success"
                      )}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {cenario === 'otimista' ? '+15%' :
                     cenario === 'pessimista' ? '-20%' : 'Base'}
                  </span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
