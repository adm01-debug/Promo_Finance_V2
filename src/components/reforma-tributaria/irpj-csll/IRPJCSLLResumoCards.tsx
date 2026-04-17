import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  totaisAno: { irpj: number; csll: number; total: number };
  qtdApuracoes: number;
  saldoPrejuizos: { irpj: number; csll: number };
  aliquotaIRPJ: number;
  aliquotaCSLL: number;
}

export function IRPJCSLLResumoCards({ totaisAno, qtdApuracoes, saldoPrejuizos, aliquotaIRPJ, aliquotaCSLL }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">IRPJ Total</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totaisAno.irpj)}</div>
          <p className="text-xs text-muted-foreground">Alíquota: {(aliquotaIRPJ * 100).toFixed(0)}% + 10% adicional</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">CSLL Total</CardTitle>
          <FileText className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{formatCurrency(totaisAno.csll)}</div>
          <p className="text-xs text-muted-foreground">Alíquota: {(aliquotaCSLL * 100).toFixed(0)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Tributos</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totaisAno.total)}</div>
          <p className="text-xs text-muted-foreground">{qtdApuracoes} apurações</p>
        </CardContent>
      </Card>

      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Prejuízos Fiscais</CardTitle>
          <TrendingDown className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(saldoPrejuizos.irpj + saldoPrejuizos.csll)}
          </div>
          <p className="text-xs text-muted-foreground">
            IRPJ: {formatCurrency(saldoPrejuizos.irpj)} | CSLL: {formatCurrency(saldoPrejuizos.csll)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
