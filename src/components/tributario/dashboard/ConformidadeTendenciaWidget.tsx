/**
 * Etapa M — Widget de conformidade fiscal (histórico persistido) no Dashboard Tributário.
 *
 * Lê exclusivamente os snapshots já materializados em `conformidade_snapshots`
 * (gerados pelo cron mensal `gerar-snapshots-conformidade` ou manualmente na
 * tela de Obrigações Acessórias) e apresenta score atual, tendência e série
 * curta. Nenhuma regra de conformidade é reimplementada aqui — o componente é
 * puramente de apresentação sobre `analisarTendencia`.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Minus, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConformidadeSnapshotsDaEmpresa } from '@/hooks/useConformidadeSnapshots';
import {
  analisarTendencia,
  NIVEL_LABEL,
  type DirecaoTendencia,
  type NivelConformidade,
  type PontoHistorico,
} from '@/lib/tributario/obrigacoes';

export interface ConformidadeTendenciaWidgetProps {
  /** Empresa selecionada no dashboard. */
  readonly empresaId?: string;
  /** Quantidade de competências exibidas na série. */
  readonly meses?: number;
  readonly className?: string;
}

const NIVEL_CLASSE: Record<NivelConformidade, string> = {
  critico: 'bg-destructive/15 text-destructive border-destructive/30',
  atencao: 'bg-warning/15 text-warning border-warning/30',
  bom: 'bg-primary/15 text-primary border-primary/30',
  excelente: 'bg-success/15 text-success border-success/30',
};

const DIRECAO_CLASSE: Record<DirecaoTendencia, string> = {
  alta: 'text-success',
  estavel: 'text-muted-foreground',
  queda: 'text-destructive',
};

const DIRECAO_LABEL: Record<DirecaoTendencia, string> = {
  alta: 'Em melhora',
  estavel: 'Estável',
  queda: 'Em queda',
};

const rotuloCompetencia = (competencia: string) => {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano.slice(2)}`;
};

export function ConformidadeTendenciaWidget({
  empresaId,
  meses = 12,
  className,
}: ConformidadeTendenciaWidgetProps) {
  const { data: snapshots = [], isLoading } = useConformidadeSnapshotsDaEmpresa(empresaId, meses);

  const analise = useMemo(() => {
    const pontos: PontoHistorico[] = snapshots.map((s) => ({
      competencia: s.competencia,
      score: Number(s.score),
      nivel: s.nivel,
      total: s.total_obrigacoes,
      entregues: s.entregues,
      vencidasPendentes: s.vencidas_pendentes,
      entreguesComAtraso: s.entregues_com_atraso,
      pontualidade: Number(s.pontualidade),
      multaRegistrada: Number(s.multa_registrada),
    }));
    return analisarTendencia(pontos);
  }, [snapshots]);

  const Icone =
    analise.direcao === 'alta' ? TrendingUp : analise.direcao === 'queda' ? TrendingDown : Minus;

  const serie = useMemo(
    () => analise.pontos.map((p) => ({ competencia: rotuloCompetencia(p.competencia), score: p.score })),
    [analise.pontos],
  );

  return (
    <Card className={cn('backdrop-blur-xl bg-background/40 border-white/10 shadow-xl', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Conformidade Fiscal
            </CardTitle>
            <CardDescription>Score consolidado das obrigações acessórias</CardDescription>
          </div>
          <Button asChild size="sm" variant="ghost" className="gap-1 shrink-0">
            <Link to="/tributario/obrigacoes-acessorias" aria-label="Abrir obrigações acessórias">
              Detalhar
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : analise.pontos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma fotografia de conformidade registrada ainda. O histórico é gerado
            automaticamente todo mês, ou manualmente em Obrigações Acessórias.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-black tabular-nums">{analise.scoreAtual.toFixed(1)}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {rotuloCompetencia(analise.pontos[analise.pontos.length - 1].competencia)} · média{' '}
                  {analise.media.toFixed(1)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={cn('font-semibold', NIVEL_CLASSE[analise.pontos[analise.pontos.length - 1].nivel])}
                >
                  {NIVEL_LABEL[analise.pontos[analise.pontos.length - 1].nivel]}
                </Badge>
                <span className={cn('flex items-center gap-1 text-xs font-medium', DIRECAO_CLASSE[analise.direcao])}>
                  <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                  {DIRECAO_LABEL[analise.direcao]}
                  {analise.delta !== 0 ? ` (${analise.delta > 0 ? '+' : ''}${analise.delta.toFixed(1)})` : ''}
                </span>
              </div>
            </div>

            <div className="h-24" role="img" aria-label="Evolução do score de conformidade">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradConformidadeWidget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--border))' }}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(v: number) => [`${Number(v).toFixed(1)}`, 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#gradConformidadeWidget)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Pontualidade</dt>
                <dd className="text-sm font-bold tabular-nums">
                  {analise.pontos[analise.pontos.length - 1].pontualidade.toFixed(1)}%
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Vencidas</dt>
                <dd className="text-sm font-bold tabular-nums">
                  {analise.pontos[analise.pontos.length - 1].vencidasPendentes}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Multas</dt>
                <dd className="text-sm font-bold tabular-nums">
                  {analise.multaAcumulada.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  })}
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
