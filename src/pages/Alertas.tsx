import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  Eye,
  Trash2,
  CheckCheck,
  XCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const prioridadeConfig: Record<PrioridadeAlerta, { label: string; color: string; bgColor: string; icon: typeof AlertCircle }> = {
  critica: { label: 'Crítica', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle },
  alta: { label: 'Alta', color: 'text-warning', bgColor: 'bg-warning/10', icon: AlertTriangle },
  media: { label: 'Média', color: 'text-primary', bgColor: 'bg-primary/10', icon: AlertCircle },
  baixa: { label: 'Baixa', color: 'text-secondary', bgColor: 'bg-secondary/10', icon: Info }
};

const tipoConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  vencimento: { label: 'Vencimento', icon: Calendar, color: 'text-warning' },
  fluxo_caixa: { label: 'Fluxo de Caixa', icon: TrendingDown, color: 'text-destructive' },
  inadimplencia: { label: 'Inadimplência', icon: Users, color: 'text-accent' },
  conciliacao: { label: 'Conciliação', icon: CheckCircle2, color: 'text-secondary' },
  meta: { label: 'Meta', icon: DollarSign, color: 'text-success' },
  sistema: { label: 'Sistema', icon: Bell, color: 'text-muted-foreground' }
};

export default function Alertas() {
  const navigate = useNavigate();
  const { data: alertas = [], isLoading, refetch } = useAlertas();
  const marcarComoLido = useMarcarAlertaComoLido();
  const marcarTodosComoLidos = useMarcarTodosAlertasComoLidos();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('todos');

  const alertasNaoLidos = alertas.filter(a => !a.lido);
  const alertasPorTipo: Record<string, Alerta[]> = {
    todos: alertas,
    vencimento: alertas.filter(a => a.tipo === 'vencimento'),
    inadimplencia: alertas.filter(a => a.tipo === 'inadimplencia'),
    fluxo_caixa: alertas.filter(a => a.tipo === 'fluxo_caixa'),
    conciliacao: alertas.filter(a => a.tipo === 'conciliacao'),
    meta: alertas.filter(a => a.tipo === 'meta')
  };

  const countByPriority = (priority: PrioridadeAlerta) => 
    alertasNaoLidos.filter(a => a.prioridade === priority).length;

  const handleMarkAsRead = (id: string) => {
    marcarComoLido.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    marcarTodosComoLidos.mutate();
  };

  const handleSelectAll = () => {
    const currentTabAlertas = alertasPorTipo[activeTab] || [];
    if (selectedIds.length === currentTabAlertas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentTabAlertas.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getTipoInfo = (tipo: string) => {
    return tipoConfig[tipo] || tipoConfig.sistema;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Alertas</h1>
          <p className="text-muted-foreground">
            {alertasNaoLidos.length} alertas não lidos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={alertasNaoLidos.length === 0 || marcarTodosComoLidos.isPending}
          >
            {marcarTodosComoLidos.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Marcar todos como lidos
          </Button>
        </div>
      </div>

      {/* KPIs por Prioridade */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {(['critica', 'alta', 'media', 'baixa'] as PrioridadeAlerta[]).map((prioridade) => {
          const config = prioridadeConfig[prioridade];
          const count = countByPriority(prioridade);
          const Icon = config.icon;
          
          return (
            <motion.div key={prioridade} variants={itemVariants}>
              <Card className={cn("border-l-4", 
                prioridade === 'critica' && "border-l-destructive",
                prioridade === 'alta' && "border-l-warning",
                prioridade === 'media' && "border-l-primary",
                prioridade === 'baixa' && "border-l-secondary"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <div className={cn("p-2 rounded-full", config.bgColor)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tabs por Tipo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="todos" className="gap-2">
              <Bell className="h-4 w-4" />
              Todos
              <Badge variant="secondary" className="ml-1">{alertas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="vencimento" className="gap-2">
              <Calendar className="h-4 w-4" />
              Vencimento
            </TabsTrigger>
            <TabsTrigger value="inadimplencia" className="gap-2">
              <Users className="h-4 w-4" />
              Inadimplência
            </TabsTrigger>
            <TabsTrigger value="fluxo_caixa" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Fluxo
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedIds.length === (alertasPorTipo[activeTab]?.length || 0) && (alertasPorTipo[activeTab]?.length || 0) > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Selecionar todos</span>
          </div>
        </div>

        {Object.entries(alertasPorTipo).map(([tipo, lista]) => (
          <TabsContent key={tipo} value={tipo} className="mt-4">
            <Card>
              <ScrollArea className="h-[600px]">
                <motion.div 
                  className="divide-y divide-border"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {lista.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhum alerta nesta categoria</p>
                    </div>
                  ) : (
                    lista.map((alerta) => {
                      const tipoInfo = getTipoInfo(alerta.tipo);
                      const prioridadeInfo = prioridadeConfig[alerta.prioridade];
                      const TipoIcon = tipoInfo.icon;
                      const PrioridadeIcon = prioridadeInfo.icon;

                      return (
                        <motion.div
                          key={alerta.id}
                          variants={itemVariants}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors",
                            !alerta.lido && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox 
                              checked={selectedIds.includes(alerta.id)}
                              onCheckedChange={() => toggleSelect(alerta.id)}
                            />
                            
                            <div className={cn("p-2 rounded-lg", prioridadeInfo.bgColor)}>
                              <TipoIcon className={cn("h-5 w-5", tipoInfo.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={cn(
                                  "font-medium truncate",
                                  !alerta.lido && "font-semibold"
                                )}>
                                  {alerta.titulo}
                                </h4>
                                {!alerta.lido && (
                                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {alerta.mensagem}
                              </p>

                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="outline" className={cn("gap-1", prioridadeInfo.color)}>
                                  <PrioridadeIcon className="h-3 w-3" />
                                  {prioridadeInfo.label}
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                  <TipoIcon className="h-3 w-3" />
                                  {tipoInfo.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(alerta.created_at)}
                                </span>
                              </div>

                              {(alerta.acao_url || alerta.entidade_tipo) && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="px-0 mt-2 h-auto"
                                  onClick={() => handleNavigate(alerta)}
                                >
                                  Ver detalhes
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {!alerta.lido && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleMarkAsRead(alerta.id)}
                                  disabled={marcarComoLido.isPending}
                                >
                                  {marcarComoLido.isPending ? (
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
                    })
                  )}
                </motion.div>
              </ScrollArea>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Ações Recomendadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Ações Recomendadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {alertasNaoLidos
              .filter(a => a.prioridade === 'critica' || a.prioridade === 'alta')
              .slice(0, 5)
              .map((alerta) => {
                const tipoInfo = getTipoInfo(alerta.tipo);
                const TipoIcon = tipoInfo.icon;

                return (
                  <div 
                    key={alerta.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      alerta.prioridade === 'critica' ? "bg-destructive/10" : "bg-warning/10"
                    )}>
                      <TipoIcon className={cn("h-4 w-4", tipoInfo.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alerta.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{alerta.mensagem}</p>
                    </div>
                    <Button size="sm" onClick={() => handleNavigate(alerta)}>
                      Resolver
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                );
              })}
            {alertasNaoLidos.filter(a => a.prioridade === 'critica' || a.prioridade === 'alta').length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>Nenhuma ação urgente pendente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
