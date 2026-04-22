import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, ShieldOff, Mail, AlertTriangle, Users } from 'lucide-react';
import type { BulkAggregate } from '@/lib/sso/sandbox-bulk-aggregator';
import { cn } from '@/lib/utils';

interface Props {
  aggregate: BulkAggregate;
}

const KPI_META = [
  { key: 'total', label: 'Total', icon: Users, className: 'text-foreground' },
  { key: 'seria_jit', label: 'Seriam criados', icon: UserPlus, className: 'text-secondary' },
  { key: 'usuario_existente', label: 'Já existem', icon: UserCheck, className: 'text-success' },
  { key: 'bloqueado', label: 'Bloqueados', icon: ShieldOff, className: 'text-destructive' },
  { key: 'sem_email', label: 'Sem email', icon: Mail, className: 'text-warning' },
  { key: 'erro_rede', label: 'Erros de rede', icon: AlertTriangle, className: 'text-destructive' },
] as const;

export function SandboxBulkSummary({ aggregate }: Props) {
  const maxReason = Math.max(1, ...aggregate.byBlockReason.map(r => r.count));
  const maxRole = Math.max(1, ...aggregate.byRole.map(r => r.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_META.map(meta => {
          const value = meta.key === 'total' ? aggregate.total : aggregate.counts[meta.key as keyof typeof aggregate.counts] ?? 0;
          const Icon = meta.icon;
          return (
            <Card key={meta.key}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{meta.label}</p>
                  <Icon className={cn('h-4 w-4', meta.className)} />
                </div>
                <p className={cn('text-2xl font-bold mt-1', meta.className)}>{value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Motivos de falha / bloqueio</h4>
              <Badge variant="outline" className="text-[10px]">{aggregate.byBlockReason.length}</Badge>
            </div>
            {aggregate.byBlockReason.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum bloqueio registrado.</p>
            ) : (
              <ul className="space-y-2">
                {aggregate.byBlockReason.map(r => (
                  <li key={r.reason} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2" title={r.reason}>{r.reason}</span>
                      <span className="font-mono text-muted-foreground">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive/60"
                        style={{ width: `${(r.count / maxReason) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Papéis resolvidos</h4>
              <Badge variant="outline" className="text-[10px]">{aggregate.byRole.length}</Badge>
            </div>
            {aggregate.byRole.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum papel resolvido.</p>
            ) : (
              <ul className="space-y-2">
                {aggregate.byRole.map(r => (
                  <li key={r.role} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono">{r.role}</span>
                      <span className="font-mono text-muted-foreground">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60"
                        style={{ width: `${(r.count / maxRole) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {aggregate.groupCoverage.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Cobertura de regras</h4>
              <Badge variant="outline" className="text-[10px]">{aggregate.groupCoverage.length} regras</Badge>
            </div>
            <ul className="space-y-1">
              {aggregate.groupCoverage.map(g => (
                <li
                  key={`${g.idp_group}-${g.app_role}`}
                  className={cn(
                    'flex items-center justify-between rounded-md border px-2 py-1.5 text-xs',
                    g.matched_count === 0 && 'border-warning/40 bg-warning/5'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono truncate">{g.idp_group}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{g.app_role}</span>
                  </div>
                  {g.matched_count === 0 ? (
                    <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">regra morta</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-success/40 text-success">{g.matched_count} casos</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
