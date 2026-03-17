import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  Eye,
  CheckCheck,
  XCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  BellRing,
  Filter,
  Zap,
  Activity,
  BellOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { useBulkActions } from '@/hooks/useBulkActions';
import { 
  useAlertas, 
  useMarcarAlertaComoLido, 
  useMarcarTodosAlertasComoLidos,
  type PrioridadeAlerta,
  type Alerta
} from '@/hooks/useAlertas';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Animation Variants ───────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

// ─── Config Maps ──────────────────────────────────────────
const prioridadeConfig: Record<PrioridadeAlerta, { 
  label: string; color: string; bgColor: string; borderColor: string; 
  glowColor: string; icon: typeof AlertCircle; gradient: string;
}> = {
  critica: { 
    label: 'Crítica', color: 'text-destructive', bgColor: 'bg-destructive/10', 
    borderColor: 'border-destructive/30', glowColor: 'shadow-destructive/20',
    icon: XCircle, gradient: 'from-destructive/20 to-destructive/5'
  },
  alta: { 
    label: 'Alta', color: 'text-warning', bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30', glowColor: 'shadow-warning/20',
    icon: AlertTriangle, gradient: 'from-warning/20 to-warning/5'
  },
  media: { 
    label: 'Média', color: 'text-primary', bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30', glowColor: 'shadow-primary/20',
    icon: AlertCircle, gradient: 'from-primary/20 to-primary/5'
  },
  baixa: { 
    label: 'Baixa', color: 'text-muted-foreground', bgColor: 'bg-muted',
    borderColor: 'border-border', glowColor: 'shadow-muted/20',
    icon: Info, gradient: 'from-muted to-muted/50'
  }
};

const tipoConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  vencimento: { label: 'Vencimento', icon: Calendar, color: 'text-warning' },
  fluxo_caixa: { label: 'Fluxo de Caixa', icon: TrendingDown, color: 'text-destructive' },
  inadimplencia: { label: 'Inadimplência', icon: Users, color: 'text-accent-foreground' },
  conciliacao: { label: 'Conciliação', icon: CheckCircle2, color: 'text-secondary-foreground' },
  meta: { label: 'Meta', icon: DollarSign, color: 'text-success' },
  sistema: { label: 'Sistema', icon: Bell, color: 'text-muted-foreground' }
};

// ─── Animated Counter ─────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {value}
    </motion.span>
  );
}

