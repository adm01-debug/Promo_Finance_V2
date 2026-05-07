import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Plug, Search, 
  Filter, Activity, Zap, ShieldCheck, ArrowRight, ExternalLink,
  History, Eye, ShieldAlert, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVerificacaoIntegracoes, type StatusConsistencia } from '@/hooks/useVerificacaoIntegracoes';
import { formatCurrency } from '@/lib/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props { empresaId?: string; ano: number }

const statusBadge = (s: StatusConsistencia) => {
  switch (s) {
    case 'ok':
      return <Badge variant="outline" className="border-none bg-success/20 text-success font-black text-[10px] gap-1 px-3 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" />CONCILIADO</Badge>;
    case 'desbalanceado':
      return <Badge variant="outline" className="border-none bg-destructive/20 text-destructive font-black text-[10px] gap-1 px-3 py-1 rounded-full"><AlertTriangle className="h-3 w-3" />DIVERGENTE</Badge>;
    case 'sem_partidas':
      return <Badge variant="outline" className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-3 py-1 rounded-full"><ShieldAlert className="h-3 w-3" />SEM PARTIDAS</Badge>;
    case 'orfao':
      return <Badge variant="outline" className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-3 py-1 rounded-full"><History className="h-3 w-3" />ÓRFÃO</Badge>;
  }
};

function StatCard({ label, value, description, tone = 'default', icon: Icon, trend }: { label: string; value: number | string; description: string; tone?: 'default' | 'success' | 'destructive' | 'warning'; icon?: any; trend?: string }) {
  const toneClass = 
    tone === 'success' ? 'text-success bg-success/5 border-success/20 shadow-lg shadow-success/10' :
    tone === 'destructive' ? 'text-destructive bg-destructive/5 border-destructive/20 shadow-lg shadow-destructive/10' :
    tone === 'warning' ? 'text-warning bg-warning/5 border-warning/20 shadow-lg shadow-warning/10' :
    'text-foreground bg-white/5 border-white/10 shadow-2xl';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-[2.5rem] border p-8 backdrop-blur-3xl transition-all relative overflow-hidden group", toneClass)}
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        {Icon && <Icon className="h-24 w-24" />}
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-40">{label}</p>
          <div className="p-2 bg-white/5 rounded-xl">
            {Icon && <Icon className="h-4 w-4 opacity-60" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black tracking-tighter tabular-nums">{value}</p>
          {trend && <span className="text-[10px] font-bold opacity-40">{trend}</span>}
        </div>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-2">{description}</p>
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
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard 
          label="Total Auditado" 
          value={total.toLocaleString('pt-BR')} 
          description={`Volume de lançamentos em ${ano}`} 
          icon={Activity}
        />
        <StatCard 
          label="SLA de Integridade" 
          value={`${taxaOk}%`} 
          description={`${totalOk} registros conformes`}
          tone={taxaOk >= 95 ? "success" : "warning"}
          icon={ShieldCheck}
          trend="+2.4%"
        />
        <StatCard 
          label="Exposição ao Risco" 
          value={totalDivergentes} 
          description={totalDivergentes > 0 ? 'Divergências detectadas' : 'Risco mitigado'}
          tone={totalDivergentes > 0 ? "destructive" : "success"}
          icon={AlertTriangle}
          trend={totalDivergentes > 0 ? "⚠️" : "✓"}
        />
        <StatCard 
          label="Fluxo Conectado" 
          value={resumos.length} 
          description="Fontes de dados ativas"
          icon={Cpu}
          tone="default"
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
            <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-inner">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">Origem de Dados</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Registros</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Conformes</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Divergências</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Sem Partidas</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Montante</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Data Última</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest pr-8">Saúde Fiscal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {resumos.map((r, idx) => {
                      const taxa = r.total > 0 ? Math.round((r.ok / r.total) * 100) : 100;
                      const saudavel = taxa >= 95 && r.desbalanceados === 0;
                      return (
                        <motion.tr 
                          key={r.origem} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-white/5 hover:bg-white/5 transition-colors group/row"
                        >
                          <TableCell className="p-6">
                            <Badge variant="outline" className="capitalize border-none bg-primary/10 text-primary font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-2 w-fit">
                              <Zap className="h-3 w-3" />
                              {r.origem}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold tabular-nums">{r.total.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-success font-black tabular-nums">{r.ok.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className={cn("text-right font-mono text-xs tabular-nums", r.desbalanceados > 0 ? 'text-destructive font-black' : 'opacity-20')}>
                            {r.desbalanceados || '0'}
                          </TableCell>
                          <TableCell className={cn("text-right font-mono text-xs tabular-nums", r.sem_partidas > 0 ? 'text-warning font-black' : 'opacity-20')}>
                            {r.sem_partidas || '0'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-black text-foreground/80 tabular-nums">{formatCurrency(r.valor_total)}</TableCell>
                          <TableCell className="text-right text-[10px] font-black uppercase tracking-widest opacity-40">
                            {r.ultima_importacao ? format(new Date(r.ultima_importacao + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
                          </TableCell>
                          <TableCell className="pr-8">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-16">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${taxa}%` }}
                                  className={cn("h-full", saudavel ? "bg-success" : "bg-destructive")} 
                                />
                              </div>
                              <span className={cn("text-[10px] font-black tabular-nums", saudavel ? "text-success" : "text-destructive")}>{taxa}%</span>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
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
            <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-inner">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">ID / Ref</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Data Lanc.</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Origem</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Histórico Descritivo</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Débito</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Crédito</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Diferença</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Itens</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest pr-8">Auditoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filtrados.slice(0, 200).map((l, idx) => (
                      <motion.tr 
                        key={l.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.005 }}
                        className={cn(
                          "border-white/5 hover:bg-white/5 transition-colors group/row", 
                          l.status_consistencia !== 'ok' ? 'bg-destructive/[0.03]' : undefined
                        )}
                      >
                        <TableCell className="p-6 font-mono text-[11px] font-black text-primary/60">{l.numero_lancamento || '—'}</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          {format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize border-none bg-primary/10 text-primary font-black text-[10px] px-3 py-1 rounded-xl">
                            {l.origem}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs font-bold text-foreground/80" title={l.historico}>
                          {l.historico}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-black tabular-nums text-success">{formatCurrency(l.total_debito)}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-black tabular-nums text-destructive">{formatCurrency(l.total_credito)}</TableCell>
                        <TableCell className={cn("text-right font-mono text-xs font-black tabular-nums", l.diferenca > 0.01 ? "text-destructive" : "opacity-20")}>
                          {l.diferenca > 0 ? formatCurrency(l.diferenca) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-[10px] border-none bg-white/5 font-black px-2.5 rounded-lg">
                            {l.qtd_partidas}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8">
                          <div className="flex items-center gap-2">
                            {statusBadge(l.status_consistencia)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity">
                                    <ExternalLink className="h-4 w-4 opacity-40 hover:opacity-100" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest">Ver Lançamento Completo</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
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
