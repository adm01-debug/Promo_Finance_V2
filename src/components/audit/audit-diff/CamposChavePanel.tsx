import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DiffField } from '@/lib/audit-diff';
import { formatValue } from './format';

interface CampoChave {
  key: string;
  value: unknown;
}

interface Props {
  camposChave: CampoChave[];
  changedKeyFields: Map<string, DiffField>;
  activeFields: Set<string>;
  onToggleField: (key: string) => void;
}

export function CamposChavePanel({ camposChave, changedKeyFields, activeFields, onToggleField }: Props) {
  if (camposChave.length === 0) return null;
  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          Campos-chave{' '}
          {changedKeyFields.size > 0 && (
            <Badge
              variant="outline"
              className="ml-1 h-4 px-1 text-[9px] uppercase bg-primary/10 text-primary border-primary/30"
            >
              {changedKeyFields.size} alterado(s)
            </Badge>
          )}
          {activeFields.size > 0 && (
            <span className="ml-2 text-muted-foreground">({activeFields.size} filtrando)</span>
          )}
        </p>
        <span className="text-[10px] text-muted-foreground">Clique para filtrar</span>
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
              onClick={() => onToggleField(c.key)}
              className={`group relative inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : wasChanged
                    ? 'bg-primary/5 border-primary/40 text-foreground ring-1 ring-primary/20 shadow-sm'
                    : 'bg-background border-border text-foreground'
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
                  active ? 'opacity-80' : wasChanged ? 'text-primary font-semibold' : 'text-muted-foreground'
                }
              >
                {c.key}:
              </span>
              {wasChanged && changed!.kind === 'changed' ? (
                <span className="inline-flex items-center gap-1">
                  <span className="line-through opacity-60">{formatValue(changed!.before)}</span>
                  <ArrowRight className={`h-2.5 w-2.5 ${active ? '' : 'text-primary'}`} aria-hidden="true" />
                  <span className="font-semibold">{formatValue(changed!.after)}</span>
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
  );
}
