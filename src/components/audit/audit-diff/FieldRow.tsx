import { ArrowRight, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DiffField } from '@/lib/audit-diff';
import { formatValue } from './format';

export function ValueCell({ v, kind }: { v: unknown; kind: 'before' | 'after' | 'neutral' }) {
  const text = formatValue(v);
  const long = text.length > 80 || (typeof v === 'object' && v !== null);
  const tone =
    kind === 'before'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : kind === 'after'
        ? 'bg-success/10 text-success border-success/20'
        : 'bg-muted text-foreground border-border';
  if (long) {
    return (
      <pre
        className={`text-[11px] font-mono px-2 py-1 rounded border whitespace-pre-wrap break-all max-h-32 overflow-auto ${tone}`}
      >
        {text}
      </pre>
    );
  }
  return <span className={`text-xs font-mono px-2 py-0.5 rounded border ${tone}`}>{text}</span>;
}

export function FieldLabel({ name, isKey }: { name: string; isKey?: boolean }) {
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

export function FieldRow({ field, isKey = false }: { field: DiffField; isKey?: boolean }) {
  const wrapperBase = 'py-1.5';
  const wrapperKey =
    'relative -mx-3 px-3 my-0.5 border-l-2 border-l-primary bg-primary/5 ring-1 ring-primary/20 rounded-r-md shadow-[0_0_0_1px_hsl(var(--primary)/0.05)]';
  const wrapperCls = isKey ? `${wrapperBase} ${wrapperKey}` : wrapperBase;

  if (field.kind === 'added') {
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
  if (field.kind === 'removed') {
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
  return (
    <div className={wrapperCls}>
      <div className="mb-1">
        <FieldLabel name={field.key} isKey={isKey} />
      </div>
      <div
        className={`flex items-start gap-2 flex-wrap ${
          isKey
            ? 'rounded-md border-2 border-primary/40 bg-background/60 p-2 ring-2 ring-primary/20 ring-offset-1 ring-offset-background'
            : ''
        }`}
      >
        <ValueCell v={field.before} kind="before" />
        <ArrowRight
          className={`h-3.5 w-3.5 mt-1 shrink-0 ${isKey ? 'text-primary' : 'text-muted-foreground'}`}
        />
        <ValueCell v={field.after} kind="after" />
      </div>
    </div>
  );
}
