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
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <CardHeader className="flex flex-row items-start justify-between gap-6 p-8 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">Intelligence Command</CardTitle>
            <CardDescription className="text-sm font-medium opacity-60">
              Top 5 prioridades processadas por Redes Neurais Financeiras
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => regenerar.mutate()}
          disabled={regenerar.isPending}
          className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-primary transition-all"
        >
          {regenerar.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-8 pt-2 relative z-10">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {!isLoading && (!acoes || acoes.length === 0) && (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center bg-white/5">
            <div className="p-5 rounded-full bg-success/10 text-success w-fit mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="text-xl font-bold text-foreground">Sistema em Homeostase</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Nenhuma anomalia detectada. Sua governança financeira está em conformidade absoluta.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerar.mutate()}
              className="mt-8 rounded-xl border-white/10 bg-white/5 font-bold"
            >
              Recalcular Algoritmos
            </Button>
          </div>
        )}

        {!isLoading && acoes && acoes.length > 0 && (
          <ul className="space-y-4">
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group/item rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.07] hover:translate-x-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={cn("p-2.5 rounded-xl bg-current/10 shrink-0", cfg.color)}>
                        <UrgIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-base font-bold tracking-tight">{acao.titulo}</p>
                          <Badge variant={cfg.variant} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none">
                            {cfg.label}
                          </Badge>
                          {impactoLabel && (
                            <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/10 text-primary border-none">
                              Impacto: {impactoLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                          {acao.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
                          <span className="h-1 w-1 rounded-full bg-current" />
                          Neural Node: {acao.fonte}
                        </div>
                      </div>
                    </div>
                    {acao.link_resolucao && (
                      <Button asChild size="sm" className="shrink-0 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4">
                        <Link to={acao.link_resolucao}>
                          Execute <ArrowRight className="ml-2 h-4 w-4" />
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
