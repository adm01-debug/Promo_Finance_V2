import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIPO_LABEL, severidadeBadge, tempoDecorrido } from "./helpers";
import type { Anomalia } from "./types";

interface Props {
  anomalia: Anomalia;
  dadosFormatados: string;
}

export function AnomaliaDetailCard({ anomalia, dadosFormatados }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={severidadeBadge(anomalia.severidade)}>{anomalia.severidade}</Badge>
        <Badge variant="outline" className="text-xs">
          {TIPO_LABEL[anomalia.tipo_anomalia]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {tempoDecorrido(anomalia.detectada_em)}
        </span>
      </div>
      <p className="text-sm">{anomalia.descricao}</p>
      {anomalia.observacoes && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
          {anomalia.observacoes}
        </p>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver dados brutos
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-[11px] overflow-x-auto max-h-48">
          {dadosFormatados}
        </pre>
      </details>

      <Button asChild variant="link" size="sm" className="px-0 h-auto">
        <Link to={`/admin/insights-ia/anomalia/${anomalia.id}`} target="_blank">
          Abrir drill-down completo <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
