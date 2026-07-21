import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Filter, Search, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_CHIPS, type MappingFilter, type RoleMappingEval, type SimulationResult } from './types';

function RuleStatusBadge({ status }: { status: RoleMappingEval['status'] }) {
  if (status === 'matched') {
    return <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1"><CheckCircle2 className="h-3 w-3" />aplicada</Badge>;
  }
  if (status === 'skipped') {
    return <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">○ ignorada</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1"><XCircle className="h-3 w-3" />sem match</Badge>;
}

export function RulesAppliedCard({
  result,
  filter,
  setFilter,
  search,
  setSearch,
  filtered,
}: {
  result: SimulationResult;
  filter: MappingFilter;
  setFilter: (f: MappingFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  filtered: RoleMappingEval[];
}) {
  const cm = result.preview.claim_mapping_used;
  const cv = result.preview.claim_values;
  const evaluated = result.preview.role_mappings_evaluated ?? [];
  const defaultRoleUsed = result.preview.default_role_used;
  const defaultRole = result.preview.default_role ?? result.preview.resolved_role;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Regras aplicadas</p>
      </div>

      {cm && cv && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Claim mapping</p>
          <div className="rounded-md border overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Campo</th>
                  <th className="text-left p-2 font-medium">Claim no JWT</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { field: 'email', jwtKey: cm.email, raw: cv.email_raw },
                  { field: 'full_name', jwtKey: cm.full_name, raw: cv.full_name_raw },
                  { field: 'groups', jwtKey: cm.groups, raw: cv.groups_raw },
                ] as const).map(r => {
                  const has = r.raw !== null && r.raw !== undefined && r.raw !== '';
                  return (
                    <tr key={r.field} className="border-t">
                      <td className="p-2 font-mono">{r.field}</td>
                      <td className="p-2 font-mono">{r.jwtKey}</td>
                      <td className="p-2">
                        {has ? (
                          <Badge variant="outline" className="text-[10px] border-success/40 text-success">aplicado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">vazio</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Role mappings ({evaluated.length})</p>
          {defaultRoleUsed && (
            <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
              fallback default_role: {defaultRole}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {FILTER_CHIPS.map(c => (
              <Button
                key={c.id}
                size="sm"
                variant={filter === c.id ? 'default' : 'outline'}
                className="h-6 px-2 text-[11px]"
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar grupo IdP..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {evaluated.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum role mapping configurado.</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma regra para os filtros atuais.</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map(m => (
              <li
                key={`${m.ordem}-${m.idp_group}`}
                className={cn(
                  'flex items-center justify-between rounded-md border px-2 py-1.5 text-xs',
                  m.status === 'matched' && 'border-success/40 bg-success/5',
                  m.status === 'skipped' && 'bg-muted/30',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground">#{m.ordem + 1}</span>
                  <span className="font-mono truncate">{m.idp_group}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{m.app_role}</span>
                </div>
                <RuleStatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
