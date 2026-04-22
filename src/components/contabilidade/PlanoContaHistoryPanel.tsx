// Timeline de auditoria do Plano de Contas. Mostra quem editou, importou CFC
// ou alterou mapeamentos DRE/Balanço, quando, e (quando aplicável) o diff
// dos campos alterados.
import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  Upload,
  GitMerge,
  Loader2,
  User,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PlanoContaAuditEntry } from '@/hooks/usePlanoContaHistory';

interface Props {
  entries: PlanoContaAuditEntry[];
  isLoading?: boolean;
  className?: string;
}

// Campos relevantes para mostrar no diff (ignora ruído como timestamps/IDs).
const CAMPOS_RELEVANTES = [
  'codigo',
  'nome',
  'descricao',
  'natureza',
  'tipo',
  'codigo_referencial',
  'centro_resultado',
  'parent_id',
  'ativo',
  'nivel',
] as const;

type ActionMeta = {
  label: string;
  Icon: typeof Plus;
  tone: string;
  bg: string;
  border: string;
};

function actionMeta(entry: PlanoContaAuditEntry): ActionMeta {
  if (entry.table_name === 'plano_contas_import_cfc') {
    return {
      label: 'Importação CFC',
      Icon: Upload,
      tone: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
    };
  }
  if (entry.table_name === 'plano_contas_mapeamento') {
    return {
      label: 'Mapeamento DRE/Balanço',
      Icon: GitMerge,
      tone: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
    };
  }
  switch (entry.action) {
    case 'INSERT':
      return {
        label: 'Conta criada',
        Icon: Plus,
        tone: 'text-success',
        bg: 'bg-success/10',
        border: 'border-success/30',
      };
    case 'DELETE':
      return {
        label: 'Conta removida',
        Icon: Trash2,
        tone: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
      };
    case 'UPDATE':
    default:
      return {
        label: 'Conta editada',
        Icon: Pencil,
        tone: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/30',
      };
  }
}

interface DiffField {
  campo: string;
  antes: unknown;
  depois: unknown;
}

function calcularDiff(entry: PlanoContaAuditEntry): DiffField[] {
  const o = entry.old_data || {};
  const n = entry.new_data || {};
  const out: DiffField[] = [];
  for (const campo of CAMPOS_RELEVANTES) {
    const a = (o as Record<string, unknown>)[campo];
    const b = (n as Record<string, unknown>)[campo];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ campo, antes: a, depois: b });
    }
  }
  return out;
}

function fmtValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return String(v);
}

export function PlanoContaHistoryPanel({ entries, isLoading, className }: Props) {
  const grouped = useMemo(() => {
    // Agrupa por dia para timeline mais legível.
    const map = new Map<string, PlanoContaAuditEntry[]>();
    for (const e of entries) {
      const key = format(new Date(e.created_at), 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [entries]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-primary" />
          Histórico de alterações
        </CardTitle>
        <CardDescription>
          Quem editou contas, importou códigos CFC ou alterou mapeamentos DRE/Balanço — e quando.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <ScrollArea className="h-[60vh] pr-3">
            <div className="space-y-6">
              {grouped.map(([dia, items]) => (
                <div key={dia}>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 sticky top-0 bg-card py-1 z-10">
                    {format(new Date(dia), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <ol className="space-y-2 ml-1 border-l border-border pl-4">
                    {items.map((entry) => {
                      const meta = actionMeta(entry);
                      const diff = calcularDiff(entry);
                      const Icon = meta.Icon;
                      return (
                        <li key={entry.id} className="relative">
                          <span
                            className={cn(
                              'absolute -left-[22px] top-1 h-4 w-4 rounded-full border flex items-center justify-center',
                              meta.bg,
                              meta.border,
                            )}
                          >
                            <Icon className={cn('h-2.5 w-2.5', meta.tone)} />
                          </span>
                          <div className={cn('rounded-md border p-3 text-xs', meta.border, 'bg-muted/30')}>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <Badge variant="outline" className={cn('text-[10px]', meta.tone, meta.border)}>
                                {meta.label}
                              </Badge>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                {entry.user_email || 'Sistema'}
                              </span>
                              <span className="text-muted-foreground ml-auto font-mono">
                                {format(new Date(entry.created_at), 'HH:mm:ss')}
                              </span>
                            </div>

                            {entry.details && (
                              <p className="text-muted-foreground mt-2 leading-relaxed">{entry.details}</p>
                            )}

                            {diff.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {diff.map((d) => (
                                  <li key={d.campo} className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                                    <span className="font-semibold text-foreground/80">{d.campo}:</span>
                                    <span className="line-through text-muted-foreground">{fmtValor(d.antes)}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-primary">{fmtValor(d.depois)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Para INSERT mostra o código/descrição cadastrados */}
                            {entry.action === 'INSERT' && entry.new_data && (
                              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                                <span className="text-foreground/80">
                                  {String((entry.new_data as Record<string, unknown>).codigo || '')}
                                </span>{' '}
                                — {String((entry.new_data as Record<string, unknown>).descricao || '')}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
