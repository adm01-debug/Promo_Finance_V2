// ============================================
// COMPONENTE: ALERTAS TRIBUTÁRIOS EM TEMPO REAL
// Monitoramento de prazos e compliance
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Clock,
  Calendar, RefreshCw, ExternalLink, BellRing,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useAlertasTributarios, { TipoAlerta, PrioridadeAlerta, ALERTA_CONFIG } from '@/hooks/useAlertasTributarios';
import { useAllEmpresas } from '@/hooks/useEmpresas';

const PRIORIDADE_CONFIG: Record<PrioridadeAlerta, { cor: string; icone: React.ReactNode; label: string }> = {
  critica: { 
    cor: 'bg-destructive/10 text-destructive border-destructive/20', 
    icone: <AlertCircle className="h-4 w-4" />,
    label: 'Crítico',
  },
  alta: { 
    cor: 'bg-warning/10 text-warning border-warning/20', 
    icone: <AlertTriangle className="h-4 w-4" />,
    label: 'Alta',
  },
  media: { 
    cor: 'bg-warning/5 text-warning border-warning/10', 
    icone: <Clock className="h-4 w-4" />,
    label: 'Média',
  },
  baixa: { 
    cor: 'bg-primary/10 text-primary border-primary/20', 
    icone: <Info className="h-4 w-4" />,
    label: 'Baixa',
  },
};

export function AlertasTributarios() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeAlerta | 'todas'>('todas');
  const [filtroTipo, setFiltroTipo] = useState<TipoAlerta | 'todos'>('todos');

  const { data: empresas = [] } = useAllEmpresas();
  const {
    alertas, isLoading, naoLidos, criticos, porTipo, proximosVencimentos,
    marcarLido, resolverAlerta, gerarAlertasAutomaticos,
  } = useAlertasTributarios(empresaId || undefined);

  const alertasFiltrados = alertas.filter(a => {
    if (filtroPrioridade !== 'todas' && a.prioridade !== filtroPrioridade) return false;
    if (filtroTipo !== 'todos' && a.tipo !== filtroTipo) return false;
    return true;
  });

  const handleGerarAlertas = async () => {
    if (!empresaId) return;
    await gerarAlertasAutomaticos(empresaId);
  };

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6" />
                {naoLidos > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {naoLidos > 9 ? '9+' : naoLidos}
                  </span>
                )}
              </div>
              <div>
                <CardTitle>Alertas Tributários</CardTitle>
                <CardDescription>Monitoramento em tempo real de prazos e compliance</CardDescription>
              </div>
            </div>
            {criticos > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                {criticos} críticos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-48">
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-32">
              <Select value={filtroPrioridade} onValueChange={(v) => setFiltroPrioridade(v as PrioridadeAlerta | 'todas')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas prioridades</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-40">
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as TipoAlerta | 'todos')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos tipos</SelectItem>
                  {Object.entries(ALERTA_CONFIG).map(([tipo, config]) => (
                    <SelectItem key={tipo} value={tipo}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleGerarAlertas} disabled={!empresaId}>
              <RefreshCw className="h-4 w-4 mr-2" />Verificar Pendências
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo rápido */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold">{criticos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
                <p className="text-2xl font-bold">{alertas.filter(a => a.prioridade === 'alta').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Não Lidos</p>
                <p className="text-2xl font-bold">{naoLidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximos 7 dias</p>
                <p className="text-2xl font-bold">
                  {alertas.filter(a => {
                    if (!a.data_vencimento) return false;
                    const dias = differenceInDays(parseISO(a.data_vencimento), new Date());
                    return dias >= 0 && dias <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Alertas Ativos ({alertasFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {alertasFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
              <p className="font-medium">Nenhum alerta pendente</p>
              <p className="text-sm">Todos os prazos estão em dia!</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <AnimatePresence>
                <div className="space-y-3">
                  {alertasFiltrados.map((alerta, index) => {
                    const config = PRIORIDADE_CONFIG[alerta.prioridade];
                    const tipoConfig = ALERTA_CONFIG[alerta.tipo];
                    const diasParaVencer = alerta.data_vencimento 
                      ? differenceInDays(parseISO(alerta.data_vencimento), new Date())
                      : null;

                    return (
                      <motion.div
                        key={alerta.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border-l-4 ${config.cor} ${!alerta.lido ? 'ring-2 ring-primary/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5">{config.icone}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{alerta.titulo}</h4>
                                <Badge variant="outline" className="text-xs">{tipoConfig.label}</Badge>
                                {!alerta.lido && <Badge variant="secondary" className="text-xs">Novo</Badge>}
                              </div>
                              <p className="text-sm mt-1 opacity-80">{alerta.mensagem}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {alerta.data_vencimento && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Vence: {format(parseISO(alerta.data_vencimento), 'dd/MM/yyyy')}
                                    {diasParaVencer !== null && diasParaVencer >= 0 && (
                                      <span className={diasParaVencer <= 3 ? 'text-destructive font-medium' : ''}>
                                        ({diasParaVencer === 0 ? 'Hoje!' : `${diasParaVencer} dias`})
                                      </span>
                                    )}
                                  </span>
                                )}
                                {alerta.competencia && <span>Competência: {alerta.competencia}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {alerta.acao_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={alerta.acao_url}>
                                  <ExternalLink className="h-3 w-3 mr-1" />{alerta.acao_label || 'Ver'}
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => resolverAlerta.mutate({ alertaId: alerta.id })}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Próximos vencimentos */}
      {proximosVencimentos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-5">
              {proximosVencimentos.map((alerta) => {
                const dias = differenceInDays(parseISO(alerta.data_vencimento!), new Date());
                return (
                  <div key={alerta.id} className={`p-3 rounded-lg border ${
                    dias <= 1 ? 'bg-destructive/5 border-destructive/20' :
                    dias <= 3 ? 'bg-warning/5 border-warning/20' :
                    'bg-muted/50'
                  }`}>
                    <p className="text-xs text-muted-foreground">{ALERTA_CONFIG[alerta.tipo].label}</p>
                    <p className="font-medium text-sm truncate" title={alerta.titulo}>{alerta.titulo}</p>
                    <p className={`text-xs mt-1 font-medium ${
                      dias <= 1 ? 'text-destructive' : dias <= 3 ? 'text-warning' : ''
                    }`}>
                      {dias === 0 ? 'Vence hoje!' : dias === 1 ? 'Vence amanhã' : `${dias} dias`}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AlertasTributarios;
