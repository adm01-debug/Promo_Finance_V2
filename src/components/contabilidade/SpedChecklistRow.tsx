import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ChecklistItem } from '@/hooks/useSpedContabil';

export function SpedChecklistRow({ item }: { item: ChecklistItem }) {
  const [open, setOpen] = useState(false);
  const Icon = item.status === 'ok' ? CheckCircle2 : item.status === 'warn' ? AlertTriangle : XCircle;
  const color =
    item.status === 'ok' ? 'text-emerald-600' :
    item.status === 'warn' ? 'text-amber-600' : 'text-destructive';
  const border =
    item.status === 'ok' ? 'border-l-emerald-500/50' :
    item.status === 'warn' ? 'border-l-amber-500/50' : 'border-l-destructive';
  const hasItens = item.itens && item.itens.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('rounded border bg-card border-l-4 p-3', border)}>
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', color)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.label}</p>
            {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
          </div>
          {hasItens && (
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                {open ? 'Ocultar' : 'Detalhes'}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>
        {hasItens && (
          <CollapsibleContent className="mt-2 pl-8">
            <ul className="text-xs space-y-1 text-muted-foreground">
              {item.itens!.map((i, idx) => <li key={idx} className="font-mono">• {i}</li>)}
              {item.itens!.length >= 20 && <li className="italic">… mais itens omitidos</li>}
            </ul>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
