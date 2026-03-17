import { useMemo } from 'react';
import { AlertTriangle, Calculator, Calendar, Percent, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalculadoraJurosMultaProps {
  valorOriginal: number;
  dataVencimento: string;
  valorRecebido?: number;
  jurosMensal?: number; // default 1% ao mês
  multaPercentual?: number; // default 2%
}

export function CalculadoraJurosMulta({
  valorOriginal,
  dataVencimento,
  valorRecebido = 0,
  jurosMensal = 1,
  multaPercentual = 2,
}: CalculadoraJurosMultaProps) {
  const calculo = useMemo(() => {
    const hoje = new Date();
    const vencimento = parseISO(dataVencimento);
    const diasAtraso = differenceInDays(hoje, vencimento);

    if (diasAtraso <= 0) return null;

    const saldoDevedor = valorOriginal - valorRecebido;
    const multa = saldoDevedor * (multaPercentual / 100);
    const jurosDiario = jurosMensal / 30;
    const juros = saldoDevedor * (jurosDiario / 100) * diasAtraso;
    const totalCorrigido = saldoDevedor + multa + juros;

    return { diasAtraso, saldoDevedor, multa, juros, totalCorrigido, jurosDiario };
  }, [valorOriginal, dataVencimento, valorRecebido, jurosMensal, multaPercentual]);

  if (!calculo) return null;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span className="text-sm font-semibold text-warning">Título Vencido — {calculo.diasAtraso} dias de atraso</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="p-2 rounded bg-background">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Saldo Devedor</span>
          </div>
          <p className="font-bold text-sm">{formatCurrency(calculo.saldoDevedor)}</p>
        </div>
        <div className="p-2 rounded bg-background">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Percent className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Multa ({multaPercentual}%)</span>
          </div>
          <p className="font-bold text-sm text-destructive">{formatCurrency(calculo.multa)}</p>
        </div>
        <div className="p-2 rounded bg-background">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Juros ({jurosMensal}%/mês)</span>
          </div>
          <p className="font-bold text-sm text-destructive">{formatCurrency(calculo.juros)}</p>
        </div>
        <div className="p-2 rounded bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calculator className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-medium">Total Corrigido</span>
          </div>
          <p className="font-bold text-primary">{formatCurrency(calculo.totalCorrigido)}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cálculo: Juros de {calculo.jurosDiario.toFixed(4)}%/dia × {calculo.diasAtraso} dias + multa de {multaPercentual}% | Venc: {format(parseISO(dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
      </p>
    </div>
  );
}
