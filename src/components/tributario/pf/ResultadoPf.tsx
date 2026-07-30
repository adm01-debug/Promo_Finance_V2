// RESULTADO DA SIMULAÇÃO PF — Lei 15.270/2025
import { AlertTriangle, Info, ShieldAlert, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { ResultadoSimulacaoPF, SeveridadeAlertaPF } from '@/lib/tributario/pf-vinculada';

export interface ResultadoPfProps {
  data: ResultadoSimulacaoPF;
  otimizacao?: {
    melhorProLaboreMensal: number;
    melhorCarga: number;
    cargaAtual: number;
    economia: number;
  };
  className?: string;
}

const TOM_ALERTA: Record<SeveridadeAlertaPF, string> = {
  alta: 'border-destructive/40 bg-destructive/5 text-destructive',
  media: 'border-warning/40 bg-warning/5 text-warning',
  baixa: 'border-border bg-muted/30 text-muted-foreground',
};

function Linha({
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  rotulo: string;
  valor: number;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div>
        <p className={cn('text-sm', destaque ? 'font-semibold text-foreground' : 'text-foreground/90')}>
          {rotulo}
        </p>
        {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
      </div>
      <span
        className={cn(
          'shrink-0 font-mono text-sm tabular-nums',
          destaque ? 'text-base font-semibold text-destructive' : 'text-foreground',
        )}
      >
        {formatCurrency(valor)}
      </span>
    </div>
  );
}

/** Breakdown da carga tributária anual do sócio com alertas acionáveis. */
export function ResultadoPf({ data, otimizacao, className }: ResultadoPfProps) {
  const { irpfm } = data;

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Carga tributária anual do sócio</CardTitle>
          <CardDescription>
            Renda total considerada: {formatCurrency(data.rendaTotalAnual)} · base legal {data.baseLegal}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total tributado</p>
              <p className="mt-1 text-2xl font-bold text-destructive">
                {formatCurrency(data.totalTributadoAnual)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.percentualDaRenda.toFixed(2)}% da renda
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Renda líquida</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(data.rendaLiquidaAnual)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">após IR, IRRF e INSS</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Alíquota mínima IRPFM</p>
              <p className="mt-1 text-2xl font-bold">
                {(irpfm.aliquotaMinima * 100).toFixed(2)}%
              </p>
              <Badge variant={irpfm.aplicavel ? 'destructive' : 'secondary'} className="mt-1">
                {irpfm.aplicavel ? 'IRPFM aplicável' : 'Fora do IRPFM'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="divide-y">
            <Linha
              rotulo="IRPF sobre pró-labore"
              valor={data.irpfProLabore}
              detalhe={`Pró-labore anual: ${formatCurrency(data.proLaboreAnual)}`}
            />
            <Linha
              rotulo="IRRF 10% sobre dividendos"
              valor={data.irrfDividendos}
              detalhe={`Dividendos anuais: ${formatCurrency(data.dividendosAnuais)} · retenção acima de R$ 50.000/mês`}
            />
            <Linha
              rotulo="Complemento IRPFM na DAA"
              valor={irpfm.complementarDaa}
              detalhe={`Mínimo devido ${formatCurrency(irpfm.impostoMinimo)} − IR já pago ${formatCurrency(irpfm.irJaPago)}`}
            />
            <Linha
              rotulo="Outras rendas tributadas"
              valor={data.outrasRendasTributadas}
              detalhe={`Base: ${formatCurrency(data.outrasRendasAnuais)} · estimativa conservadora de 15%`}
            />
            <Linha
              rotulo="INSS contribuinte individual"
              valor={data.inss}
              detalhe="11% sobre o pró-labore, limitado ao teto previdenciário"
            />
            <Linha rotulo="Total anual" valor={data.totalTributadoAnual} destaque />
          </div>
        </CardContent>
      </Card>

      {otimizacao && otimizacao.economia > 0 && (
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" aria-hidden />
              Ponto ótimo de pró-labore
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Mantendo a mesma remuneração bruta, um pró-labore de{' '}
              <strong>{formatCurrency(otimizacao.melhorProLaboreMensal)}/mês</strong> reduz a carga anual
              para <strong>{formatCurrency(otimizacao.melhorCarga)}</strong> — economia de{' '}
              <strong className="text-success">{formatCurrency(otimizacao.economia)}</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      {data.alertas.length > 0 && (
        <div className="space-y-2">
          {data.alertas.map((a) => (
            <Alert key={a.tipo} className={cn('border', TOM_ALERTA[a.severidade])}>
              {a.severidade === 'alta' ? (
                <ShieldAlert className="h-4 w-4" aria-hidden />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              )}
              <AlertDescription className="text-foreground/90">{a.mensagem}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" aria-hidden />
        <AlertDescription className="text-xs">
          Simulação conservadora de sócio único, sem considerar holding patrimonial, deduções legais
          (dependentes, saúde, previdência) nem compensações de anos anteriores. O IRPFM é apurado na
          Declaração de Ajuste Anual, com o IR já retido no ano abatido do mínimo devido.
        </AlertDescription>
      </Alert>
    </div>
  );
}
