import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import type { AnomaliaDetectionRun } from "@/hooks/useAnomaliaDetectionRun";

const STEP_LABELS: Record<string, string> = {
  iniciando: "Inicializando",
  detector_outlier: "Detectando movimentações atípicas",
  detector_duplicado: "Verificando pagamentos duplicados",
  detector_p95: "Analisando contas a pagar acima do percentil 95",
  detector_conciliacao: "Identificando conciliações atrasadas",
  detector_regime: "Avaliando variações bruscas de regime",
  persistindo: "Salvando anomalias detectadas",
  concluido: "Concluído",
};

interface Props {
  run: AnomaliaDetectionRun;
}

export function DetectionRunProgress({ run }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!run.started_at || run.status !== "running") {
      setElapsed(
        run.duration_ms ? Math.round(run.duration_ms / 1000) : 0,
      );
      return;
    }
    const start = new Date(run.started_at).getTime();
    const tick = () => setElapsed(Math.round((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run.started_at, run.status, run.duration_ms]);

  const stepLabel = run.current_step
    ? STEP_LABELS[run.current_step] ?? run.current_step
    : "Aguardando início";

  const percent =
    run.total_steps > 0
      ? Math.min(100, Math.round((run.step_index / run.total_steps) * 100))
      : 0;

  return (
    <div
      className="rounded-lg border bg-muted/30 p-3 space-y-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Detecção em andamento</span>
          <span className="text-muted-foreground font-normal">
            · etapa {run.step_index}/{run.total_steps}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {elapsed}s
        </span>
      </div>
      <Progress value={percent} className="h-2" />
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{stepLabel}</span>
        <span className="shrink-0 tabular-nums">
          {run.candidatas} candidata{run.candidatas === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
