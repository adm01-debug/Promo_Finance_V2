import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';

interface PagamentoSummaryProps {
  fornecedorNome: string;
  descricao: string;
  valor: number;
  valorPago: number;
  saldoRestante: number;
  percentualPago: number;
}

export function PagamentoSummary({
  fornecedorNome,
  descricao,
  valor,
  valorPago,
  saldoRestante,
  percentualPago,
}: PagamentoSummaryProps) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50">
      <p className="font-medium text-foreground">{fornecedorNome}</p>
      <p className="text-sm text-muted-foreground truncate">{descricao}</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span>Valor Total:</span>
        <span className="font-semibold text-foreground">{formatCurrency(valor)}</span>
      </div>
      {valorPago > 0 && (
        <>
          <div className="flex items-center justify-between text-sm mt-1">
            <span>Já Pago:</span>
            <span className="text-success font-medium">{formatCurrency(valorPago)}</span>
          </div>
          <Progress value={percentualPago} className="h-2 mt-2" />
        </>
      )}
      <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-border">
        <span className="font-medium">Saldo Restante:</span>
        <span className="font-bold text-foreground">{formatCurrency(saldoRestante)}</span>
      </div>
    </div>
  );
}
