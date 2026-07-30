import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Bug, RefreshCw, Search, Users } from 'lucide-react';
import {
  useFrontendErrorGroups,
  useFrontendErrorOccurrences,
  type ErrorWindow,
  type FrontendErrorGroup,
} from '@/hooks/useFrontendErrorLogs';
import { AlertasProativosErros } from '@/components/admin/AlertasProativosErros';

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

function severityBadge(sev: string) {
  if (sev === 'fatal') {
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Fatal</Badge>;
  }
  if (sev === 'error') return <Badge variant="destructive">Erro</Badge>;
  if (sev === 'warning') {
    return <Badge className="bg-warning/20 text-warning border-warning/30">Aviso</Badge>;
  }
  return <Badge variant="secondary">{sev}</Badge>;
}

export default function AdminErrosFrontend() {
  const [win, setWin] = useState<ErrorWindow>('7d');
  const [severity, setSeverity] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<FrontendErrorGroup | null>(null);

  const grupos = useFrontendErrorGroups(win, severity === 'todos' ? null : severity);
  const ocorrencias = useFrontendErrorOccurrences(selecionado?.assinatura ?? null, win);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = grupos.data ?? [];
    if (!termo) return base;
    return base.filter((g) => g.exemplo_mensagem.toLowerCase().includes(termo));
  }, [grupos.data, busca]);

  const totais = useMemo(() => {
    const base = grupos.data ?? [];
    return {
      grupos: base.length,
      ocorrencias: base.reduce((acc, g) => acc + Number(g.ocorrencias), 0),
      usuarios: base.reduce((acc, g) => acc + Number(g.usuarios_afetados), 0),
    };
  }, [grupos.data]);

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Bug className="h-6 w-6 text-primary" /> Erros do Frontend
          </h1>
          <p className="text-sm text-muted-foreground">
            Ocorrências agrupadas por assinatura, com UUIDs e números normalizados.
          </p>
        </div>
        <Button variant="outline" onClick={() => grupos.refetch()} disabled={grupos.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${grupos.isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Assinaturas distintas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{totais.grupos}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ocorrências</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{totais.ocorrencias}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> Usuários impactados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{totais.usuarios}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Agrupamento</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 md:w-64"
                placeholder="Filtrar por mensagem…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas severidades</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={win} onValueChange={(v) => setWin(v as ErrorWindow)}>
              <SelectTrigger className="md:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {grupos.isLoading && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={`sk-${i}`} className="h-14 w-full" />)}
            </div>
          )}

          {grupos.isError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Não foi possível carregar os erros. Verifique se seu usuário é administrador.
            </div>
          )}

          {!grupos.isLoading && !grupos.isError && linhas.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum erro registrado no período. Ótimo sinal.
            </p>
          )}

          {linhas.map((g) => (
            <button
              key={g.assinatura}
              type="button"
              onClick={() => setSelecionado(g)}
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{g.exemplo_mensagem}</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(g.primeira_ocorrencia)} → {fmt(g.ultima_ocorrencia)} · {g.urls_distintas} URL(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {severityBadge(g.severity)}
                <Badge variant="outline">{g.ocorrencias}x</Badge>
                <Badge variant="secondary">{g.usuarios_afetados} usuário(s)</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selecionado)} onOpenChange={(o) => !o && setSelecionado(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words text-base">
              {selecionado?.exemplo_mensagem}
            </DialogTitle>
            <DialogDescription>
              Ocorrências recentes desta assinatura no período selecionado.
            </DialogDescription>
          </DialogHeader>

          {ocorrencias.isLoading && <Skeleton className="h-32 w-full" />}
          {ocorrencias.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma ocorrência detalhada disponível.</p>
          )}
          <div className="space-y-3">
            {(ocorrencias.data ?? []).map((o) => (
              <div key={o.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {severityBadge(o.severity)}
                  <span>{fmt(o.created_at)}</span>
                  <span className="truncate">{o.url}</span>
                </div>
                {o.error_stack && (
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs text-muted-foreground">
                    {o.error_stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertasProativosErros />
    </div>
  );
}
