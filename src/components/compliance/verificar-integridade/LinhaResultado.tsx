import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ResultadoArquivo } from "./types";

export function LinhaResultado({ item }: { item: ResultadoArquivo }) {
  const cfg = {
    ok: {
      Icon: CheckCircle2,
      cls: "text-success",
      label: "Conferiu",
      variant: "secondary" as const,
    },
    divergente: {
      Icon: XCircle,
      cls: "text-destructive",
      label: "Hash divergente",
      variant: "destructive" as const,
    },
    ausente: {
      Icon: AlertTriangle,
      cls: "text-warning",
      label: "Arquivo não enviado",
      variant: "outline" as const,
    },
    extra: {
      Icon: AlertTriangle,
      cls: "text-muted-foreground",
      label: "Não declarado no manifest",
      variant: "outline" as const,
    },
  }[item.status];

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <cfg.Icon className={`h-4 w-4 shrink-0 ${cfg.cls}`} />
          <span className="font-medium truncate">{item.nome}</span>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      {(item.status === "ok" || item.status === "divergente") && (
        <div className="mt-2 grid gap-1 text-xs font-mono break-all">
          <div>
            <span className="text-muted-foreground">esperado: </span>
            {item.hashEsperado}
          </div>
          <div>
            <span className="text-muted-foreground">calculado: </span>
            <span className={item.status === "divergente" ? "text-destructive" : ""}>
              {item.hashCalculado}
            </span>
          </div>
        </div>
      )}
      {item.status === "ausente" && (
        <div className="mt-2 text-xs font-mono break-all">
          <span className="text-muted-foreground">esperado: </span>
          {item.hashEsperado}
        </div>
      )}
      {item.status === "extra" && (
        <div className="mt-2 text-xs font-mono break-all">
          <span className="text-muted-foreground">calculado: </span>
          {item.hashCalculado}
        </div>
      )}
    </div>
  );
}
