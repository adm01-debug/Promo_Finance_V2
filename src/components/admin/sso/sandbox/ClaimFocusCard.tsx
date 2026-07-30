import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FocusClaim, SimulationResult } from './types';

function formatRaw(v: unknown): string {
  if (v === null || v === undefined) return '(não encontrada)';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function ClaimFocusCard({ result, focus }: { result: SimulationResult; focus: FocusClaim }) {
  const cm = result.preview.claim_mapping_used ?? { email: 'email', full_name: 'name', groups: 'groups' };
  const cv = result.preview.claim_values ?? { email_raw: null, full_name_raw: null, groups_raw: null };
  const matchedGroup = result.preview.matched_group;
  const evaluated = result.preview.role_mappings_evaluated ?? [];
  const groupsThatMatchSomeRule = new Set(
    evaluated.filter(e => e.status === 'matched' || e.status === 'skipped').map(e => e.idp_group)
  );

  type Row = { key: FocusClaim; label: string; jwtKey: string; raw: unknown; normalized: string };
  const rows: Row[] = [
    { key: 'email', label: 'email', jwtKey: cm.email, raw: cv.email_raw, normalized: result.preview.email ?? '(vazio)' },
    { key: 'name', label: 'name', jwtKey: cm.full_name, raw: cv.full_name_raw, normalized: result.preview.full_name || '(vazio)' },
    { key: 'groups', label: 'groups', jwtKey: cm.groups, raw: cv.groups_raw, normalized: result.preview.groups.length ? result.preview.groups.join(', ') : '(nenhum)' },
    { key: 'domain', label: 'domain', jwtKey: '(derivado de email)', raw: result.preview.domain || null, normalized: result.preview.domain || '(vazio)' },
  ];

  const visible = focus === 'all' ? rows : rows.filter(r => r.key === focus);

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">
          Claim em foco: <span className="text-primary">{focus === 'all' ? 'Todos' : focus}</span>
        </p>
      </div>
      <div className="space-y-2">
        {visible.map(row => (
          <div key={row.key} className="rounded-md border bg-background p-2 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{row.label}</span>
              <Badge variant="outline" className="text-[10px]">JWT: {row.jwtKey}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">bruto:</span>{' '}
                <span className="font-mono break-all">{formatRaw(row.raw)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">normalizado:</span>{' '}
                <span className="font-mono break-all">{row.normalized}</span>
              </div>
            </div>
            {row.key === 'groups' && result.preview.groups.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {result.preview.groups.map(g => {
                  const isMatched = g === matchedGroup;
                  const couldMatch = groupsThatMatchSomeRule.has(g);
                  return (
                    <Badge
                      key={g}
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        isMatched && 'border-success/60 text-success bg-success/10',
                        !isMatched && couldMatch && 'border-secondary/60 text-secondary',
                      )}
                    >
                      {g}
                      {isMatched && ' ✓'}
                      {!isMatched && couldMatch && ' ○'}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
