import { AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { severidadeBadge, tempoDecorrido } from "./helpers";
import type { ConflitoBanner } from "./types";

interface Props {
  conflito: ConflitoBanner;
  onDismiss: () => void;
}

export function ConflitoBannerCard({ conflito, onDismiss }: Props) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-warning/40 bg-warning/10 p-3"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severidadeBadge(conflito.severidade)} className="text-[10px]">
              {conflito.severidade}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {conflito.tipoLabel}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Status: {conflito.statusLabel}
            </Badge>
          </div>
          <p className="text-xs font-medium">
            {conflito.motivo === "removida"
              ? "Esta anomalia foi removida do sistema enquanto você revisava."
              : "Outro revisor já resolveu esta anomalia enquanto você revisava."}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{conflito.autorNome}</span>
            {conflito.autorEmail && conflito.autorEmail !== conflito.autorNome && (
              <span> ({conflito.autorEmail})</span>
            )}{" "}
            {conflito.acaoLabel}
            {conflito.resolvidaEm && <> · {tempoDecorrido(conflito.resolvidaEm)}</>}.
          </p>
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            {conflito.descricao}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
              <Link
                to={`/audit-logs?table=anomalias_detectadas&record=${conflito.anomaliaId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver no log de auditoria
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs ml-auto"
              onClick={onDismiss}
            >
              Dispensar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
