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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${config.cor}20`,
                        color: config.cor,
                      }}
                    >
                      {cenarioIcons[cenario]}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{config.nome}</h3>
                      <p className="text-xs text-muted-foreground">{config.descricao}</p>
                    </div>
                  </div>
                  {isMelhor && (
                    <Badge variant="outline" className="text-success border-success/50 text-xs">
                      Melhor
                    </Badge>
                  )}
                  {isPior && metrica.diasCriticos > 0 && (
                    <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">
                      Atenção
                    </Badge>
                  )}
                </div>

                {/* Saldo Final */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Saldo Projetado</span>
                    <span className={cn(
                      "text-xs font-medium flex items-center gap-1",
                      variacao >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-display" style={{ color: config.cor }}>
                    {formatCurrency(metrica.saldoFinal)}
                  </p>
                </div>

                {/* Métricas adicionais */}
                <div className="space-y-3">
                  {/* Saldo Mínimo */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      Saldo Mínimo
                    </span>
                    <span className={cn(
                      "font-medium",
                      metrica.saldoMinimo < 0 ? "text-destructive" : 
                      metrica.saldoMinimo < 50000 ? "text-warning" : "text-foreground"
                    )}>
                      {formatCurrency(metrica.saldoMinimo)}
                    </span>
                  </div>

                  {/* Dias Críticos */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Dias Críticos
                    </span>
                    <span className={cn(
                      "font-medium",
                      metrica.diasCriticos > 5 ? "text-destructive" :
                      metrica.diasCriticos > 0 ? "text-warning" : "text-success"
                    )}>
                      {metrica.diasCriticos} dias
                    </span>
                  </div>

                  {/* Barra de Risco */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Nível de Risco</span>
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
                        "h-2",
                        metrica.diasCriticos > 5 ? "[&>div]:bg-destructive" :
                        metrica.diasCriticos > 2 ? "[&>div]:bg-warning" : "[&>div]:bg-success"
                      )}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {cenario === 'otimista' ? '+15% receitas' :
                     cenario === 'pessimista' ? '-20% receitas' : 'Base histórica'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
