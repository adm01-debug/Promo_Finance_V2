import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, TrendingDown, CheckCircle2, Eye, CheckCheck, Calendar, Users, Loader2, RefreshCw, Sparkles, BellRing, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useAlertas, useMarcarAlertaComoLido, useMarcarTodosAlertasComoLidos, type PrioridadeAlerta, type Alerta } from '@/hooks/useAlertas';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AlertaKPICard, AlertaRow, AlertaEmptyState, prioridadeConfig, tipoConfig } from '@/components/alertas/AlertaComponents';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function Alertas() {
  const navigate = useNavigate();
  const { data: alertas = [], isLoading, refetch } = useAlertas();
  const marcarComoLido = useMarcarAlertaComoLido();
  const marcarTodosComoLidos = useMarcarTodosAlertasComoLidos();
  const [activeTab, setActiveTab] = useState('todos');

  const alertasNaoLidos = alertas.filter(a => !a.lido);
  const alertasPorTipo: Record<string, Alerta[]> = {
    todos: alertas,
    vencimento: alertas.filter(a => a.tipo === 'vencimento'),
    inadimplencia: alertas.filter(a => a.tipo === 'inadimplencia'),
    fluxo_caixa: alertas.filter(a => a.tipo === 'fluxo_caixa'),
  };

  const currentTabAlertas = useMemo(() => alertasPorTipo[activeTab] || [], [activeTab, alertas]);

  const { selectedCount, isProcessing, progress, isSelected, isAllSelected, selectAll, toggleSelect, clearSelection, executeBulkAction } = useBulkActions({
    items: currentTabAlertas, getItemId: (a) => a.id,
    successMessage: 'Alertas marcados como lidos', errorMessage: 'Erro ao marcar alertas',
  });

  const countByPriority = (priority: PrioridadeAlerta) => alertasNaoLidos.filter(a => a.prioridade === priority).length;
  const handleMarkAsRead = (id: string) => marcarComoLido.mutate(id);
  const handleMarkAllAsRead = () => marcarTodosComoLidos.mutate();
  const handleBulkMarkAsRead = () => { executeBulkAction(async (id) => { await marcarComoLido.mutateAsync(id); }, { showProgress: true }); };

  const handleNavigate = (alerta: Alerta) => {
    if (alerta.acao_url) { navigate(alerta.acao_url); }
    else if (alerta.entidade_tipo) {
      const routes: Record<string, string> = { conta_pagar: '/contas-pagar', conta_receber: '/contas-receber', cliente: '/clientes', fornecedor: '/fornecedores', boleto: '/boletos' };
      const route = routes[alerta.entidade_tipo];
      if (route) navigate(route);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2"><Skeleton className="h-8 w-72" /><Skeleton className="h-4 w-40" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-48" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  const urgentAlertas = alertasNaoLidos.filter(a => a.prioridade === 'critica' || a.prioridade === 'alta');

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-warning/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-warning/10 border border-primary/20 flex items-center justify-center" whileHover={{ rotate: 10, scale: 1.05 }}>
              <BellRing className="h-7 w-7 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Central de Alertas</h1>
              <div className="flex items-center gap-2 mt-1">
                {alertasNaoLidos.length > 0 ? (
                  <Badge variant="destructive" className="gap-1 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />{alertasNaoLidos.length} não {alertasNaoLidos.length === 1 ? 'lido' : 'lidos'}</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs text-success border-success/30"><CheckCircle2 className="h-3 w-3" />Tudo em dia</Badge>
                )}
                <span className="text-xs text-muted-foreground">{alertas.length} total</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm"><RefreshCw className="h-4 w-4" />Atualizar</Button>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={alertasNaoLidos.length === 0 || marcarTodosComoLidos.isPending} className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm">
              {marcarTodosComoLidos.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}Marcar todos como lidos
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
        {(['critica', 'alta', 'media', 'baixa'] as PrioridadeAlerta[]).map((prioridade) => (
          <AlertaKPICard key={prioridade} prioridade={prioridade} count={countByPriority(prioridade)} config={prioridadeConfig[prioridade]} />
        ))}
      </motion.div>

      {/* Urgent Actions Banner */}
      <AnimatePresence>
        {urgentAlertas.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-warning/30 bg-gradient-to-r from-warning/5 via-card to-destructive/5 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center"><Zap className="h-4 w-4 text-warning" /></div>
                  Ações Urgentes<Badge variant="destructive" className="ml-2">{urgentAlertas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {urgentAlertas.slice(0, 3).map((alerta) => {
                    const tipoInfo = tipoConfig[alerta.tipo] || tipoConfig.sistema;
                    const TipoIcon = tipoInfo.icon;
                    return (
                      <motion.div key={alerta.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 hover:border-warning/30 transition-all group" whileHover={{ x: 4 }}>
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", alerta.prioridade === 'critica' ? "bg-destructive/10" : "bg-warning/10")}>
                          <TipoIcon className={cn("h-4 w-4", tipoInfo.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{alerta.titulo}</p>
                          <p className="text-xs text-muted-foreground truncate">{alerta.mensagem}</p>
                        </div>
                        <Button size="sm" className="gap-1 opacity-70 group-hover:opacity-100 transition-opacity" onClick={() => handleNavigate(alerta)}>
                          Resolver<span className="h-3 w-3">→</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Alerts List */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <TabsList className="w-full sm:w-auto bg-muted/50 backdrop-blur-sm p-1">
              <TabsTrigger value="todos" className="gap-1.5 data-[state=active]:shadow-sm">
                <Bell className="h-4 w-4" />Todos
                {alertas.length > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">{alertas.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="vencimento" className="gap-1.5 data-[state=active]:shadow-sm"><Calendar className="h-4 w-4" />Vencimento</TabsTrigger>
              <TabsTrigger value="inadimplencia" className="gap-1.5 data-[state=active]:shadow-sm"><Users className="h-4 w-4" />Inadimplência</TabsTrigger>
              <TabsTrigger value="fluxo_caixa" className="gap-1.5 data-[state=active]:shadow-sm"><TrendingDown className="h-4 w-4" />Fluxo</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 px-1"><Checkbox checked={isAllSelected} onChange={selectAll} /><span className="text-xs text-muted-foreground">Selecionar todos</span></div>
          </div>

          {Object.entries(alertasPorTipo).map(([tipo, lista]) => (
            <TabsContent key={tipo} value={tipo} className="mt-0">
              <Card className="overflow-hidden border-border/50">
                {lista.length === 0 ? (
                  <AlertaEmptyState type={tipo === 'todos' ? 'all' : 'category'} />
                ) : (
                  <ScrollArea className="h-[550px]">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                      {lista.map((alerta) => (
                        <AlertaRow key={alerta.id} alerta={alerta} isSelected={isSelected(alerta.id)} onToggle={() => toggleSelect(alerta.id)} onMarkRead={() => handleMarkAsRead(alerta.id)} onNavigate={() => handleNavigate(alerta)} isPending={marcarComoLido.isPending} />
                      ))}
                    </motion.div>
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {alertas.length === 0 && (
        <motion.div className="text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Sparkles className="h-3 w-3" />Alertas são gerados automaticamente com base nas suas movimentações financeiras</p>
        </motion.div>
      )}

      <BulkActionsBar selectedCount={selectedCount} isProcessing={isProcessing} progress={progress} onClear={clearSelection}
        actions={[{ id: 'mark-read', label: 'Marcar como lidos', icon: <Eye className="h-4 w-4" />, onClick: handleBulkMarkAsRead }]}
      />
    </div>
  );
}
