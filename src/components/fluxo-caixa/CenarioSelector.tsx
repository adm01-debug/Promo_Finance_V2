import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CenarioTipo, CENARIOS_CONFIG } from '@/lib/cashflow-scenarios';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CenarioSelectorProps {
  cenarioAtivo: CenarioTipo;
  onCenarioChange: (cenario: CenarioTipo) => void;
  metricas?: Record<CenarioTipo, { saldoFinal: number; saldoMinimo: number; diasCriticos: number }>;
}

const cenarioIcons: Record<CenarioTipo, React.ReactNode> = {
  otimista: <TrendingUp className="h-4 w-4" />,
  realista: <Minus className="h-4 w-4" />,
  pessimista: <TrendingDown className="h-4 w-4" />,
};

export function CenarioSelector({ cenarioAtivo, onCenarioChange, metricas }: CenarioSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {(Object.keys(CENARIOS_CONFIG) as CenarioTipo[]).map((cenario) => {
        const config = CENARIOS_CONFIG[cenario];
        const isAtivo = cenarioAtivo === cenario;
        
        return (
          <Tooltip key={cenario}>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCenarioChange(cenario)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                  isAtivo
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span
                  className="flex items-center justify-center"
                  style={{ color: isAtivo ? config.cor : undefined }}
                >
                  {cenarioIcons[cenario]}
                </span>
                <span className="text-sm font-medium">{config.nome}</span>
                {metricas && metricas[cenario]?.diasCriticos > 0 && (
                  <span className={cn(
                    "h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center",
                    cenario === 'pessimista' ? "bg-destructive text-destructive-foreground" :
                    cenario === 'realista' ? "bg-warning text-warning-foreground" :
                    "bg-success/20 text-success"
                  )}>
                    {metricas[cenario].diasCriticos}
                  </span>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">{config.nome}</p>
              <p className="text-xs text-muted-foreground">{config.descricao}</p>
              {cenario === 'otimista' && (
                <p className="text-xs text-success mt-1">+15% receitas, -5% despesas</p>
              )}
              {cenario === 'pessimista' && (
                <p className="text-xs text-destructive mt-1">-20% receitas, +10% despesas</p>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
