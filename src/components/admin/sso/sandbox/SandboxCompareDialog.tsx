import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OUTCOME_META } from './outcome';
import type { SandboxRun } from '@/hooks/useSSOSandboxRuns';

interface Props {
  runs: SandboxRun[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SandboxCompareDialog({ runs, open, onOpenChange }: Props) {
  if (runs.length !== 2) return null;
  const [a, b] = runs;

  const fields: Array<{ label: string; getter: (r: SandboxRun) => string }> = [
    { label: 'Outcome', getter: r => OUTCOME_META[r.outcome].label },
    { label: 'Provider', getter: r => r.provider_nome ?? '(manual)' },
    { label: 'Email', getter: r => r.email_masked ?? '—' },
    { label: 'Papel resolvido', getter: r => r.resolved_role ?? '—' },
    { label: 'Grupo casado', getter: r => r.matched_group ?? '(default)' },
    { label: 'Domínio permitido', getter: r => String(r.result.preview.domain_allowed) },
    { label: 'Usuário existe', getter: r => String(r.result.preview.user_exists) },
    { label: 'JIT possível', getter: r => String(r.result.preview.would_jit_provision) },
    { label: 'Erros', getter: r => String(r.result.errors.length) },
    { label: 'Grupos recebidos', getter: r => r.result.preview.groups.join(', ') || '(nenhum)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparar simulações</DialogTitle>
          <DialogDescription>Diferenças destacadas entre as duas execuções selecionadas.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-3">
              {[a, b].map((r, i) => {
                const meta = OUTCOME_META[r.outcome];
                return (
                  <div key={r.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Run {String.fromCharCode(65 + i)}</span>
                      <Badge variant="outline" className={cn('text-[10px]', meta.className)}>
                        {meta.emoji} {meta.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                    {r.created_by_email && (
                      <p className="text-xs text-muted-foreground">por {r.created_by_email}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Campo</th>
                    <th className="text-left p-2 font-medium">Run A</th>
                    <th className="text-left p-2 font-medium">Run B</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(f => {
                    const va = f.getter(a);
                    const vb = f.getter(b);
                    const diff = va !== vb;
                    return (
                      <tr key={f.label} className={cn('border-t', diff && 'bg-warning/5')}>
                        <td className="p-2 font-medium">{f.label}</td>
                        <td className={cn('p-2 font-mono', diff && 'text-warning')}>{va}</td>
                        <td className={cn('p-2 font-mono', diff && 'text-warning')}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[a, b].map((r, i) => (
                <div key={r.id} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Input Run {String.fromCharCode(65 + i)}</p>
                  <pre className="text-[10px] font-mono bg-muted p-2 rounded-md overflow-auto max-h-60">
                    {JSON.stringify(r.input, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
