import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Minus, ArrowRight, FileCode } from "lucide-react";
import {
  computeDiff,
  extractCamposChave,
  isEmptyDiff,
  type DiffField,
} from "@/lib/audit-diff";
import { formatDate } from "@/lib/formatters";

interface Props {
  old?: Record<string, unknown> | null;
  new?: Record<string, unknown> | null;
  action?: string | null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(v);
  }
  if (typeof v === "string") {
    if (ISO_DATE_RE.test(v)) {
      try {
        return formatDate(v);
      } catch {
        return v;
      }
    }
    return v;
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function ValueCell({ v, kind }: { v: unknown; kind: "before" | "after" | "neutral" }) {
  const text = formatValue(v);
  const long = text.length > 80 || (typeof v === "object" && v !== null);
  const tone =
    kind === "before"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : kind === "after"
        ? "bg-success/10 text-success border-success/20"
        : "bg-muted text-foreground border-border";
  if (long) {
    return (
      <pre
        className={`text-[11px] font-mono px-2 py-1 rounded border whitespace-pre-wrap break-all max-h-32 overflow-auto ${tone}`}
      >
        {text}
      </pre>
    );
  }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${tone}`}>{text}</span>
  );
}

function FieldRow({ field }: { field: DiffField }) {
  if (field.kind === "added") {
    return (
      <div className="flex items-start gap-2 py-1.5">
        <Plus className="h-3.5 w-3.5 mt-1 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">{field.key}</p>
          <div className="mt-0.5">
            <ValueCell v={field.after} kind="after" />
          </div>
        </div>
      </div>
    );
  }
  if (field.kind === "removed") {
    return (
      <div className="flex items-start gap-2 py-1.5">
        <Minus className="h-3.5 w-3.5 mt-1 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">{field.key}</p>
          <div className="mt-0.5">
            <ValueCell v={field.before} kind="before" />
          </div>
        </div>
      </div>
    );
  }
  // changed
  return (
    <div className="py-1.5">
      <p className="text-xs font-medium text-foreground mb-1">{field.key}</p>
      <div className="flex items-start gap-2 flex-wrap">
        <ValueCell v={field.before} kind="before" />
        <ArrowRight className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />
        <ValueCell v={field.after} kind="after" />
      </div>
    </div>
  );
}

export function AuditDiffView({ old: oldData, new: newData, action }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const isInsert = !oldData && !!newData;
  const isDelete = !!oldData && !newData;
  const diff = useMemo(() => computeDiff(oldData, newData), [oldData, newData]);
  const camposChave = useMemo(
    () => extractCamposChave(newData ?? oldData),
    [newData, oldData],
  );

  if (!oldData && !newData) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Sem snapshot de dados associado a esta ação.
      </p>
    );
  }

  const tipoLabel = isInsert
    ? "Criação"
    : isDelete
      ? "Exclusão"
      : isEmptyDiff(diff)
        ? "Sem alterações de dados"
        : `${diff.changed.length + diff.added.length + diff.removed.length} alteração(ões)`;

  return (
    <div className="space-y-3">
      {/* Campos-chave */}
      {camposChave.length > 0 && (
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Campos-chave</p>
          <div className="flex flex-wrap gap-1.5">
            {camposChave.map((c) => (
              <Badge
                key={c.key}
                variant="outline"
                className="text-[11px] font-mono gap-1 py-0.5"
              >
                <span className="text-muted-foreground">{c.key}:</span>
                <span className="text-foreground">{formatValue(c.value)}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cabeçalho de tipo */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge
          variant="outline"
          className={
            isInsert
              ? "bg-success/10 text-success border-success/20"
              : isDelete
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-accent/10 text-accent border-accent/20"
          }
        >
          {tipoLabel}
        </Badge>
        {action && (
          <span className="text-[11px] text-muted-foreground font-mono">{action}</span>
        )}
      </div>

      {/* INSERT: tabela de valores novos */}
      {isInsert && newData && (
        <div className="rounded-md border divide-y">
          {Object.entries(newData).map(([k, v]) => (
            <div key={k} className="px-3">
              <FieldRow field={{ key: k, before: undefined, after: v, kind: "added" }} />
            </div>
          ))}
        </div>
      )}

      {/* DELETE: tabela de valores anteriores */}
      {isDelete && oldData && (
        <div className="rounded-md border divide-y">
          {Object.entries(oldData).map(([k, v]) => (
            <div key={k} className="px-3">
              <FieldRow field={{ key: k, before: v, after: undefined, kind: "removed" }} />
            </div>
          ))}
        </div>
      )}

      {/* UPDATE */}
      {!isInsert && !isDelete && (
        <>
          {diff.changed.length > 0 && (
            <div className="rounded-md border">
              <div className="px-3 py-2 border-b bg-muted/30">
                <p className="text-xs font-semibold">
                  Alterações ({diff.changed.length})
                </p>
              </div>
              <div className="divide-y">
                {diff.changed.map((f) => (
                  <div key={f.key} className="px-3">
                    <FieldRow field={f} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(diff.added.length > 0 || diff.removed.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diff.added.length > 0 && (
                <div className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-success/5">
                    <p className="text-xs font-semibold text-success">
                      Adicionados ({diff.added.length})
                    </p>
                  </div>
                  <div className="divide-y">
                    {diff.added.map((f) => (
                      <div key={f.key} className="px-3">
                        <FieldRow field={f} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {diff.removed.length > 0 && (
                <div className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-destructive/5">
                    <p className="text-xs font-semibold text-destructive">
                      Removidos ({diff.removed.length})
                    </p>
                  </div>
                  <div className="divide-y">
                    {diff.removed.map((f) => (
                      <div key={f.key} className="px-3">
                        <FieldRow field={f} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isEmptyDiff(diff) && (
            <p className="text-sm text-muted-foreground italic">
              Os snapshots antes/depois são idênticos nos campos comparados.
            </p>
          )}
        </>
      )}

      {/* JSON bruto */}
      <div className="rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9 text-xs"
          onClick={() => setShowRaw((s) => !s)}
        >
          {showRaw ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <FileCode className="h-3.5 w-3.5" />
          Ver JSON bruto
        </Button>
        {showRaw && (
          <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
            {oldData && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Antes</p>
                <pre className="bg-muted p-2 rounded text-[11px] overflow-auto max-h-56">
                  {JSON.stringify(oldData, null, 2)}
                </pre>
              </div>
            )}
            {newData && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Depois</p>
                <pre className="bg-muted p-2 rounded text-[11px] overflow-auto max-h-56">
                  {JSON.stringify(newData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
