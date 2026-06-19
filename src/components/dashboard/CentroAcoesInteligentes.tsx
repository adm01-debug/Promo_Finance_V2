import { Sparkles, ArrowRight, RefreshCw, Loader2, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcoesRecomendadas, type AcaoRecomendada } from "@/hooks/useAcoesRecomendadas";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const URGENCIA_CONFIG: Record<AcaoRecomendada["urgencia"], { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  critica: { label: "Crítica", icon: AlertOctagon, variant: "destructive", color: "text-rose-600" },
  alta: { label: "Alta", icon: AlertTriangle, variant: "destructive", color: "text-rose-600" },
  media: { label: "Média", icon: Info, variant: "secondary", color: "text-amber-600" },
  baixa: { label: "Baixa", icon: CheckCircle2, variant: "outline", color: "text-muted-foreground" },
};

interface Props {
  empresaId?: string;
}

export function CentroAcoesInteligentes({ empresaId }: Props) {
  const { data: acoes, isLoading, regenerar } = useAcoesRecomendadas(empresaId);

  return (
    <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between gap-6 p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-primary group-hover:scale-105 transition-all">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Ações Prioritárias</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Recomendações baseadas em inteligência financeira
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => regenerar.mutate()}
          disabled={regenerar.isPending}
          className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50"
        >
          {regenerar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg bg-muted/50" />
            ))}
          </div>
        )}

        {!isLoading && (!acoes || acoes.length === 0) && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 w-fit mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold text-foreground">Tudo em dia!</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
              Nenhuma ação crítica pendente no momento.
            </p>
          </div>
        )}

        {!isLoading && acoes && acoes.length > 0 && (
          <ul className="space-y-3">
            {acoes.map((acao, idx) => {
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
                <motion.li
                  key={acao.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-card hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn("p-1.5 rounded-md bg-card border border-border mt-0.5", cfg.color)}>
                        <UrgIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-foreground">{acao.titulo}</span>
                          <Badge variant={cfg.variant} className="text-[9px] font-bold px-1.5 h-auto rounded-sm border-none uppercase">
                            {cfg.label}
                          </Badge>
                          {impactoLabel && (
                            <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-primary border-none uppercase">
                              {impactoLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {acao.descricao}
                        </p>
                      </div>
                    </div>
                    {acao.link_resolucao && (
                      <Button asChild size="sm" className="h-8 rounded-md bg-primary text-white font-bold px-4 text-xs shrink-0">
                        <Link to={acao.link_resolucao}>
                          Resolver <ArrowRight className="ml-1.5 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}