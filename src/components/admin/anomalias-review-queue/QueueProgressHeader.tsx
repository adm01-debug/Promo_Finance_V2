import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { severidadeBadge } from "./helpers";
import { SEVERIDADES, type Anomalia, type ProgressoPorSeveridade, type ReviewStats } from "./types";

interface Props {
  atual: Anomalia;
  total: number;
  index: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  stats: ReviewStats;
  progressoPorSeveridade: ProgressoPorSeveridade;
  outrasSeveridades: Anomalia["severidade"][];
  contagemPorSeveridade: Record<Anomalia["severidade"], number>;
  recarregando: boolean;
  onPularParaSeveridade: (sev: Anomalia["severidade"]) => void;
}

export function QueueProgressHeader({
  atual,
  total,
  index,
  hasNextPage,
  isFetchingNextPage,
  stats,
  progressoPorSeveridade,
  outrasSeveridades,
  contagemPorSeveridade,
  recarregando,
  onPularParaSeveridade,
}: Props) {
  return (
    <>
      <div className="space-y-1.5" aria-live="polite">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Revisando <span className="capitalize">{atual.severidade}</span>{" "}
            <span className="tabular-nums">
              {progressoPorSeveridade.revisado[atual.severidade] + 1}/
              {progressoPorSeveridade.total[atual.severidade]}
            </span>
            {outrasSeveridades.map((s) => (
              <span key={s} className="ml-1">
                · <span className="capitalize">{s}</span>{" "}
                <span className="tabular-nums">
                  {progressoPorSeveridade.revisado[s]}/{progressoPorSeveridade.total[s]}
                </span>
              </span>
            ))}
          </span>
          <span>
            ✓ {stats.confirmadas} · ✗ {stats.rejeitadas} · ⤳ {stats.puladas}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Posição geral: {index + 1} de {total}
            {hasNextPage && <span className="ml-1">+</span>}
          </span>
          {isFetchingNextPage && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> carregando mais…
            </span>
          )}
        </div>
        <Progress value={((index + 1) / total) * 100} className="h-1.5" />
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Pular para severidade"
      >
        <span className="text-xs text-muted-foreground mr-1">Pular para:</span>
        {SEVERIDADES.map((sev) => {
          const count = contagemPorSeveridade[sev];
          const ativo = atual.severidade === sev;
          const desabilitado = count === 0 || recarregando;
          return (
            <Button
              key={sev}
              type="button"
              size="sm"
              variant={ativo ? severidadeBadge(sev) : "outline"}
              className="h-7 px-2 text-xs capitalize gap-1"
              onClick={() => onPularParaSeveridade(sev)}
              disabled={desabilitado}
              title={
                count === 0
                  ? `Sem anomalias ${sev} restantes`
                  : `Ir para a próxima ${sev} (${count} restante${count === 1 ? "" : "s"})`
              }
              aria-pressed={ativo}
            >
              {sev}
              <Badge variant="secondary" className="h-4 px-1 text-[10px] tabular-nums">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>
    </>
  );
}
