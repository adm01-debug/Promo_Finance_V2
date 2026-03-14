import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Search, 
  FileCode,
  Clock,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Eye,
  Copy,
  Download,
  Filter,
  Activity,
  Zap,
  Timer,
  TrendingUp
} from 'lucide-react';
import { 
  getEventos, 
  getEstatisticas, 
  EventoSefaz, 
  EventoTipo,
  eventTypeConfig 
} from '@/lib/sefaz-event-logger';
import { toast } from 'sonner';

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

// Ícone por tipo de evento
const getEventIcon = (tipo: EventoTipo) => {
  switch (tipo) {
    case 'AUTORIZACAO': return CheckCircle2;
    case 'REJEICAO': return XCircle;
    case 'CANCELAMENTO': return XCircle;
    case 'CONSULTA': return Search;
    case 'ENVIO_LOTE': return Wifi;
    case 'RETORNO_LOTE': return Server;
    case 'ERRO_CONEXAO': return WifiOff;
    case 'TIMEOUT': return Clock;
    case 'VALIDACAO': return FileCode;
    case 'CONTINGENCIA': return AlertCircle;
    case 'INUTILIZACAO': return XCircle;
    default: return Activity;
  }
};

// Componente de detalhes do evento
const EventoDetalhes = ({ evento }: { evento: EventoSefaz }) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-lg p-4 ${eventTypeConfig[evento.tipo].bgColor}`}>
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = getEventIcon(evento.tipo);
            return <Icon className={`h-6 w-6 ${eventTypeConfig[evento.tipo].color}`} />;
          })()}
          <div>
            <h3 className={`font-bold text-lg ${eventTypeConfig[evento.tipo].color}`}>
              {eventTypeConfig[evento.tipo].label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(evento.timestamp)}
            </p>
          </div>
        </div>
      </div>

      {/* Status SEFAZ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Código Status</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              cStat: {evento.cStat}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Ambiente</span>
          <Badge variant={evento.ambiente === 'producao' ? 'default' : 'secondary'}>
            {evento.ambiente === 'producao' ? 'Produção' : 'Homologação'}
          </Badge>
        </div>
      </div>

      {/* Motivo */}
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">Motivo</span>
        <p className="font-medium">{evento.xMotivo}</p>
      </div>

      {/* Chave de Acesso */}
      {evento.chaveAcesso && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Chave de Acesso</span>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
              {evento.chaveAcesso}
            </code>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleCopy(evento.chaveAcesso!, 'Chave de acesso')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Protocolo */}
      {evento.protocolo && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Protocolo</span>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{evento.protocolo}</code>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleCopy(evento.protocolo!, 'Protocolo')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tempo de Resposta */}
      {evento.tempoResposta !== undefined && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Tempo de Resposta</span>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{evento.tempoResposta}ms</span>
            {evento.tempoResposta < 1000 && (
              <Badge variant="outline" className="text-success border-success/20">Rápido</Badge>
            )}
            {evento.tempoResposta >= 1000 && evento.tempoResposta < 3000 && (
              <Badge variant="outline" className="text-warning border-warning/20">Normal</Badge>
            )}
            {evento.tempoResposta >= 3000 && (
              <Badge variant="outline" className="text-destructive border-destructive/20">Lento</Badge>
            )}
          </div>
        </div>
      )}

      {/* Detalhes adicionais */}
      {evento.detalhes && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Detalhes</span>
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{evento.detalhes}</p>
        </div>
      )}

      {/* ID do Evento */}
      <div className="pt-2 border-t">
        <span className="text-xs text-muted-foreground">ID do Evento: {evento.id}</span>
      </div>
    </div>
  );
};

// Componente principal
export function EventosHistorico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const eventos = getEventos();
  const stats = getEstatisticas();

  const filteredEventos = useMemo(() => {
    return eventos.filter(evento => {
      const matchesSearch = 
        evento.numeroNfe?.includes(searchTerm) ||
        evento.chaveAcesso?.includes(searchTerm) ||
        evento.xMotivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.cStat.includes(searchTerm);
      
      const matchesTipo = tipoFilter === 'todos' || evento.tipo === tipoFilter;
      
      return matchesSearch && matchesTipo;
    });
  }, [eventos, searchTerm, tipoFilter]);

  const tiposDisponiveis: { value: string; label: string }[] = [
    { value: 'todos', label: 'Todos os Tipos' },
    { value: 'AUTORIZACAO', label: 'Autorização' },
    { value: 'REJEICAO', label: 'Rejeição' },
    { value: 'CONSULTA', label: 'Consulta' },
    { value: 'CANCELAMENTO', label: 'Cancelamento' },
    { value: 'ENVIO_LOTE', label: 'Envio de Lote' },
    { value: 'VALIDACAO', label: 'Validação' },
    { value: 'ERRO_CONEXAO', label: 'Erro de Conexão' }
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Eventos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-success">{stats.autorizadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejeitadas</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejeitadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{stats.tempoMedioResposta}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, chave, motivo ou status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-52">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponiveis.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Eventos SEFAZ
          </CardTitle>
          <CardDescription>
            {filteredEventos.length} evento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredEventos.map((evento, index) => {
                  const Icon = getEventIcon(evento.tipo);
                  const config = eventTypeConfig[evento.tipo];
                  
                  return (
                    <motion.div
                      key={evento.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${config.bgColor} shrink-0`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`${config.color} ${config.bgColor} border-0`}>
                                {config.label}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs">
                                {evento.cStat}
                              </Badge>
                              {evento.numeroNfe && (
                                <span className="text-sm text-muted-foreground">
                                  NF-e #{evento.numeroNfe}
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1 truncate">{evento.xMotivo}</p>
                            {evento.protocolo && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                Protocolo: {evento.protocolo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {formatTime(evento.timestamp)}
                          </p>
                          {evento.tempoResposta && (
                            <p className="text-xs text-muted-foreground">
                              {evento.tempoResposta}ms
                            </p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Detalhes do Evento
                              </DialogTitle>
                            </DialogHeader>
                            <EventoDetalhes evento={evento} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredEventos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou emita uma NF-e</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
