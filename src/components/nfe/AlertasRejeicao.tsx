import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  XCircle,
  Bell,
  BellOff,
  Check,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  AlertaRejeicao,
  getAlertas,
  getAlertasNaoLidos,
  marcarAlertaComoLido,
  marcarTodosComoLidos,
  removerAlerta,
  analisarPadroesRejeicao,
  verificarRejeicoesConsecutivas,
  registrarAlerta,
  adicionarListenerAlerta
} from '@/lib/sefaz-rejection-monitor';
import { toast } from 'sonner';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Componente de detalhe do alerta
const AlertaDetalhe = ({ alerta }: { alerta: AlertaRejeicao }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-lg ${
        alerta.tipo === 'critico' 
          ? 'bg-destructive/10 border border-destructive/20' 
          : 'bg-warning/10 border border-warning/20'
      }`}>
        <div className="flex items-center gap-3">
          {alerta.tipo === 'critico' ? (
            <XCircle className="h-6 w-6 text-destructive" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-warning" />
          )}
          <div>
            <h3 className="font-semibold">{alerta.titulo}</h3>
            <p className="text-sm text-muted-foreground">
              Detectado em {formatTime(alerta.dataDetectado)}
            </p>
          </div>
        </div>
      </div>

      {/* Mensagem */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
        <p className="text-sm">{alerta.mensagem}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {alerta.rejeicoesConsecutivas}
            </div>
            <p className="text-sm text-muted-foreground">Rejeições consecutivas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {alerta.ultimasRejeicoes.length}
            </div>
            <p className="text-sm text-muted-foreground">Eventos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Últimas rejeições */}
      {alerta.ultimasRejeicoes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Últimas Rejeições</h4>
          <div className="space-y-2">
            {alerta.ultimasRejeicoes.map((evento, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    Código {evento.cStat}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(evento.timestamp)}
                  </span>
                </div>
                <p className="text-muted-foreground">{evento.xMotivo}</p>
                {evento.numeroNfe && (
                  <p className="text-xs mt-1">NF-e: {evento.numeroNfe}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ação recomendada */}
      <div className={`p-4 rounded-lg ${
        alerta.tipo === 'critico' 
          ? 'bg-destructive/5 border border-destructive/10' 
          : 'bg-warning/5 border border-warning/10'
      }`}>
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Ação Recomendada
        </h4>
        <p className="text-sm text-muted-foreground">{alerta.acaoRecomendada}</p>
      </div>
    </div>
  );
};

// Componente principal
export const AlertasRejeicao = () => {
  const [alertas, setAlertas] = useState<AlertaRejeicao[]>([]);
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaRejeicao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [padroes, setPadroes] = useState<ReturnType<typeof analisarPadroesRejeicao> | null>(null);

  // Carrega alertas e padrões
  const carregarDados = () => {
    setAlertas(getAlertas());
    setPadroes(analisarPadroesRejeicao());
  };

  // Verifica novas rejeições
  const verificarNovasRejeicoes = () => {
    const novoAlerta = verificarRejeicoesConsecutivas();
    if (novoAlerta) {
      registrarAlerta(novoAlerta);
      toast.error(novoAlerta.titulo, {
        description: novoAlerta.mensagem,
        duration: 8000
      });
    }
    carregarDados();
  };

  useEffect(() => {
    carregarDados();
    
    // Listener para novos alertas
    const unsubscribe = adicionarListenerAlerta((alerta) => {
      setAlertas(prev => [alerta, ...prev]);
    });

    return () => unsubscribe();
  }, []);

  const handleMarcarLido = (id: string) => {
    marcarAlertaComoLido(id);
    carregarDados();
  };

  const handleMarcarTodosLidos = () => {
    marcarTodosComoLidos();
    carregarDados();
    toast.success('Todos os alertas foram marcados como lidos');
  };

  const handleRemover = (id: string) => {
    removerAlerta(id);
    carregarDados();
    toast.success('Alerta removido');
  };

  const handleVerDetalhes = (alerta: AlertaRejeicao) => {
    setAlertaSelecionado(alerta);
    setDialogOpen(true);
    if (!alerta.lido) {
      marcarAlertaComoLido(alerta.id);
      carregarDados();
    }
  };

  const alertasNaoLidos = alertas.filter(a => !a.lido);
  const alertasCriticos = alertas.filter(a => a.tipo === 'critico' && !a.lido);

  const getTendenciaIcon = () => {
    if (!padroes) return <Minus className="h-4 w-4" />;
    switch (padroes.tendencia) {
      case 'aumentando':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'diminuindo':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}min atrás`;
    
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Rejeição
            {alertasNaoLidos.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertasNaoLidos.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={verificarNovasRejeicoes}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {alertasNaoLidos.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarcarTodosLidos}
                className="text-xs"
              >
                <BellOff className="h-4 w-4 mr-1" />
                Marcar todos
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo rápido */}
        {(alertasCriticos.length > 0 || padroes?.tendencia === 'aumentando') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {alertasCriticos.length > 0 
                  ? `${alertasCriticos.length} alerta(s) crítico(s) requer atenção imediata`
                  : 'Tendência de aumento nas rejeições detectada'}
              </span>
            </div>
          </motion.div>
        )}

        {/* Estatísticas de tendência */}
        {padroes && (
          <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getTendenciaIcon()}
              <span className="text-muted-foreground">
                Tendência: <span className="capitalize">{padroes.tendencia}</span>
              </span>
            </div>
            {padroes.codigosFrequentes.length > 0 && (
              <span className="text-muted-foreground">
                Erro mais comum: {padroes.codigosFrequentes[0].codigo}
              </span>
            )}
          </div>
        )}

        {/* Lista de alertas */}
        <ScrollArea className="h-[300px] pr-2">
          <AnimatePresence mode="popLayout">
            {alertas.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum alerta de rejeição</p>
                <p className="text-sm">O sistema monitora automaticamente</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {alertas.map((alerta) => (
                  <motion.div
                    key={alerta.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      !alerta.lido 
                        ? alerta.tipo === 'critico'
                          ? 'bg-destructive/5 border-destructive/20'
                          : 'bg-warning/5 border-warning/20'
                        : 'bg-muted/30 border-border/50'
                    }`}
                    onClick={() => handleVerDetalhes(alerta)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        alerta.tipo === 'critico' ? 'text-destructive' : 'text-warning'
                      }`}>
                        {alerta.tipo === 'critico' ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${!alerta.lido ? '' : 'text-muted-foreground'}`}>
                            {alerta.titulo}
                          </span>
                          {!alerta.lido && (
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {alerta.mensagem}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(alerta.dataDetectado)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!alerta.lido && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarcarLido(alerta.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemover(alerta.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalhes do Alerta
            </DialogTitle>
          </DialogHeader>
          {alertaSelecionado && (
            <AlertaDetalhe alerta={alertaSelecionado} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
