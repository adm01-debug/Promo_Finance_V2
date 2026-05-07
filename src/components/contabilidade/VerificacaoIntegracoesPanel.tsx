import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Plug, Search, Filter, Activity, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVerificacaoIntegracoes, type StatusConsistencia } from '@/hooks/useVerificacaoIntegracoes';
import { formatCurrency } from '@/lib/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props { empresaId?: string; ano: number }

const statusBadge = (s: StatusConsistencia) => {
  switch (s) {
    case 'ok':
      return <Badge variant="outline" className="border-none bg-success/20 text-success font-black text-[10px] gap-1 px-2 rounded-full"><CheckCircle2 className="h-3 w-3" />D=C</Badge>;
    case 'desbalanceado':
      return <Badge variant="outline" className="border-none bg-destructive/20 text-destructive font-black text-[10px] gap-1 px-2 rounded-full"><AlertTriangle className="h-3 w-3" />Divergência</Badge>;
    case 'sem_partidas':
      return <Badge variant="outline" className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-2 rounded-full"><XCircle className="h-3 w-3" />Sem partidas</Badge>;
    case 'orfao':
      return <Badge variant="outline" className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-2 rounded-full"><XCircle className="h-3 w-3" />Órfão</Badge>;
  }
};

function StatCard({ label, value, description, tone = 'default', icon: Icon }: { label: string; value: number | string; description: string; tone?: 'default' | 'success' | 'destructive' | 'warning'; icon?: any }) {
  const toneClass = 
    tone === 'success' ? 'text-success bg-success/10 border-success/20 shadow-success/10' :
    tone === 'destructive' ? 'text-destructive bg-destructive/10 border-destructive/20 shadow-destructive/10' :
    tone === 'warning' ? 'text-warning bg-warning/10 border-warning/20 shadow-warning/10' :
    'text-foreground bg-white/5 border-white/10';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn("rounded-[2rem] border p-6 shadow-2xl backdrop-blur-md transition-all relative group", toneClass)}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</p>
          {Icon && <Icon className="h-4 w-4 opacity-40 group-hover:scale-110 transition-transform" />}
        </div>
        <p className="text-3xl font-black tracking-tighter tabular-nums mb-1">{value}</p>
        <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">{description}</p>
      </div>
    </motion.div>
  );
}

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
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-4 text-2xl font-black tracking-tight">
            <div className="p-3.5 bg-primary/20 rounded-2xl shadow-xl transform group-hover:scale-110 transition-all duration-500">
              <Plug className="h-8 w-8 text-primary" />
            </div>
            Verificação de Integrações
          </CardTitle>
          <CardDescription className="text-sm font-medium opacity-60">Selecione uma empresa para auditar lançamentos importados em {ano}.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo global */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Importado" value={total} description={`lançamentos em ${ano}`} />
        <StatCard 
          label="Consistentes" 
          value={totalOk} 
          description={`${taxaOk}% de integridade`}
          tone="success"
          icon={ShieldCheck}
        />
        <StatCard 
          label="Com Divergência" 
          value={totalDivergentes} 
          description={totalDivergentes > 0 ? 'Requerem correção' : 'Tudo balanceado'}
          tone={totalDivergentes > 0 ? "destructive" : "default"}
          icon={AlertTriangle}
        />
        <StatCard 
          label="Origens Ativas" 
          value={resumos.length} 
          description="Integrações conectadas"
          icon={Zap}
        />
      </div>

      {/* Resumo por origem */}
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl shadow-xl">
                <Plug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Status por Integração</CardTitle>
                <CardDescription className="text-xs font-medium opacity-60">Saúde dos lançamentos importados de cada fonte</CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: ['verificacao-integracoes', empresaId, ano] })}
              disabled={isFetching}
              className="gap-2 rounded-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:translate-y-[-2px]"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Reanalisar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground animate-pulse">
              <RefreshCw className="h-6 w-6 animate-spin mr-3" /> Analisando integridade...
            </div>
          ) : resumos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-[1.5rem] bg-white/[0.02]">
              <Activity className="h-10 w-10 opacity-20 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhum lançamento importado</p>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/5 overflow-hidden bg-white/[0.01]">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Origem</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">D=C</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Divergentes</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Sem partidas</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Volume</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Última Ref</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Saúde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumos.map((r, idx) => {
                    const taxa = r.total > 0 ? Math.round((r.ok / r.total) * 100) : 100;
                    const saudavel = taxa >= 95 && r.desbalanceados === 0;
                    return (
                      <TableRow key={r.origem} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell><Badge variant="outline" className="capitalize border-none bg-primary/10 text-primary font-black text-[10px] px-2.5 rounded-lg">{r.origem}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">{r.total}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-success font-bold">{r.ok}</TableCell>
                        <TableCell className={cn("text-right font-mono text-xs", r.desbalanceados > 0 ? 'text-destructive font-black' : 'opacity-40')}>{r.desbalanceados || '—'}</TableCell>
                        <TableCell className={cn("text-right font-mono text-xs", r.sem_partidas > 0 ? 'text-warning font-black' : 'opacity-40')}>{r.sem_partidas || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground/80">{formatCurrency(r.valor_total)}</TableCell>
                        <TableCell className="text-right text-[10px] font-black uppercase tracking-widest opacity-40">
                          {r.ultima_importacao ? format(new Date(r.ultima_importacao + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          {saudavel ? (
                            <Badge variant="outline" className="border-none bg-success/20 text-success gap-1 font-black text-[10px] px-2 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />{taxa}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-none bg-destructive/20 text-destructive gap-1 font-black text-[10px] px-2 rounded-full">
                              <AlertTriangle className="h-3 w-3" />{taxa}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista detalhada com filtros */}
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardHeader className="p-8 pb-4 relative z-10">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            Lançamentos Importados
          </CardTitle>
          <CardDescription className="text-xs font-medium opacity-60">Auditoria detalhada com débito, crédito e diferença por lançamento</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 relative z-10 space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[280px] group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
              <Input 
                placeholder="Buscar histórico, nº ou ref..." 
                value={busca} 
                onChange={e => setBusca(e.target.value)} 
                className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl font-bold transition-all focus:ring-primary/20" 
              />
            </div>
            <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
              <SelectTrigger className="w-[200px] h-12 rounded-2xl border-white/5 bg-white/5 font-bold"><Filter className="h-4 w-4 mr-2 opacity-50" /><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <SelectItem value="todas">Todas as origens</SelectItem>
                {origens.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFiltro} onValueChange={v => setStatusFiltro(v as 'todos' | StatusConsistencia)}>
              <SelectTrigger className="w-[220px] h-12 rounded-2xl border-white/5 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ok">Consistentes (D=C)</SelectItem>
                <SelectItem value="desbalanceado">Desbalanceados</SelectItem>
                <SelectItem value="sem_partidas">Sem partidas</SelectItem>
                <SelectItem value="orfao">Órfãos</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
              {filtrados.length} / {lancs.length} registros
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum lançamento encontrado com os filtros aplicados.</p>
          ) : (
            <div className="rounded-[1.5rem] border border-white/5 overflow-hidden bg-white/[0.01]">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Nº</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Origem</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Histórico</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Débito</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Crédito</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Diferença</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Partidas</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Consistência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filtrados.slice(0, 200).map((l, idx) => (
                      <motion.tr 
                        key={l.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.01 }}
                        className={cn("border-white/5 hover:bg-white/5 transition-colors", l.status_consistencia !== 'ok' ? 'bg-destructive/5' : undefined)}
                      >
                        <TableCell className="font-mono text-xs font-bold opacity-60">{l.numero_lancamento}</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-widest opacity-60">{format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize border-none bg-primary/10 text-primary font-black text-[10px] px-2 rounded-lg">{l.origem}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate text-xs font-medium">{l.historico}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(l.total_debito)}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(l.total_credito)}</TableCell>
                        <TableCell className={cn("text-right font-mono text-xs font-black", l.diferenca > 0.01 ? 'text-destructive' : 'opacity-20')}>
                          {l.diferenca > 0.01 ? formatCurrency(l.diferenca) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold opacity-60">{l.qtd_partidas}</TableCell>
                        <TableCell>{statusBadge(l.status_consistencia)}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
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
