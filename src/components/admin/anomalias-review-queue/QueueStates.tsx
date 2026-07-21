import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewStats } from "./types";

export function LoadingState() {
  return (
    <div className="py-12 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="py-12 text-center space-y-2">
      <Sparkles className="h-10 w-10 mx-auto text-success" />
      <p className="font-medium">Nenhuma anomalia pendente</p>
      <p className="text-sm text-muted-foreground">Tudo em dia. ✓</p>
    </div>
  );
}

export function SummaryState({
  stats,
  onClose,
}: {
  stats: ReviewStats;
  onClose: () => void;
}) {
  return (
    <div className="py-8 text-center space-y-4">
      <Sparkles className="h-12 w-12 mx-auto text-success" />
      <div>
        <p className="text-lg font-semibold">Fila concluída</p>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.confirmadas} confirmadas · {stats.rejeitadas} rejeitadas · {stats.puladas} puladas
        </p>
      </div>
      <Button onClick={onClose}>Fechar</Button>
    </div>
  );
}

export function TransitionState() {
  return (
    <div
      className="py-12 flex flex-col items-center justify-center gap-2"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-xs text-muted-foreground">Carregando próxima anomalia…</p>
    </div>
  );
}
