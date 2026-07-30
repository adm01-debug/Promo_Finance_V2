import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OUTCOME_META } from './outcome';
import type { SandboxRun } from '@/hooks/useSSOSandboxRuns';

interface Props {
  run: SandboxRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SandboxRunDetailSheet({ run, open, onOpenChange }: Props) {
  if (!run) return null;
  const meta = OUTCOME_META[run.outcome];
  const evaluated = run.result.preview.role_mappings_evaluated ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Detalhes da simulação
            <Badge variant="outline" className={cn('text-[10px]', meta.className)}>
              {meta.emoji} {meta.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {format(new Date(run.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            {run.created_by_email && ` · por ${run.created_by_email}`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="max-h-[70vh] mt-2">
          <div className="space-y-4 pr-2">
            <Section title="Resumo">
              <Row label="Provider" value={run.provider_nome ?? '(manual)'} />
              <Row label="Email" value={run.email_masked ?? '—'} />
              <Row label="Papel resolvido" value={run.resolved_role ?? '—'} />
              <Row label="Grupo casado" value={run.matched_group ?? 'fallback default_role'} />
              <Row label="Domínio permitido" value={String(run.result.preview.domain_allowed)} />
            </Section>

            {evaluated.length > 0 && (
              <Section title={`Role mappings avaliados (${evaluated.length})`}>
                <ul className="space-y-1 text-xs">
                  {evaluated.map(m => (
                    <li
                      key={`${m.ordem}-${m.idp_group}`}
                      className={cn(
                        'flex items-center justify-between rounded-md border px-2 py-1.5',
                        m.status === 'matched' && 'border-success/40 bg-success/5',
                      )}
                    >
                      <span className="font-mono">
                        #{m.ordem + 1} {m.idp_group} → {m.app_role}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Erros">
              {run.result.errors.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum erro.</p>
              ) : (
                <ul className="list-disc pl-4 text-xs text-destructive space-y-1">
                  {run.result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </Section>

            <Section title="Input (JSON)">
              <pre className="text-[11px] font-mono bg-muted p-2 rounded-md overflow-auto max-h-60">
                {JSON.stringify(run.input, null, 2)}
              </pre>
            </Section>

            <Section title="Resultado completo (JSON)">
              <pre className="text-[11px] font-mono bg-muted p-2 rounded-md overflow-auto max-h-60">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            </Section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
