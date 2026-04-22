// Painel visual de pré-validação cruzada Razão × DRE para SPED ECD/ECF.
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { PreValidacaoResult, SeveridadeAlerta } from '@/hooks/usePreValidacaoSped';

interface Props {
  resultado: PreValidacaoResult;
  className?: string;
}

const SEV_META: Record<
  SeveridadeAlerta,
  { icon: typeof AlertCircle; label: string; tone: string; iconClass: string }
> = {
  error: {
    icon: AlertCircle,
    label: 'Erro',
    tone: 'border-destructive/40 bg-destructive/5',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Aviso',
    tone: 'border-warning/40 bg-warning/5',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    label: 'Info',
    tone: 'border-primary/30 bg-primary/5',
    iconClass: 'text-primary',
  },
};

const CATEGORIA_LABEL: Record<string, string> = {
  razao: 'Razão',
  dre: 'DRE',
  cruzado: 'Cruzado',
  cobertura: 'Cobertura',
  cfc: 'CFC',
};

export function PreValidacaoSpedPanel({ resultado, className }: Props) {
  const { isLoading, alertas, totais, resumo, podeGerar } = resultado;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Executando pré-validação cruzada Razão × DRE...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className={cn('h-4 w-4', podeGerar ? 'text-success' : 'text-muted-foreground')} />
            Pré-validação contábil (Razão × DRE)
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={totais.erros > 0 ? 'destructive' : 'secondary'} className="gap-1">
              <AlertCircle className="h-3 w-3" /> {totais.erros} erro(s)
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {totais.avisos} aviso(s)
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" /> {totais.info} info
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo numérico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <ResumoBox label="Lançamentos" value={resumo.totalLancamentos.toLocaleString('pt-BR')} />
          <ResumoBox label="Partidas" value={resumo.totalPartidas.toLocaleString('pt-BR')} />
          <ResumoBox
            label="Débitos Razão"
            value={formatCurrency(resumo.debitoRazao)}
            highlight={Math.abs(resumo.diferencaRazao) > 0.01}
          />
          <ResumoBox
            label="Créditos Razão"
            value={formatCurrency(resumo.creditoRazao)}
            highlight={Math.abs(resumo.diferencaRazao) > 0.01}
          />
          <ResumoBox label="Receita Bruta (DRE)" value={formatCurrency(resumo.receitaBruta)} />
          <ResumoBox
            label="Lucro Líquido (DRE)"
            value={formatCurrency(resumo.lucroLiquido)}
            highlight={resumo.lucroLiquido < 0}
          />
          <ResumoBox
            label="Lanç. desbalanceados"
            value={resumo.lancamentosNaoBalanceados.toLocaleString('pt-BR')}
            highlight={resumo.lancamentosNaoBalanceados > 0}
          />
          <ResumoBox
            label="Partidas s/ conta"
            value={resumo.partidasSemConta.toLocaleString('pt-BR')}
            highlight={resumo.partidasSemConta > 0}
          />
        </div>

        <Separator />

        {alertas.length === 0 ? (
          <Alert className="border-success/40 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Tudo consistente</AlertTitle>
            <AlertDescription>
              Razão fechado, DRE coerente e nenhum desvio detectado. Você pode prosseguir com a geração do SPED.
            </AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Lista de alertas de pré-validação">
            {alertas.map((a) => {
              const meta = SEV_META[a.severidade];
              const Icon = meta.icon;
              return (
                <li
                  key={a.id}
                  className={cn('flex gap-3 rounded-md border p-3 text-xs', meta.tone)}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', meta.iconClass)} aria-hidden />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{a.titulo}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {CATEGORIA_LABEL[a.categoria] ?? a.categoria}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          a.severidade === 'error' && 'border-destructive/50 text-destructive',
                          a.severidade === 'warning' && 'border-warning/50 text-warning',
                          a.severidade === 'info' && 'border-primary/40 text-primary',
                        )}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{a.detalhe}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totais.erros > 0 && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Geração bloqueada por erros críticos</AlertTitle>
            <AlertDescription>
              Resolva os {totais.erros} erro(s) acima — eles indicam dados incompletos ou inconsistentes que
              invalidariam o SPED.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function ResumoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-md border bg-muted/30 px-3 py-2',
        highlight && 'border-warning/40 bg-warning/5',
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('font-mono font-semibold text-sm', highlight && 'text-warning')}>{value}</p>
    </div>
  );
}
