import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, FileText, TrendingDown, AlertTriangle } from 'lucide-react';
import type { ApuracaoTributaria } from '@/hooks/useApuracoesTributarias';
import { formatCurrency } from '@/lib/formatters';

interface ApuracaoMensalKPICardsProps {
  totaisAno: { cbs: number; ibs: number; is: number; residuais: number; total: number };
  anoSelecionado: number;
  apuracoesAno: ApuracaoTributaria[];
}

export function ApuracaoMensalKPICards({
  totaisAno,
  anoSelecionado,
  apuracoesAno,
}: ApuracaoMensalKPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">CBS Total</CardTitle>
          <FileText className="h-4 w-4 text-cbs" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cbs">{formatCurrency(totaisAno.cbs)}</div>
          <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">IBS Total</CardTitle>
          <FileText className="h-4 w-4 text-ibs" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ibs">{formatCurrency(totaisAno.ibs)}</div>
          <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Imposto Seletivo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-imposto-seletivo" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-imposto-seletivo">
            {formatCurrency(totaisAno.is)}
          </div>
          <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tributos Residuais</CardTitle>
          <TrendingDown className="h-4 w-4 text-residual" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-residual">
            {formatCurrency(totaisAno.residuais)}
          </div>
          <p className="text-xs text-muted-foreground">ICMS/ISS/PIS/COFINS</p>
        </CardContent>
      </Card>
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          <Calculator className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totaisAno.total)}</div>
          <p className="text-xs text-muted-foreground">{apuracoesAno.length} apurações</p>
        </CardContent>
      </Card>
    </div>
  );
}
