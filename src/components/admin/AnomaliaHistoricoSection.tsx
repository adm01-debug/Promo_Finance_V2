import { useMemo } from "react";
import { History, Loader2, FileSpreadsheet, FileText, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAnomaliaAuditHistory, type AnomaliaAuditEntry } from "@/hooks/useAnomaliaAuditHistory";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";
import { formatDateTime } from "@/lib/formatters";

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Criada",
  CREATE: "Criada",
  UPDATE: "Atualizada",
  DELETE: "Excluída",
  APPROVE: "Confirmada",
  REJECT: "Rejeitada (falso positivo)",
  REOPEN: "Reaberta",
  LOGIN: "Login",
};

const ACTION_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPROVE: "default",
  REJECT: "destructive",
  UPDATE: "secondary",
  REOPEN: "outline",
  INSERT: "outline",
  CREATE: "outline",
  DELETE: "destructive",
};

function isReopen(entry: AnomaliaAuditEntry): boolean {
  return (
    entry.details?.startsWith("REOPEN:") === true ||
    entry.details?.startsWith("REOPEN_BATCH") === true
  );
}

function isReopenBatch(entry: AnomaliaAuditEntry): boolean {
  return entry.details?.startsWith("REOPEN_BATCH") === true;
}

function actionLabel(entry: AnomaliaAuditEntry): string {
  if (isReopenBatch(entry)) return "Reaberta em lote";
  if (entry.details?.startsWith("REOPEN:")) return ACTION_LABEL.REOPEN;
  if (entry.details?.startsWith("BITRIX24_SYNC:")) return "Sincronização Bitrix24";
  return ACTION_LABEL[entry.action] ?? entry.action;
}

function actorLabel(entry: AnomaliaAuditEntry): string {
  if (entry.user_email && entry.user_email.trim()) return entry.user_email;
  if (entry.user_id) return `${entry.user_id.slice(0, 8)}…`;
  return "Sistema";
}

interface Props {
  anomaliaId: string;
}

export function AnomaliaHistoricoSection({ anomaliaId }: Props) {
  const { data: entries = [], isLoading, error } = useAnomaliaAuditHistory(anomaliaId);

  const columns: ExportColumn<AnomaliaAuditEntry>[] = useMemo(
    () => [
      {
        key: "created_at",
        header: "Data/Hora",
        formatter: (v) => formatDateTime(String(v ?? "")),
      },
      { key: "action", header: "Ação", formatter: (_v, row) => actionLabel(row) },
      { key: "user_email", header: "Usuário", formatter: (_v, row) => actorLabel(row) },
      {
        key: "details",
        header: "Observações",
        formatter: (v) => (v ? String(v) : "—"),
      },
      {
        key: "id",
        header: "ID do log",
      },
    ],
    [],
  );

  const handleExport = (formato: "csv" | "pdf") => {
    if (entries.length === 0) {
      toast.warning("Sem histórico para exportar");
      return;
    }
    const filename = `historico-anomalia-${anomaliaId.slice(0, 8)}`;
    const title = `Histórico da anomalia ${anomaliaId.slice(0, 8)}`;
    if (formato === "csv") {
      exportToCSV(entries, columns, filename);
      toast.success("CSV exportado");
    } else {
      exportToPDF(entries, columns, title);
    }
  };

  const reopenCount = useMemo(() => entries.filter(isReopen).length, [entries]);

  return (
    <div className="rounded-lg border border-l-4 border-l-muted-foreground/40 bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold tracking-tight">Histórico de mudanças</h3>
          {entries.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {entries.length}
            </Badge>
          )}
          {reopenCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs gap-1 border-primary/40 text-primary"
              title={`Esta anomalia foi reaberta ${reopenCount} vez(es)`}
            >
              <RotateCcw className="h-3 w-3" />
              {reopenCount} reabertura{reopenCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5"
              disabled={isLoading || entries.length === 0}
            >
              <Download className="h-3 w-3" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => handleExport("csv")}
            >
              <FileSpreadsheet className="h-4 w-4" /> CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => handleExport("pdf")}
            >
              <FileText className="h-4 w-4" /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-3">
            Erro ao carregar histórico.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">
            Nenhuma mudança registrada ainda.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
            <ul className="space-y-3">
              {entries.map((entry) => {
                const reopen = isReopen(entry);
                return (
                  <li key={entry.id} className="relative pl-7">
                    <div
                      className={`absolute left-1 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                        reopen ? "bg-primary ring-2 ring-primary/30" : "bg-primary"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={reopen ? "outline" : ACTION_VARIANT[entry.action] ?? "outline"}
                        className={`text-[10px] uppercase tracking-wide gap-1 ${
                          reopen ? "border-primary/40 text-primary" : ""
                        }`}
                      >
                        {reopen && <RotateCcw className="h-3 w-3" />}
                        {actionLabel(entry)}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-0.5">
                      {actorLabel(entry)}
                    </p>
                    {entry.details && (
                      <p
                        className="text-xs text-muted-foreground italic mt-0.5 line-clamp-3"
                        title={entry.details}
                      >
                        "{entry.details}"
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
