import { AlertTriangle, BellOff, ListChecks, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

export interface PendentesPorSev {
  todas: number;
  critica: number;
  alta: number;
  media: number;
  baixa: number;
}

export interface AnomaliasPanelHeaderProps {
  criticasCount: number;
  reviewSeveridade: Anomalia["severidade"] | "todas";
  onReviewSeveridadeChange: (v: Anomalia["severidade"] | "todas") => void;
  pendentesPorSev: PendentesPorSev;
  onOpenReview: () => void;
  onOpenPrefs: () => void;
  onDetectar: () => void;
  disparando: boolean;
  activeRun: unknown;
}

export function AnomaliasPanelHeader({
  criticasCount,
  reviewSeveridade,
  onReviewSeveridadeChange,
  pendentesPorSev,
  onOpenReview,
  onOpenPrefs,
  onDetectar,
  disparando,
  activeRun,
}: AnomaliasPanelHeaderProps) {
  const filaCount =
    reviewSeveridade === "todas"
      ? pendentesPorSev.todas
      : pendentesPorSev[reviewSeveridade];

  return (
    <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        Anomalias detectadas
        {criticasCount > 0 && (
          <Badge variant="destructive" className="ml-1" aria-live="polite">
            {criticasCount} crítica{criticasCount > 1 ? "s" : ""}
          </Badge>
        )}
      </CardTitle>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1">
          <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Revisar:
          </span>
          <Select
            value={reviewSeveridade}
            onValueChange={(v) =>
              onReviewSeveridadeChange(v as Anomalia["severidade"] | "todas")
            }
          >
            <SelectTrigger
              className="h-7 w-32 border-0 bg-transparent px-1 text-xs focus:ring-0"
              aria-label="Filtrar fila por severidade"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas ({pendentesPorSev.todas})</SelectItem>
              <SelectItem value="critica">Crítica ({pendentesPorSev.critica})</SelectItem>
              <SelectItem value="alta">Alta ({pendentesPorSev.alta})</SelectItem>
              <SelectItem value="media">Média ({pendentesPorSev.media})</SelectItem>
              <SelectItem value="baixa">Baixa ({pendentesPorSev.baixa})</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs"
            disabled={filaCount === 0}
            onClick={onOpenReview}
          >
            Iniciar
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onOpenPrefs}
          title="Preferências de alerta"
        >
          <BellOff className="h-3 w-3 mr-1" />
          Preferências
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDetectar}
          disabled={disparando || !!activeRun}
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${disparando || activeRun ? "animate-spin" : ""}`}
          />
          {activeRun ? "Detecção em andamento…" : "Detectar agora"}
        </Button>
      </div>
    </div>
  );
}
