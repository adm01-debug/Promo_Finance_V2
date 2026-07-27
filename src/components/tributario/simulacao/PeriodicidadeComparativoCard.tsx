// COMPONENTE: Comparativo de periodicidade de apuração (anual x trimestral)
// Exibe IRPJ+CSLL nas duas periodicidades, a economia e a recomendação final.
// Aplicável apenas ao Lucro Real (Lei 9.430/96 — opção irretratável no ano).

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarRange, TrendingDown, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { ResultadoCenario } from '@/lib/tributario';

export interface PeriodicidadeComparativoCardProps {
  cenario: ResultadoCenario;
  className?: string;
}

const LABEL = { anual: 'Anual', trimestral: 'Trimestral' } as const;

export function PeriodicidadeComparativoCard({
  cenario,
  className,
}: PeriodicidadeComparativoCardProps) {
  const { periodicidadeApuracao, irpjCsllPeriodicidadeAlternativa, economiaPeriodicidade } = cenario;

  // Só faz sentido no Lucro Real e quando o motor devolveu o comparativo.
  if (
    cenario.regime !== 'lucro_real' ||
    !cenario.elegivel ||
    !periodicidadeApuracao ||
    irpjCsllPeriodicidadeAlternativa === undefined ||
    economiaPeriodicidade === undefined
  ) {
    return null;
  }

  const atual = periodicidadeApuracao;
  const alternativa = atual === 'anual' ? 'trimestral' : 'anual';
  const totalAtual = cenario.irpj + cenario.csll;
  const totalAlternativa = irpjCsllPeriodicidadeAlternativa;

  // economiaPeriodicidade > 0 => a periodicidade selecionada já é a melhor.
  const selecionadaEhMelhor = economiaPeriodicidade >= 0;
  const recomendada = selecionadaEhMelhor ? atual : alternativa;
  const delta = Math.abs(economiaPeriodicidade);
  const indiferente = delta <= 1;

  const opcoes = [
    { chave: atual, total: totalAtual, selecionada: true },
    { chave: alternativa, total: totalAlternativa, selecionada: false },
  ] as const;

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
          Periodicidade de apuração — Anual x Trimestral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {opcoes.map((o) => {
            const ehRecomendada = !indiferente && o.chave === recomendada;
            return (
              <div
                key={o.chave}
                className={cn(
                  'p-3 rounded border',
                  ehRecomendada ? 'border-success bg-success/10' : 'border-border bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{LABEL[o.chave]}</p>
                  <div className="flex gap-1">
                    {o.selecionada && (
                      <Badge variant="outline" className="text-[10px]">
                        Selecionada
                      </Badge>
                    )}
                    {ehRecomendada && (
                      <Badge variant="outline" className="text-[10px] border-success text-success">
                        Recomendada
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(o.total)}</p>
                <p className="text-xs text-muted-foreground">IRPJ + CSLL no período</p>
              </div>
            );
          })}
        </div>

        {indiferente ? (
          <Alert>
            <Info className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              As duas periodicidades resultam em carga de IRPJ+CSLL praticamente idêntica
              (diferença inferior a R$ 1,00). Decida pelo critério de fluxo de caixa e esforço
              acessório.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant={selecionadaEhMelhor ? 'default' : 'warning'}>
            {selecionadaEhMelhor ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-4 w-4" aria-hidden="true" />
            )}
            <AlertDescription>
              {selecionadaEhMelhor ? (
                <>
                  A apuração <strong>{LABEL[recomendada].toLowerCase()}</strong> já é a mais
                  vantajosa: economiza <strong>{formatCurrency(delta)}</strong> de IRPJ+CSLL frente
                  à alternativa {LABEL[alternativa].toLowerCase()}.
                </>
              ) : (
                <>
                  Migrar para a apuração <strong>{LABEL[recomendada].toLowerCase()}</strong>{' '}
                  reduziria o IRPJ+CSLL em <strong>{formatCurrency(delta)}</strong>. A opção é
                  irretratável para todo o ano-calendário e deve ser manifestada no pagamento da
                  1ª quota (Lei 9.430/96, art. 3º).
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