// ─── Premium KPI Card ─────────────────────────────────────
function KPICard({ 
  prioridade, count, config 
}: { 
  prioridade: PrioridadeAlerta; 
  count: number; 
  config: typeof prioridadeConfig.critica;
}) {
  const Icon = config.icon;
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
      <div className={cn(
        "relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300",
        "bg-gradient-to-br", config.gradient,
        config.borderColor,
        count > 0 && `shadow-lg ${config.glowColor}`,
        "hover:shadow-xl group"
      )}>
        {/* Decorative glow */}
        {count > 0 && (
          <div className={cn(
            "absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-30",
            prioridade === 'critica' && "bg-destructive",
            prioridade === 'alta' && "bg-warning",
            prioridade === 'media' && "bg-primary",
            prioridade === 'baixa' && "bg-muted-foreground",
          )} />
        )}
        
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {config.label}
            </p>
            <p className="text-3xl font-bold font-display">
              <AnimatedNumber value={count} />
            </p>
          </div>
          <motion.div 
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              config.bgColor,
              "group-hover:scale-110 transition-transform duration-300"
            )}
            whileHover={{ rotate: 5 }}
          >
            <Icon className={cn("h-6 w-6", config.color)} />
          </motion.div>
        </div>
        
        {/* Micro bar indicator */}
        <div className="mt-3 h-1 w-full rounded-full bg-background/50 overflow-hidden">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              prioridade === 'critica' && "bg-destructive",
              prioridade === 'alta' && "bg-warning",
              prioridade === 'media' && "bg-primary",
              prioridade === 'baixa' && "bg-muted-foreground",
            )}
            initial={{ width: '0%' }}
            animate={{ width: count > 0 ? `${Math.min(count * 20, 100)}%` : '0%' }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Premium Empty State ──────────────────────────────────
function PremiumEmptyState({ type }: { type: 'all' | 'category' }) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative mb-6">
        {/* Outer glow ring */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-success/20 to-primary/10 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Icon container */}
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {type === 'all' ? (
              <ShieldCheck className="h-10 w-10 text-success" />
            ) : (
              <BellOff className="h-10 w-10 text-muted-foreground" />
            )}
          </motion.div>
        </div>
      </div>
      
      <h3 className="text-xl font-display font-semibold mb-2">
        {type === 'all' ? 'Tudo sob controle!' : 'Nenhum alerta nesta categoria'}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
        {type === 'all' 
          ? 'Seu financeiro está saudável. Alertas automáticos aparecerão aqui quando detectarmos vencimentos próximos, inadimplências ou riscos no fluxo de caixa.'
          : 'Quando houver alertas relevantes nesta categoria, eles aparecerão aqui com ações recomendadas.'}
      </p>
      
      {type === 'all' && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { icon: Calendar, label: 'Vencimentos', desc: 'Contas próximas do prazo' },
            { icon: Users, label: 'Inadimplência', desc: 'Clientes em atraso' },
            { icon: Activity, label: 'Fluxo de Caixa', desc: 'Riscos de liquidez' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/30"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-[10px] text-muted-foreground text-center">{item.desc}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Alert Row Item ───────────────────────────────────────
function AlertaRow({ 
  alerta, isSelected, onToggle, onMarkRead, onNavigate, isPending 
}: {
  alerta: Alerta;
  isSelected: boolean;
  onToggle: () => void;
  onMarkRead: () => void;
  onNavigate: () => void;
  isPending: boolean;
}) {
  const tipoInfo = tipoConfig[alerta.tipo] || tipoConfig.sistema;
  const prioridadeInfo = prioridadeConfig[alerta.prioridade];
  const TipoIcon = tipoInfo.icon;

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={cn(
        "group relative p-4 sm:p-5 transition-all duration-200 border-b border-border/50 last:border-b-0",
        !alerta.lido && "bg-primary/[0.03]",
        "hover:bg-muted/50"
      )}
    >
      {/* Unread accent bar */}
      {!alerta.lido && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/50 rounded-r" />
      )}
      
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="pt-0.5">
          <Checkbox 
            checked={isSelected}
            onChange={onToggle}
          />
        </div>
        
        <motion.div 
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
            prioridadeInfo.bgColor, prioridadeInfo.borderColor, "border"
          )}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <TipoIcon className={cn("h-5 w-5", tipoInfo.color)} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "text-sm truncate",
              !alerta.lido ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            )}>
              {alerta.titulo}
            </h4>
            {!alerta.lido && (
              <motion.span 
                className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
            {alerta.mensagem}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5",
                prioridadeInfo.color, prioridadeInfo.borderColor
              )}
            >
              {prioridadeInfo.label}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5">
              <TipoIcon className="h-3 w-3" />
              {tipoInfo.label}
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(alerta.created_at)}
            </span>
          </div>

          {(alerta.acao_url || alerta.entidade_tipo) && (
            <Button 
              variant="link" 
              size="sm" 
              className="px-0 mt-2 h-auto text-xs gap-1"
              onClick={onNavigate}
            >
              Ver detalhes
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!alerta.lido && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={onMarkRead}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────
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

  const {
    selectedCount, isProcessing, progress,
    isSelected, isAllSelected, selectAll, toggleSelect, clearSelection, executeBulkAction,
  } = useBulkActions({
    items: currentTabAlertas,
    getItemId: (a) => a.id,
    successMessage: 'Alertas marcados como lidos',
    errorMessage: 'Erro ao marcar alertas',
  });

  const countByPriority = (priority: PrioridadeAlerta) => 
    alertasNaoLidos.filter(a => a.prioridade === priority).length;

  const handleMarkAsRead = (id: string) => marcarComoLido.mutate(id);
  const handleMarkAllAsRead = () => marcarTodosComoLidos.mutate();
  const handleBulkMarkAsRead = () => {
    executeBulkAction(async (id) => {
      await marcarComoLido.mutateAsync(id);
    }, { showProgress: true });
  };

  const handleNavigate = (alerta: Alerta) => {
    if (alerta.acao_url) {
      navigate(alerta.acao_url);
    } else if (alerta.entidade_tipo) {
      const routes: Record<string, string> = {
        conta_pagar: '/contas-pagar',
        conta_receber: '/contas-receber',
        cliente: '/clientes',
        fornecedor: '/fornecedores',
        boleto: '/boletos',
      };
      const route = routes[alerta.entidade_tipo];
      if (route) navigate(route);
    }
  };

  // ─── Loading Skeleton ─────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  const urgentAlertas = alertasNaoLidos.filter(a => a.prioridade === 'critica' || a.prioridade === 'alta');

  return (
    <div className="space-y-6">
      {/* ─── Hero Header ─────────────────────────────────── */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-warning/5 to-transparent rounded-full blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-warning/10 border border-primary/20 flex items-center justify-center"
              whileHover={{ rotate: 10, scale: 1.05 }}
            >
              <BellRing className="h-7 w-7 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                Central de Alertas
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {alertasNaoLidos.length > 0 ? (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {alertasNaoLidos.length} não {alertasNaoLidos.length === 1 ? 'lido' : 'lidos'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Tudo em dia
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {alertas.length} total
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={alertasNaoLidos.length === 0 || marcarTodosComoLidos.isPending}
              className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm"
            >
              {marcarTodosComoLidos.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Marcar todos como lidos
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── KPI Cards ───────────────────────────────────── */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {(['critica', 'alta', 'media', 'baixa'] as PrioridadeAlerta[]).map((prioridade) => (
          <KPICard 
            key={prioridade}
            prioridade={prioridade}
            count={countByPriority(prioridade)}
            config={prioridadeConfig[prioridade]}
          />
        ))}
      </motion.div>

      {/* ─── Urgent Actions Banner ───────────────────────── */}
      <AnimatePresence>
        {urgentAlertas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-warning/30 bg-gradient-to-r from-warning/5 via-card to-destructive/5 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-warning" />
                  </div>
                  Ações Urgentes
                  <Badge variant="destructive" className="ml-2">{urgentAlertas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {urgentAlertas.slice(0, 3).map((alerta) => {
                    const tipoInfo = tipoConfig[alerta.tipo] || tipoConfig.sistema;
                    const TipoIcon = tipoInfo.icon;
                    return (
                      <motion.div 
                        key={alerta.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 hover:border-warning/30 transition-all group"
                        whileHover={{ x: 4 }}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center",
                          alerta.prioridade === 'critica' ? "bg-destructive/10" : "bg-warning/10"
                        )}>
                          <TipoIcon className={cn("h-4 w-4", tipoInfo.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{alerta.titulo}</p>
                          <p className="text-xs text-muted-foreground truncate">{alerta.mensagem}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleNavigate(alerta)}
                        >
                          Resolver
                          <ArrowRight className="h-3 w-3" />
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

      {/* ─── Main Alerts List ────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <TabsList className="w-full sm:w-auto bg-muted/50 backdrop-blur-sm p-1">
              <TabsTrigger value="todos" className="gap-1.5 data-[state=active]:shadow-sm">
                <Bell className="h-4 w-4" />
                Todos
                {alertas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                    {alertas.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vencimento" className="gap-1.5 data-[state=active]:shadow-sm">
                <Calendar className="h-4 w-4" />
                Vencimento
              </TabsTrigger>
              <TabsTrigger value="inadimplencia" className="gap-1.5 data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                Inadimplência
              </TabsTrigger>
              <TabsTrigger value="fluxo_caixa" className="gap-1.5 data-[state=active]:shadow-sm">
                <TrendingDown className="h-4 w-4" />
                Fluxo
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 px-1">
              <Checkbox 
                checked={isAllSelected}
                onChange={selectAll}
              />
              <span className="text-xs text-muted-foreground">Selecionar todos</span>
            </div>
          </div>

          {Object.entries(alertasPorTipo).map(([tipo, lista]) => (
            <TabsContent key={tipo} value={tipo} className="mt-0">
              <Card className="overflow-hidden border-border/50">
                {lista.length === 0 ? (
                  <PremiumEmptyState type={tipo === 'todos' ? 'all' : 'category'} />
                ) : (
                  <ScrollArea className="h-[550px]">
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {lista.map((alerta) => (
                        <AlertaRow
                          key={alerta.id}
                          alerta={alerta}
                          isSelected={isSelected(alerta.id)}
                          onToggle={() => toggleSelect(alerta.id)}
                          onMarkRead={() => handleMarkAsRead(alerta.id)}
                          onNavigate={() => handleNavigate(alerta)}
                          isPending={marcarComoLido.isPending}
                        />
                      ))}
                    </motion.div>
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* ─── Status Footer ───────────────────────────────── */}
      {alertas.length === 0 && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            Alertas são gerados automaticamente com base nas suas movimentações financeiras
          </p>
        </motion.div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        isProcessing={isProcessing}
        progress={progress}
        onClear={clearSelection}
        actions={[
          {
            id: 'mark-read',
            label: 'Marcar como lidos',
            icon: <Eye className="h-4 w-4" />,
            onClick: handleBulkMarkAsRead,
          },
        ]}
      />
    </div>
  );
}
