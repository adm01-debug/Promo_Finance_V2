import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Check, Copy, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  computeDiff,
  extractCamposChave,
  isEmptyDiff,
  type DiffField,
} from '@/lib/audit-diff';
import { matchesQuery } from './audit-diff/format';
import { FieldRow } from './audit-diff/FieldRow';
import { CamposChavePanel } from './audit-diff/CamposChavePanel';
import { FiltersBar } from './audit-diff/FiltersBar';
import { buildResumo } from './audit-diff/buildResumo';

interface Props {
  old?: Record<string, unknown> | null;
  new?: Record<string, unknown> | null;
  action?: string | null;
}

export function AuditDiffView({ old: oldData, new: newData, action }: Props) {
  const [showRaw, setShowRaw] = useLocalStorageState<boolean>('audit:diff:showRaw', false);
  const [query, setQuery] = useLocalStorageState<string>('audit:diff:query', '');
  const [activeFieldsArr, setActiveFieldsArr] = useLocalStorageState<string[]>('audit:diff:activeFields', []);
  const activeFields = useMemo(() => new Set(activeFieldsArr), [activeFieldsArr]);
  const setActiveFields = (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setActiveFieldsArr((prev) => {
      const prevSet = new Set(prev);
      const next = typeof updater === 'function' ? updater(prevSet) : updater;
      return Array.from(next);
    });
  };
  const [copied, setCopied] = useState(false);

  const isInsert = !oldData && !!newData;
  const isDelete = !!oldData && !newData;
  const diff = useMemo(() => computeDiff(oldData, newData), [oldData, newData]);
  const camposChave = useMemo(() => extractCamposChave(newData ?? oldData), [newData, oldData]);
  const keyFieldSet = useMemo(() => new Set(camposChave.map((c) => c.key)), [camposChave]);

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
    setQuery('');
    setActiveFields(new Set());
  };

  const hasFilters = query.trim().length > 0 || activeFields.size > 0;

  const filterFields = (fields: DiffField[]): DiffField[] =>
    fields.filter((f) => {
      if (activeFields.size > 0 && !activeFields.has(f.key)) return false;
      if (!matchesQuery(f, query.trim())) return false;
      return true;
    });

  const filteredChanged = useMemo(() => filterFields(diff.changed), [diff.changed, query, activeFields]);
  const filteredAdded = useMemo(() => filterFields(diff.added), [diff.added, query, activeFields]);
  const filteredRemoved = useMemo(() => filterFields(diff.removed), [diff.removed, query, activeFields]);

  const insertEntries = useMemo(() => {
    if (!isInsert || !newData) return [] as Array<[string, unknown]>;
    return Object.entries(newData).filter(([k, v]) => {
      if (activeFields.size > 0 && !activeFields.has(k)) return false;
      if (!matchesQuery({ key: k, before: undefined, after: v, kind: 'added' }, query.trim())) return false;
      return true;
    });
  }, [isInsert, newData, query, activeFields]);

  const deleteEntries = useMemo(() => {
    if (!isDelete || !oldData) return [] as Array<[string, unknown]>;
    return Object.entries(oldData).filter(([k, v]) => {
      if (activeFields.size > 0 && !activeFields.has(k)) return false;
      if (!matchesQuery({ key: k, before: v, after: undefined, kind: 'removed' }, query.trim())) return false;
      return true;
    });
  }, [isDelete, oldData, query, activeFields]);

  if (!oldData && !newData) {
    return <p className="text-sm text-muted-foreground italic">Sem snapshot de dados associado a esta ação.</p>;
  }

  const tipoLabel = isInsert
    ? 'Criação'
    : isDelete
      ? 'Exclusão'
      : isEmptyDiff(diff)
        ? 'Sem alterações de dados'
        : `${diff.changed.length + diff.added.length + diff.removed.length} alteração(ões)`;

  const totalFiltered =
    filteredChanged.length + filteredAdded.length + filteredRemoved.length + insertEntries.length + deleteEntries.length;

  const handleCopyResumo = async () => {
    try {
      const resumo = buildResumo({
        action,
        tipoLabel,
        camposChave,
        changedKeyFields,
        isInsert,
        isDelete,
        oldData,
        newData,
        diff,
      });
      await navigator.clipboard.writeText(resumo);
      setCopied(true);
      toast.success('Resumo copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Falha ao copiar resumo');
    }
  };

  return (
    <div className="space-y-3">
      <CamposChavePanel
        camposChave={camposChave}
        changedKeyFields={changedKeyFields}
        activeFields={activeFields}
        onToggleField={toggleField}
      />

      <FiltersBar
        query={query}
        setQuery={setQuery}
        activeFields={activeFields}
        onToggleField={toggleField}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
        totalFiltered={totalFiltered}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={
              isInsert
                ? 'bg-success/10 text-success border-success/20'
                : isDelete
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-accent/10 text-accent border-accent/20'
            }
          >
            {tipoLabel}
          </Badge>
          {action && <span className="text-[11px] text-muted-foreground font-mono">{action}</span>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleCopyResumo}
          aria-label="Copiar resumo das alterações"
          title="Copia campos-chave e alterações em formato texto"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar resumo
            </>
          )}
        </Button>
      </div>

      {isInsert && newData &&
        (insertEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum campo corresponde aos filtros.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {insertEntries.map(([k, v]) => (
              <div key={k} className="px-3">
                <FieldRow field={{ key: k, before: undefined, after: v, kind: 'added' }} isKey={keyFieldSet.has(k)} />
              </div>
            ))}
          </div>
        ))}

      {isDelete && oldData &&
        (deleteEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum campo corresponde aos filtros.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {deleteEntries.map(([k, v]) => (
              <div key={k} className="px-3">
                <FieldRow field={{ key: k, before: v, after: undefined, kind: 'removed' }} isKey={keyFieldSet.has(k)} />
              </div>
            ))}
          </div>
        ))}

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

      <div className="rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9 text-xs"
          onClick={() => setShowRaw((s) => !s)}
        >
          {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
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
