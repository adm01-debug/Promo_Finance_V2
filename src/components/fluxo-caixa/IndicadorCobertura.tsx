import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface IndicadorCoberturaProps {
  saldoAtual: number;
  despesaMediaDiaria: number;
  isLoading?: boolean;
}

export function IndicadorCobertura({ 
  saldoAtual, 
  despesaMediaDiaria, 
  isLoading = false 
}: IndicadorCoberturaProps) {
  // Calcular dias de cobertura
  const diasCobertura = despesaMediaDiaria > 0 
    ? Math.floor(saldoAtual / despesaMediaDiaria)
    : 0;

  // Definir níveis de saúde (30 dias = ótimo, 15 dias = bom, 7 dias = alerta, <7 = crítico)
  const getNivelSaude = () => {
    if (diasCobertura >= 30) return { nivel: 'otimo', cor: 'text-success', bgCor: 'bg-success/10', label: 'Ótimo', progresso: 100 };
    if (diasCobertura >= 15) return { nivel: 'bom', cor: 'text-primary', bgCor: 'bg-primary/10', label: 'Bom', progresso: 75 };
    if (diasCobertura >= 7) return { nivel: 'alerta', cor: 'text-warning', bgCor: 'bg-warning/10', label: 'Atenção', progresso: 50 };
    return { nivel: 'critico', cor: 'text-destructive', bgCor: 'bg-destructive/10', label: 'Crítico', progresso: 25 };
  };

  const saude = getNivelSaude();

  // Calcular quanto falta para 30 dias de cobertura
  const metaCobertura = 30;
  const saldoNecessario = despesaMediaDiaria * metaCobertura;
  const faltaParaMeta = Math.max(0, saldoNecessario - saldoAtual);

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="animate-pulse space-y-2 sm:space-y-3">
            <div className="h-4 w-28 sm:w-32 bg-muted rounded" />
            <div className="h-8 sm:h-10 w-16 sm:w-20 bg-muted rounded" />
            <div className="h-1.5 sm:h-2 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("card-elevated overflow-hidden", saude.nivel === 'critico' && "border-destructive")}>
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Cobertura de Caixa</span>
              </p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <span className={cn("text-2xl sm:text-3xl font-bold font-display", saude.cor)}>
                  {diasCobertura}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">dias</span>
              </div>
            </div>
            <div className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ml-2",
              saude.bgCor
            )}>
              {saude.nivel === 'critico' ? (
                <AlertTriangle className={cn("h-5 w-5 sm:h-6 sm:w-6", saude.cor)} />
              ) : (
                <Calendar className={cn("h-5 w-5 sm:h-6 sm:w-6", saude.cor)} />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <span className={cn("font-medium", saude.cor)}>{saude.label}</span>
              <span className="text-muted-foreground">Meta: {metaCobertura}d</span>
            </div>
            <Progress 
              value={Math.min((diasCobertura / metaCobertura) * 100, 100)} 
              className="h-1.5 sm:h-2"
            />
          </div>

          {/* Detalhes */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-border/50 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                <span className="hidden sm:inline">Despesa Média/Dia</span>
                <span className="sm:hidden">Média/Dia</span>
              </p>
              <p className="text-xs sm:text-sm font-semibold font-display text-destructive truncate">
                {formatCurrency(despesaMediaDiaria)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Saldo Atual</p>
              <p className="text-xs sm:text-sm font-semibold font-display truncate">
                {formatCurrency(saldoAtual)}
              </p>
            </div>
          </div>

          {/* Sugestão se cobertura baixa */}
          {faltaParaMeta > 0 && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg bg-muted/50 text-[10px] sm:text-xs">
              <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 mt-0.5 sm:mt-0" />
                <span className="line-clamp-2 sm:line-clamp-1">
                  <span className="hidden sm:inline">Para {metaCobertura} dias de cobertura, precisa de mais </span>
                  <span className="sm:hidden">Falta </span>
                  <strong className="text-foreground">{formatCurrency(faltaParaMeta)}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
