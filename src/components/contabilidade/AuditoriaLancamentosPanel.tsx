import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, History, Search, User, Clock, RefreshCw, FileSearch } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditoriaLancamentos, type AuditoriaLancamentoRow } from '@/hooks/useAuditoriaLancamentos';
import { AuditDiffView } from '@/components/audit/AuditDiffView';
import { formatDate } from '@/lib/formatters';

interface Props {
  empresaId?: string;
  ano?: number;
}

const operacaoConfig: Record<string, { label: string; color: string }> = {
  INSERT: { label: 'Criação', color: 'bg-success/10 text-success border-success/20' },
  UPDATE: { label: 'Edição', color: 'bg-accent/10 text-accent border-accent/20' },
  DELETE: { label: 'Estorno/Exclusão', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const tabelaLabels: Record<string, string> = {
  lancamentos_contabeis: 'Cabeçalho',
  partidas_contabeis: 'Partida (D/C)',
};

export function AuditoriaLancamentosPanel({ empresaId, ano }: Props) {
  const [operacao, setOperacao] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL');
  const [tabela, setTabela] = useState<'ALL' | 'lancamentos_contabeis' | 'partidas_contabeis'>('ALL');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, refetch, isFetching } = useAuditoriaLancamentos({
    empresaId,
    ano,
    operacao,
    tabela,
    search,
  });

  const stats = {
    total: logs.length,
    criacoes: logs.filter((l) => l.operacao === 'INSERT').length,
    edicoes: logs.filter((l) => l.operacao === 'UPDATE').length,
    estornos: logs.filter((l) => l.operacao === 'DELETE').length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Auditoria de Lançamentos
            </CardTitle>
            <CardDescription>
              Histórico completo de quem criou, editou ou estornou cada lançamento contábil e suas partidas.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <StatCard label="Total" value={stats.total} tone="default" />
          <StatCard label="Criações" value={stats.criacoes} tone="success" />
          <StatCard label="Edições" value={stats.edicoes} tone="accent" />
          <StatCard label="Estornos/Exclusões" value={stats.estornos} tone="destructive" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por histórico, nº do lançamento ou ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={operacao} onValueChange={(v) => setOperacao(v as typeof operacao)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as operações</SelectItem>
              <SelectItem value="INSERT">Apenas criações</SelectItem>
              <SelectItem value="UPDATE">Apenas edições</SelectItem>
              <SelectItem value="DELETE">Apenas estornos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tabela} onValueChange={(v) => setTabela(v as typeof tabela)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Cabeçalho + Partidas</SelectItem>
              <SelectItem value="lancamentos_contabeis">Apenas Cabeçalho</SelectItem>
              <SelectItem value="partidas_contabeis">Apenas Partidas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <FileSearch className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Nenhum registro de auditoria encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              As alterações futuras em lançamentos aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[160px]">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="w-[140px]">Operação</TableHead>
                  <TableHead className="w-[130px]">Tipo</TableHead>
                  <TableHead className="w-[80px]">Lanç. Nº</TableHead>
                  <TableHead>Histórico</TableHead>
                  <TableHead className="w-[80px] text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'default' | 'success' | 'accent' | 'destructive';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'accent'
        ? 'text-accent'
        : tone === 'destructive'
          ? 'text-destructive'
          : 'text-foreground';
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function AuditRow({ log }: { log: AuditoriaLancamentoRow }) {
  const cfg = operacaoConfig[log.operacao];
  return (
    <TableRow>
      <TableCell className="text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {formatDate(log.created_at)}
        </div>
        <span className="text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-[180px]">{log.usuario || 'Sistema'}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cfg?.color}>
          {cfg?.label || log.operacao}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{tabelaLabels[log.tabela] || log.tabela}</TableCell>
      <TableCell className="text-xs font-mono">{log.numero_lancamento ?? '—'}</TableCell>
      <TableCell className="text-sm max-w-[280px] truncate">{log.historico || '—'}</TableCell>
      <TableCell className="text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Detalhes da alteração
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Info label="Data/Hora" value={`${formatDate(log.created_at)} ${format(new Date(log.created_at), 'HH:mm:ss')}`} />
                  <Info label="Usuário" value={log.usuario || 'Sistema'} />
                  <Info label="Operação" value={cfg?.label || log.operacao} />
                  <Info label="Tipo" value={tabelaLabels[log.tabela] || log.tabela} />
                  {log.numero_lancamento != null && <Info label="Nº Lançamento" value={String(log.numero_lancamento)} />}
                  {log.data_lancamento && <Info label="Data lanç." value={formatDate(log.data_lancamento)} />}
                  {log.registro_id && <Info label="ID do registro" value={log.registro_id.slice(0, 13) + '…'} mono />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Comparação antes/depois</p>
                  <AuditDiffView old={log.dados_antigos} new={log.dados_novos} action={log.operacao} />
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
