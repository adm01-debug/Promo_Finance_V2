import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsistencyIssue, Severity, AutoFix } from '@/lib/sso/consistency';

interface Props {
  issues: ConsistencyIssue[];
  errors: ConsistencyIssue[];
  warnings: ConsistencyIssue[];
  infos: ConsistencyIssue[];
  onAutofix?: (patch: AutoFix['patch']) => void;
  className?: string;
}

type Filter = 'all' | Severity;

const FILTER_CHIPS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'error', label: 'Erros' },
  { id: 'warning', label: 'Avisos' },
  { id: 'info', label: 'Infos' },
];

const SEVERITY_META: Record<Severity, { icon: typeof AlertCircle; className: string; label: string }> = {
  error: { icon: AlertCircle, className: 'text-destructive', label: 'Erro' },
  warning: { icon: AlertTriangle, className: 'text-warning', label: 'Aviso' },
  info: { icon: Info, className: 'text-primary', label: 'Info' },
};

const SCOPE_LABEL: Record<string, string> = {
  claim_mapping: 'Claim mapping',
  allowed_domains: 'Domínios permitidos',
  role_mappings: 'Mapeamento de papéis',
  default_role: 'Papel padrão',
  global: 'Configuração geral',
};

export function SSOConsistencyPanel({ issues, errors, warnings, infos, onAutofix, className }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter((i) => i.severity === filter);
  }, [issues, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ConsistencyIssue[]>();
    filtered.forEach((i) => {
      const arr = map.get(i.scope) ?? [];
      arr.push(i);
      map.set(i.scope, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const dominantClass = errors.length
    ? 'border-destructive/40'
    : warnings.length
      ? 'border-warning/40'
      : 'border-success/40';

  return (
    <Card className={cn(dominantClass, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Consistência da configuração
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={cn('gap-1', errors.length ? 'border-destructive/40 text-destructive' : 'text-muted-foreground')}>
              <AlertCircle className="h-3 w-3" />{errors.length} erros
            </Badge>
            <Badge variant="outline" className={cn('gap-1', warnings.length ? 'border-warning/40 text-warning' : 'text-muted-foreground')}>
              <AlertTriangle className="h-3 w-3" />{warnings.length} avisos
            </Badge>
            <Badge variant="outline" className={cn('gap-1', infos.length ? 'border-primary/40 text-primary' : 'text-muted-foreground')}>
              <Info className="h-3 w-3" />{infos.length} infos
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Configuração consistente — nenhum conflito detectado.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              {FILTER_CHIPS.map((chip) => (
                <Button
                  key={chip.id}
                  size="sm"
                  variant={filter === chip.id ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setFilter(chip.id)}
                >
                  {chip.label}
                </Button>
              ))}
            </div>

            {grouped.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sem itens neste filtro.</p>
            ) : (
              grouped.map(([scope, items]) => (
                <div key={scope} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {SCOPE_LABEL[scope] ?? scope}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((issue) => {
                      const meta = SEVERITY_META[issue.severity];
                      const Icon = meta.icon;
                      return (
                        <li
                          key={`${issue.id}-${issue.field ?? ''}`}
                          className="rounded-md border bg-background/50 p-2.5 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', meta.className)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-medium">{issue.message}</span>
                                {issue.field && (
                                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                    {issue.field}
                                  </code>
                                )}
                              </div>
                              {issue.hint && (
                                <p className="text-xs text-muted-foreground mt-0.5">{issue.hint}</p>
                              )}
                              {issue.autofix && onAutofix && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 mt-2 text-xs gap-1.5"
                                  onClick={() => onAutofix(issue.autofix!.patch)}
                                >
                                  <Wrench className="h-3 w-3" />
                                  {issue.autofix.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
