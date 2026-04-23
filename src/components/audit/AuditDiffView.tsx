import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  ArrowRight,
  FileCode,
  Search,
  X,
  Filter,
} from "lucide-react";
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

function FieldLabel({ name, isKey }: { name: string; isKey?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-xs font-medium text-foreground">{name}</p>
      {isKey && (
        <Badge
          variant="outline"
          className="h-4 px-1 text-[9px] uppercase tracking-wide bg-primary/10 text-primary border-primary/30"
        >
          chave
        </Badge>
      )}
    </div>
  );
}

function FieldRow({ field, isKey = false }: { field: DiffField; isKey?: boolean }) {
  // Wrapper destacado quando o campo é "campo-chave"
  const wrapperBase = "py-1.5";
  const wrapperKey =
    "relative -mx-3 px-3 my-0.5 border-l-2 border-l-primary bg-primary/5 ring-1 ring-primary/20 rounded-r-md shadow-[0_0_0_1px_hsl(var(--primary)/0.05)]";
  const wrapperCls = isKey ? `${wrapperBase} ${wrapperKey}` : wrapperBase;

  if (field.kind === "added") {
    return (
      <div className={`flex items-start gap-2 ${wrapperCls}`}>
        <Plus className="h-3.5 w-3.5 mt-1 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <FieldLabel name={field.key} isKey={isKey} />
          <div className="mt-0.5">
            <ValueCell v={field.after} kind="after" />
          </div>
        </div>
      </div>
    );
  }
  if (field.kind === "removed") {
    return (
      <div className={`flex items-start gap-2 ${wrapperCls}`}>
        <Minus className="h-3.5 w-3.5 mt-1 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <FieldLabel name={field.key} isKey={isKey} />
          <div className="mt-0.5">
            <ValueCell v={field.before} kind="before" />
          </div>
        </div>
      </div>
    );
  }
  // changed
  return (
    <div className={wrapperCls}>
      <div className="mb-1">
        <FieldLabel name={field.key} isKey={isKey} />
      </div>
      <div
        className={`flex items-start gap-2 flex-wrap ${
          isKey
            ? "rounded-md border-2 border-primary/40 bg-background/60 p-2 ring-2 ring-primary/20 ring-offset-1 ring-offset-background"
            : ""
        }`}
      >
        <ValueCell v={field.before} kind="before" />
        <ArrowRight
          className={`h-3.5 w-3.5 mt-1 shrink-0 ${
            isKey ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <ValueCell v={field.after} kind="after" />
      </div>
    </div>
  );
}

function matchesQuery(field: DiffField, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (field.key.toLowerCase().includes(needle)) return true;
  const before = formatValue(field.before).toLowerCase();
  const after = formatValue(field.after).toLowerCase();
  return before.includes(needle) || after.includes(needle);
}

export function AuditDiffView({ old: oldData, new: newData, action }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());

  const isInsert = !oldData && !!newData;
  const isDelete = !!oldData && !newData;
  const diff = useMemo(() => computeDiff(oldData, newData), [oldData, newData]);
  const camposChave = useMemo(
    () => extractCamposChave(newData ?? oldData),
    [newData, oldData],
  );

  // Conjunto de chaves dos campos-chave (para destacar no diff)
  const keyFieldSet = useMemo(
    () => new Set(camposChave.map((c) => c.key)),
    [camposChave],
  );

  // Mapa key -> DiffField para campos-chave que sofreram alteração
  const changedKeyFields = useMemo(() => {
    const m = new Map<string, DiffField>();
    for (const f of diff.changed) if (keyFieldSet.has(f.key)) m.set(f.key, f);
    for (const f of diff.added) if (keyFieldSet.has(f.key)) m.set(f.key, f);
    for (const f of diff.removed) if (keyFieldSet.has(f.key)) m.set(f.key, f);
    return m;
  }, [diff, keyFieldSet]);

  const toggleField = (key: string) => {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setActiveFields(new Set());
  };

  const hasFilters = query.trim().length > 0 || activeFields.size > 0;

  const filterFields = (fields: DiffField[]): DiffField[] => {
    return fields.filter((f) => {
      if (activeFields.size > 0 && !activeFields.has(f.key)) return false;
      if (!matchesQuery(f, query.trim())) return false;
      return true;
    });
  };

  const filteredChanged = useMemo(() => filterFields(diff.changed), [diff.changed, query, activeFields]);
  const filteredAdded = useMemo(() => filterFields(diff.added), [diff.added, query, activeFields]);
  const filteredRemoved = useMemo(() => filterFields(diff.removed), [diff.removed, query, activeFields]);

  const insertEntries = useMemo(() => {
    if (!isInsert || !newData) return [] as Array<[string, unknown]>;
    const list = Object.entries(newData);
    return list.filter(([k, v]) => {
      if (activeFields.size > 0 && !activeFields.has(k)) return false;
      if (!matchesQuery({ key: k, before: undefined, after: v, kind: "added" }, query.trim())) return false;
      return true;
    });
  }, [isInsert, newData, query, activeFields]);

  const deleteEntries = useMemo(() => {
    if (!isDelete || !oldData) return [] as Array<[string, unknown]>;
    const list = Object.entries(oldData);
    return list.filter(([k, v]) => {
      if (activeFields.size > 0 && !activeFields.has(k)) return false;
      if (!matchesQuery({ key: k, before: v, after: undefined, kind: "removed" }, query.trim())) return false;
      return true;
    });
  }, [isDelete, oldData, query, activeFields]);

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

  const totalFiltered =
    filteredChanged.length +
    filteredAdded.length +
    filteredRemoved.length +
    insertEntries.length +
    deleteEntries.length;

  return (
    <div className="space-y-3">
      {/* Campos-chave (clicáveis para filtrar; destacam alterações) */}
      {camposChave.length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              Campos-chave{" "}
              {changedKeyFields.size > 0 && (
                <Badge
                  variant="outline"
                  className="ml-1 h-4 px-1 text-[9px] uppercase bg-primary/10 text-primary border-primary/30"
                >
                  {changedKeyFields.size} alterado(s)
                </Badge>
              )}
              {activeFields.size > 0 && (
                <span className="ml-2 text-muted-foreground">
                  ({activeFields.size} filtrando)
                </span>
              )}
            </p>
            <span className="text-[10px] text-muted-foreground">
              Clique para filtrar
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {camposChave.map((c) => {
              const active = activeFields.has(c.key);
              const changed = changedKeyFields.get(c.key);
              const wasChanged = !!changed;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleField(c.key)}
                  className={`group relative inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : wasChanged
                        ? "bg-primary/5 border-primary/40 text-foreground ring-1 ring-primary/20 shadow-sm"
                        : "bg-background border-border text-foreground"
                  }`}
                  aria-pressed={active}
                  title={
                    wasChanged
                      ? `Campo-chave alterado: ${c.key}`
                      : active
                        ? `Remover filtro: ${c.key}`
                        : `Filtrar pelo campo: ${c.key}`
                  }
                >
                  <span
                    className={
                      active
                        ? "opacity-80"
                        : wasChanged
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                    }
                  >
                    {c.key}:
                  </span>
                  {wasChanged && changed!.kind === "changed" ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="line-through opacity-60">
                        {formatValue(changed!.before)}
                      </span>
                      <ArrowRight
                        className={`h-2.5 w-2.5 ${
                          active ? "" : "text-primary"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-semibold">
                        {formatValue(changed!.after)}
                      </span>
                    </span>
                  ) : (
                    <span>{formatValue(c.value)}</span>
                  )}
                  {wasChanged && !active && (
                    <span
                      className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Busca + chips de filtro ativos */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por campo ou valor..."
            className="pl-7 h-8 text-xs"
            aria-label="Buscar alterações por campo ou valor"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {Array.from(activeFields).map((k) => (
              <Badge
                key={k}
                variant="secondary"
                className="text-[10px] gap-1 pr-1"
              >
                {k}
                <button
                  type="button"
                  onClick={() => toggleField(k)}
                  className="rounded-sm hover:bg-background/40 p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={`Remover filtro: ${k}`}
                >
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </Badge>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={clearFilters}
              aria-label="Limpar todos os filtros"
            >
              Limpar
            </Button>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {totalFiltered} resultado(s)
            </span>
          </div>
        )}
      </div>

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
        insertEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nenhum campo corresponde aos filtros.
          </p>
        ) : (
          <div className="rounded-md border divide-y">
            {insertEntries.map(([k, v]) => (
              <div key={k} className="px-3">
                <FieldRow field={{ key: k, before: undefined, after: v, kind: "added" }} isKey={keyFieldSet.has(k)} />
              </div>
            ))}
          </div>
        )
      )}

      {/* DELETE: tabela de valores anteriores */}
      {isDelete && oldData && (
        deleteEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nenhum campo corresponde aos filtros.
          </p>
        ) : (
          <div className="rounded-md border divide-y">
            {deleteEntries.map(([k, v]) => (
              <div key={k} className="px-3">
                <FieldRow field={{ key: k, before: v, after: undefined, kind: "removed" }} isKey={keyFieldSet.has(k)} />
              </div>
            ))}
          </div>
        )
      )}

      {/* UPDATE */}
      {!isInsert && !isDelete && (
        <>
          {filteredChanged.length > 0 && (
            <div className="rounded-md border">
              <div className="px-3 py-2 border-b bg-muted/30">
                <p className="text-xs font-semibold">
                  Alterações ({filteredChanged.length}
                  {filteredChanged.length !== diff.changed.length && ` de ${diff.changed.length}`})
                </p>
              </div>
              <div className="divide-y">
                {filteredChanged.map((f) => (
                  <div key={f.key} className="px-3">
                    <FieldRow field={f} isKey={keyFieldSet.has(f.key)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(filteredAdded.length > 0 || filteredRemoved.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAdded.length > 0 && (
                <div className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-success/5">
                    <p className="text-xs font-semibold text-success">
                      Adicionados ({filteredAdded.length}
                      {filteredAdded.length !== diff.added.length && ` de ${diff.added.length}`})
                    </p>
                  </div>
                  <div className="divide-y">
                    {filteredAdded.map((f) => (
                      <div key={f.key} className="px-3">
                        <FieldRow field={f} isKey={keyFieldSet.has(f.key)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filteredRemoved.length > 0 && (
                <div className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-destructive/5">
                    <p className="text-xs font-semibold text-destructive">
                      Removidos ({filteredRemoved.length}
                      {filteredRemoved.length !== diff.removed.length && ` de ${diff.removed.length}`})
                    </p>
                  </div>
                  <div className="divide-y">
                    {filteredRemoved.map((f) => (
                      <div key={f.key} className="px-3">
                        <FieldRow field={f} isKey={keyFieldSet.has(f.key)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasFilters &&
            filteredChanged.length === 0 &&
            filteredAdded.length === 0 &&
            filteredRemoved.length === 0 &&
            !isEmptyDiff(diff) && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nenhuma alteração corresponde aos filtros.
              </p>
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
