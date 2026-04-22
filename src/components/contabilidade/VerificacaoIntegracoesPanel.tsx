import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Plug, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVerificacaoIntegracoes, type StatusConsistencia } from '@/hooks/useVerificacaoIntegracoes';
import { formatCurrency } from '@/lib/formatters';
import { useQueryClient } from '@tanstack/react-query';

interface Props { empresaId?: string; ano: number }

const statusBadge = (s: StatusConsistencia) => {
  switch (s) {
    case 'ok':
      return <Badge variant="outline" className="border-success/40 bg-success/10 text-success gap-1"><CheckCircle2 className="h-3 w-3" />D=C</Badge>;
    case 'desbalanceado':
      return <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive gap-1"><AlertTriangle className="h-3 w-3" />Divergência</Badge>;
    case 'sem_partidas':
      return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning gap-1"><XCircle className="h-3 w-3" />Sem partidas</Badge>;
    case 'orfao':
      return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning gap-1"><XCircle className="h-3 w-3" />Órfão</Badge>;
  }
};

export function VerificacaoIntegracoesPanel({ empresaId, ano }: Props) {
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useVerificacaoIntegracoes(empresaId, ano);
  const [busca, setBusca] = useState('');
  const [origemFiltro, setOrigemFiltro] = useState<string>('todas');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | StatusConsistencia>('todos');

  const lancs = data?.lancamentos ?? [];
  const resumos = data?.resumos ?? [];

  const origens = useMemo(() => Array.from(new Set(lancs.map(l => l.origem))).sort(), [lancs]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lancs.filter(l => {
      if (origemFiltro !== 'todas' && l.origem !== origemFiltro) return false;
      if (statusFiltro !== 'todos' && l.status_consistencia !== statusFiltro) return false;
      if (termo) {
        const hay = `${l.historico} ${l.numero_lancamento} ${l.origem_id ?? ''}`.toLowerCase();
        if (!hay.includes(termo)) return false;
      }
      return true;
    });
  }, [lancs, busca, origemFiltro, statusFiltro]);

  const total = data?.total ?? 0;
  const totalOk = data?.totalOk ?? 0;
  const totalDivergentes = data?.totalDivergentes ?? 0;
  const taxaOk = total > 0 ? Math.round((totalOk / total) * 100) : 100;

  if (!empresaId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5 text-primary" />Verificação de Integrações</CardTitle>
          <CardDescription>Selecione uma empresa para auditar lançamentos importados.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo global */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total importado</CardDescription><CardTitle className="text-2xl">{total}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">lançamentos no ano de {ano}</CardContent>
        </Card>
        <Card className="border-success/30">
          <CardHeader className="pb-2"><CardDescription className="text-success">Consistentes (D=C)</CardDescription><CardTitle className="text-2xl text-success">{totalOk}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{taxaOk}% do total</CardContent>
        </Card>
        <Card className={totalDivergentes > 0 ? 'border-destructive/40' : ''}>
          <CardHeader className="pb-2"><CardDescription className={totalDivergentes > 0 ? 'text-destructive' : ''}>Com divergência</CardDescription><CardTitle className={`text-2xl ${totalDivergentes > 0 ? 'text-destructive' : ''}`}>{totalDivergentes}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{totalDivergentes > 0 ? 'requerem correção' : 'tudo balanceado'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Origens ativas</CardDescription><CardTitle className="text-2xl">{resumos.length}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">integrações com lançamentos</CardContent>
        </Card>
      </div>

      {/* Resumo por origem */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5 text-primary" />Status por Integração</CardTitle>
              <CardDescription>Saúde dos lançamentos importados de cada fonte (Bitrix24, Bling, Asaas, etc.)</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: ['verificacao-integracoes', empresaId, ano] })}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Reanalisar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Analisando...</p>
          ) : resumos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento importado em {ano}. Lançamentos manuais não aparecem aqui.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">D=C</TableHead>
                  <TableHead className="text-right">Divergentes</TableHead>
                  <TableHead className="text-right">Sem partidas</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Última importação</TableHead>
                  <TableHead>Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumos.map(r => {
                  const taxa = r.total > 0 ? Math.round((r.ok / r.total) * 100) : 100;
                  const saudavel = taxa >= 95 && r.desbalanceados === 0;
                  return (
                    <TableRow key={r.origem}>
                      <TableCell><Badge variant="outline" className="capitalize">{r.origem}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{r.total}</TableCell>
                      <TableCell className="text-right font-mono text-success">{r.ok}</TableCell>
                      <TableCell className={`text-right font-mono ${r.desbalanceados > 0 ? 'text-destructive font-semibold' : ''}`}>{r.desbalanceados}</TableCell>
                      <TableCell className={`text-right font-mono ${r.sem_partidas > 0 ? 'text-warning' : ''}`}>{r.sem_partidas}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.valor_total)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {r.ultima_importacao ? format(new Date(r.ultima_importacao + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        {saudavel ? (
                          <Badge variant="outline" className="border-success/40 bg-success/10 text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" />{taxa}% OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive gap-1">
                            <AlertTriangle className="h-3 w-3" />{taxa}% OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lista detalhada com filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Importados</CardTitle>
          <CardDescription>Auditoria detalhada com débito, crédito e diferença por lançamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar histórico, nº ou ref..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
            </div>
            <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
              <SelectTrigger className="w-[180px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as origens</SelectItem>
                {origens.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFiltro} onValueChange={v => setStatusFiltro(v as 'todos' | StatusConsistencia)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ok">D=C (consistentes)</SelectItem>
                <SelectItem value="desbalanceado">Desbalanceados</SelectItem>
                <SelectItem value="sem_partidas">Sem partidas</SelectItem>
                <SelectItem value="orfao">Órfãos</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">
              {filtrados.length} de {lancs.length}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum lançamento encontrado com os filtros aplicados.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead className="text-right">Partidas</TableHead>
                    <TableHead>Consistência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.slice(0, 200).map(l => (
                    <TableRow key={l.id} className={l.status_consistencia !== 'ok' ? 'bg-destructive/5' : undefined}>
                      <TableCell className="font-mono text-xs">{l.numero_lancamento}</TableCell>
                      <TableCell className="text-xs">{format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{l.origem}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-xs">{l.historico}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(l.total_debito)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(l.total_credito)}</TableCell>
                      <TableCell className={`text-right font-mono text-xs ${l.diferenca > 0.01 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {l.diferenca > 0.01 ? formatCurrency(l.diferenca) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.qtd_partidas}</TableCell>
                      <TableCell>{statusBadge(l.status_consistencia)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtrados.length > 200 && <p className="text-xs text-muted-foreground mt-2">Exibindo 200 de {filtrados.length}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
