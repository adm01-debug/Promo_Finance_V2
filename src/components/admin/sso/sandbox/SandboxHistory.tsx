import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { History, Repeat, Eye, Trash2, GitCompare, Filter, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSSOProviders } from '@/hooks/useSSO';
import { useSSOSandboxRuns, useDeleteSSOSandboxRun, type SandboxRun } from '@/hooks/useSSOSandboxRuns';
import { OUTCOME_META, type SandboxOutcome } from './outcome';
import { SandboxRunDetailSheet } from './SandboxRunDetailSheet';
import { SandboxCompareDialog } from './SandboxCompareDialog';
import { toast } from 'sonner';

interface Props {
  onReplay: (run: SandboxRun) => void;
}

const OUTCOMES: Array<{ id: SandboxOutcome | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'bloqueado', label: 'Bloqueado' },
  { id: 'seria_jit', label: 'Seria JIT' },
  { id: 'usuario_existente', label: 'Existente' },
  { id: 'sem_email', label: 'Sem email' },
];

export function SandboxHistory({ onReplay }: Props) {
  const { data: providers = [] } = useSSOProviders();
  const [providerId, setProviderId] = useState<string>('');
  const [outcome, setOutcome] = useState<SandboxOutcome | 'all'>('all');
  const [emailQuery, setEmailQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailRun, setDetailRun] = useState<SandboxRun | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: runs = [], isLoading } = useSSOSandboxRuns({
    providerId: providerId || undefined,
    outcome,
    email: emailQuery || undefined,
  });
  const deleteMut = useDeleteSSOSandboxRun();

  const selectedRuns = useMemo(
    () => runs.filter(r => selected.includes(r.id)),
    [runs, selected]
  );

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected(prev => {
      if (checked) {
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      }
      return prev.filter(x => x !== id);
    });
  };

  const handleReplay = (run: SandboxRun) => {
    onReplay(run);
    toast.success('Entrada carregada', { description: 'Revise e clique em Simular.' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta simulação do histórico?')) return;
    try {
      await deleteMut.mutateAsync(id);
      setSelected(prev => prev.filter(x => x !== id));
      toast.success('Simulação removida');
    } catch (e) {
      toast.error('Erro ao remover', { description: e instanceof Error ? e.message : 'Erro' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Histórico de simulações</h3>
        <Badge variant="outline">{runs.length}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={emailQuery}
            onChange={e => setEmailQuery(e.target.value)}
            placeholder="Buscar por email..."
            className="h-9 pl-7 text-sm"
          />
        </div>
        <Select value={providerId || 'all'} onValueChange={v => setProviderId(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Todos os providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os providers</SelectItem>
            {providers.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {OUTCOMES.map(o => (
            <Button
              key={o.id}
              size="sm"
              variant={outcome === o.id ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => setOutcome(o.id)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        {selectedRuns.length === 2 && (
          <Button size="sm" className="ml-auto gap-2" onClick={() => setCompareOpen(true)}>
            <GitCompare className="h-4 w-4" /> Comparar (2)
          </Button>
        )}
        {selectedRuns.length > 0 && selectedRuns.length < 2 && (
          <Badge variant="outline" className="ml-auto">Selecione mais 1 para comparar</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Nenhuma simulação registrada com esses filtros.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => {
                const meta = OUTCOME_META[run.outcome];
                const isSel = selected.includes(run.id);
                return (
                  <TableRow key={run.id} className={cn(isSel && 'bg-muted/40')}>
                    <TableCell>
                      <Checkbox
                        checked={isSel}
                        onChange={(e) => toggleSelect(run.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(run.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs">{run.provider_nome ?? <span className="text-muted-foreground italic">manual</span>}</TableCell>
                    <TableCell className="text-xs font-mono">{run.email_masked ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', meta.className)}>
                        {meta.emoji} {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{run.resolved_role ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{run.matched_group ?? <span className="text-muted-foreground">default</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{run.created_by_email ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailRun(run)} title="Ver detalhes">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleReplay(run)} title="Reproduzir">
                          <Repeat className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(run.id)} title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SandboxRunDetailSheet
        run={detailRun}
        open={!!detailRun}
        onOpenChange={(o) => !o && setDetailRun(null)}
      />
      <SandboxCompareDialog
        runs={selectedRuns}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </div>
  );
}
