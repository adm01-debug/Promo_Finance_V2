// ============================================
// COMPONENT: CentroAcoesInteligentes (P13)
// Top 5 ações priorizadas por IA cruzando 5 fontes
// ============================================
import { Sparkles, ArrowRight, RefreshCw, Loader2, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcoesRecomendadas, type AcaoRecomendada } from "@/hooks/useAcoesRecomendadas";
import { formatCurrency } from "@/lib/formatters";

const URGENCIA_CONFIG: Record<AcaoRecomendada["urgencia"], { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  critica: { label: "Crítica", icon: AlertOctagon, variant: "destructive", color: "text-destructive" },
  alta: { label: "Alta", icon: AlertTriangle, variant: "destructive", color: "text-destructive" },
  media: { label: "Média", icon: Info, variant: "secondary", color: "text-warning" },
  baixa: { label: "Baixa", icon: CheckCircle2, variant: "outline", color: "text-muted-foreground" },
};

interface Props {
  empresaId?: string;
}

export function CentroAcoesInteligentes({ empresaId }: Props) {
  const { data: acoes, isLoading, regenerar } = useAcoesRecomendadas(empresaId);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.02]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Centro de Ações Inteligentes</CardTitle>
            <CardDescription>
              Top 5 ações priorizadas por IA cruzando anomalias, health score, alertas, apurações e LGPD
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => regenerar.mutate()}
          disabled={regenerar.isPending}
          aria-label="Regenerar ações"
        >
          {regenerar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3" aria-label="Carregando ações">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!isLoading && (!acoes || acoes.length === 0) && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" aria-hidden />
            <p className="text-sm font-medium">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma ação prioritária no momento. Sistema operando saudavelmente.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => regenerar.mutate()}
              disabled={regenerar.isPending}
              className="mt-2"
            >
              Recalcular agora
            </Button>
          </div>
        )}

        {!isLoading && acoes && acoes.length > 0 && (
          <ul className="space-y-2.5" role="list">
            {acoes.map((acao) => {
              const cfg = URGENCIA_CONFIG[acao.urgencia];
              const UrgIcon = cfg.icon;
              const impactoLabel = acao.impacto_estimado != null
                ? acao.impacto_tipo === "reais"
                  ? formatCurrency(acao.impacto_estimado)
                  : acao.impacto_tipo === "percentual"
                  ? `${acao.impacto_estimado.toFixed(1)}%`
                  : `+${acao.impacto_estimado.toFixed(0)} pts`
                : null;

              return (
                <li
                  key={acao.id}
                  className="rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <UrgIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{acao.titulo}</p>
                          <Badge variant={cfg.variant} className="text-[10px] h-4 px-1.5">
                            {cfg.label}
                          </Badge>
                          {impactoLabel && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              Impacto: {impactoLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {acao.descricao}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Fonte: {acao.fonte}
                        </p>
                      </div>
                    </div>
                    {acao.link_resolucao && (
                      <Button asChild size="sm" variant="outline" className="shrink-0">
                        <Link to={acao.link_resolucao}>
                          Resolver <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
