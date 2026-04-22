import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ExternalLink } from 'lucide-react';
import type { BulkResult, BulkOutcome } from '@/lib/sso/sandbox-bulk-runner';
import { cn } from '@/lib/utils';

interface Props {
  results: BulkResult[];
  onOpenInSimulator: (r: BulkResult) => void;
}

const OUTCOME_META: Record<BulkOutcome, { label: string; className: string }> = {
  seria_jit: { label: 'Seria JIT', className: 'border-secondary/40 text-secondary bg-secondary/5' },
  usuario_existente: { label: 'Existe', className: 'border-success/40 text-success bg-success/5' },
  bloqueado: { label: 'Bloqueado', className: 'border-destructive/40 text-destructive bg-destructive/5' },
  sem_email: { label: 'Sem email', className: 'border-warning/40 text-warning bg-warning/5' },
  erro_rede: { label: 'Erro rede', className: 'border-destructive/40 text-destructive bg-destructive/5' },
};

const FILTER_CHIPS: Array<{ id: BulkOutcome | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'seria_jit', label: 'Seria JIT' },
  { id: 'usuario_existente', label: 'Existe' },
  { id: 'bloqueado', label: 'Bloqueado' },
  { id: 'sem_email', label: 'Sem email' },
  { id: 'erro_rede', label: 'Erro rede' },
];

export function SandboxBulkTable({ results, onOpenInSimulator }: Props) {
  const [filter, setFilter] = useState<BulkOutcome | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (filter !== 'all' && r.outcome !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        const email = (r.result?.preview.email ?? String(r.claims.email ?? '')).toLowerCase();
        const domain = (r.result?.preview.domain ?? '').toLowerCase();
        if (!email.includes(s) && !domain.includes(s)) return false;
      }
      return true;
    });
  }, [results, filter, search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {FILTER_CHIPS.map(c => (
            <Button
              key={c.id}
              size="sm"
              variant={filter === c.id ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar email ou domínio..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Badge variant="outline" className="text-[10px]">
          {filtered.length} de {results.length}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Grupos</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Grupo casado</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground italic py-6">
                  Nenhum resultado para os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => {
                const p = r.result?.preview;
                const meta = OUTCOME_META[r.outcome];
                return (
                  <TableRow key={r.row}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.row}</TableCell>
                    <TableCell className="font-mono text-xs">{p?.email ?? String(r.claims.email ?? '—')}</TableCell>
                    <TableCell className="font-mono text-xs">{p?.domain ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      {(p?.groups ?? []).length === 0 ? (
                        <span className="text-muted-foreground italic">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(p?.groups ?? []).slice(0, 3).map(g => (
                            <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                          ))}
                          {(p?.groups ?? []).length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{(p?.groups ?? []).length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p?.resolved_role ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p?.matched_group ?? <span className="text-muted-foreground italic">default</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', meta.className)}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={r.reason ?? ''}>
                      {r.reason ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onOpenInSimulator(r)}
                        title="Abrir no Simular"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
