// ============================================
// KPI COM COMPARATIVO TEMPORAL
// Badge com ↑↓% vs período anterior
// ============================================

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  valorAtual: number;
  valorAnterior: number;
  invertido?: boolean; // true = queda é positiva (ex: carga tributária)
  className?: string;
}

export function KPIComparativo({ valorAtual, valorAnterior, invertido = false, className }: Props) {
  if (!valorAnterior || valorAnterior === 0) return null;

  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
  const absVariacao = Math.abs(variacao);

  if (absVariacao < 0.5) {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground', className)}>
        <Minus className="h-3 w-3" />
        <span>Estável</span>
      </span>
    );
  }

  const isPositive = invertido ? variacao < 0 : variacao > 0;

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium',
      isPositive ? 'text-success' : 'text-destructive',
      className
    )}>
      {variacao > 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{absVariacao.toFixed(1)}%</span>
    </span>
  );
}

export default KPIComparativo;
