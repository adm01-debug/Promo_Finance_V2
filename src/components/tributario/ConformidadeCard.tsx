/**
 * Card de Score de Conformidade Fiscal (Etapa J).
 * Componente de apresentação puro — recebe o resultado já calculado.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NIVEL_LABEL,
  type NivelConformidade,
  type ResultadoConformidade,
} from '@/lib/tributario/obrigacoes';

export interface ConformidadeCardProps {
  readonly resultado: ResultadoConformidade;
  readonly className?: string;
}

const NIVEL_CLASSE: Record<NivelConformidade, string> = {
  excelente: 'text-success',
  bom: 'text-success',
  atencao: 'text-warning',
  critico: 'text-destructive',
};

const NIVEL_VARIANT: Record<NivelConformidade, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  excelente: 'secondary',
  bom: 'secondary',
  atencao: 'default',
  critico: 'destructive',
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ConformidadeCard({ resultado, className }: ConformidadeCardProps) {
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Score de Conformidade Fiscal</CardTitle>
          </div>
          <Badge variant={NIVEL_VARIANT[resultado.nivel]}>{NIVEL_LABEL[resultado.nivel]}</Badge>
        </div>
        <CardDescription>
          Ponderação das obrigações do período: vencidas sem entrega zeram o item, entregas em atraso
          pontuam 60%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <p className={cn('text-4xl font-semibold tabular-nums', NIVEL_CLASSE[resultado.nivel])}>
            {resultado.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          </p>
          <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress
          value={resultado.score}
          aria-label={`Score de conformidade: ${resultado.score} de 100`}
        />

        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            { label: 'Vencidas em aberto', valor: String(resultado.vencidasPendentes) },
            { label: 'Entregas com atraso', valor: String(resultado.entreguesComAtraso) },
            {
              label: 'Pontualidade',
              valor: `${resultado.pontualidade.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`,
            },
            { label: 'Multa registrada', valor: brl(resultado.multaRegistrada) },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-border/60 bg-muted/30 p-3">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 font-medium text-foreground tabular-nums">{item.valor}</dd>
            </div>
          ))}
        </dl>

        {resultado.porOrgao.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Conformidade por órgão
            </p>
            <ul className="space-y-2">
              {resultado.porOrgao.map((o) => (
                <li key={o.orgao} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground">{o.orgao}</span>
                  <Progress value={o.score} className="h-2 flex-1" />
                  <span className="w-14 shrink-0 text-right tabular-nums text-foreground">
                    {o.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
