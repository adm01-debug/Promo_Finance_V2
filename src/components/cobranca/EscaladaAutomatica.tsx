import { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Mail, 
  MessageSquare, 
  Phone, 
  FileText, 
  Scale, 
  Gavel,
  Play,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEscaladaCobranca, EtapaEscalada, ContaEmEscalada } from '@/hooks/useEscaladaCobranca';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const ICONES_ACAO: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  ligacao: <Phone className="h-4 w-4" />,
  carta: <FileText className="h-4 w-4" />,
  protesto: <Scale className="h-4 w-4" />,
  juridico: <Gavel className="h-4 w-4" />,
};

const CORES_ETAPA: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-yellow-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
  5: 'bg-purple-500',
  6: 'bg-gray-800',
};

export function EscaladaAutomatica() {
  const { 
    contasEmEscalada, 
    etapasEscalada, 
    estatisticas, 
    isLoading,
    executarAcao,
    executarEscaladaAutomatica,
    isExecutando
  } = useEscaladaCobranca();

  const [etapaExpandida, setEtapaExpandida] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando escalada...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vencido</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(estatisticas.valorTotalVencido)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Títulos em Atraso</p>
                <p className="text-2xl font-bold">{estatisticas.totalVencidas}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ações Pendentes</p>
                <p className="text-2xl font-bold text-primary">{estatisticas.pendentesAutomatico}</p>
              </div>
              <Zap className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => executarEscaladaAutomatica()}
              disabled={isExecutando || estatisticas.pendentesAutomatico === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Executar Escalada Automática
            </Button>
            <p className="text-xs mt-2 opacity-80 text-center">
              {estatisticas.pendentesAutomatico} ações prontas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline de Escalada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pipeline de Escalada
          </CardTitle>
          <CardDescription>
            Visualize e gerencie a progressão das cobranças por etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de progresso visual */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
            {etapasEscalada.map((etapa, index) => {
              const quantidade = estatisticas.porEtapa.find(e => e.id === etapa.id)?.quantidade || 0;
              const maxQtd = Math.max(...estatisticas.porEtapa.map(e => e.quantidade), 1);
              
              return (
                <div key={etapa.id} className="flex items-center flex-1 min-w-[120px]">
                  <div 
                    className="flex-1 cursor-pointer group"
                    onClick={() => setEtapaExpandida(etapaExpandida === etapa.id ? null : etapa.id)}
                  >
                    <div className="text-center mb-2">
                      <div className={`inline-flex items-center justify-center p-2 rounded-full ${CORES_ETAPA[etapa.ordem]} text-white transition-transform group-hover:scale-110`}>
                        {ICONES_ACAO[etapa.acao]}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate">{etapa.nome}</p>
                      <p className="text-lg font-bold">{quantidade}</p>
                      <Progress 
                        value={(quantidade / maxQtd) * 100} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </div>
                  {index < etapasEscalada.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Lista expandível por etapa */}
          <div className="space-y-3">
            {etapasEscalada.map((etapa) => {
              const contasDaEtapa = contasEmEscalada.filter(c => 
                c.proximaAcao?.id === etapa.id || 
                (c.diasAtraso >= etapa.diasAtraso && 
                 (etapasEscalada.find(e => e.ordem === etapa.ordem + 1)?.diasAtraso || 999) > c.diasAtraso)
              );
              
              if (contasDaEtapa.length === 0) return null;

              return (
                <Collapsible 
                  key={etapa.id}
                  open={etapaExpandida === etapa.id}
                  onOpenChange={() => setEtapaExpandida(etapaExpandida === etapa.id ? null : etapa.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${CORES_ETAPA[etapa.ordem]} text-white`}>
                              {ICONES_ACAO[etapa.acao]}
                            </div>
                            <div>
                              <p className="font-medium">{etapa.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {contasDaEtapa.length} título(s) • {formatCurrency(contasDaEtapa.reduce((s, c) => s + c.valor, 0))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {etapa.enviarAutomaticamente && (
                              <Badge variant="secondary">
                                <Zap className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                            <Badge variant="outline">+{etapa.diasAtraso} dias</Badge>
                            {etapaExpandida === etapa.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <ScrollArea className="h-64 mt-2">
                          <div className="space-y-2 p-2">
                            {contasDaEtapa.map((conta) => (
                              <ContaEscaladaItem 
                                key={conta.id}
                                conta={conta}
                                etapa={etapa}
                                onExecutar={() => executarAcao({ 
                                  contaId: conta.id, 
                                  etapa, 
                                  dadosConta: conta 
                                })}
                                isExecutando={isExecutando}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContaEscaladaItem({ 
  conta, 
  etapa, 
  onExecutar, 
  isExecutando 
}: { 
  conta: ContaEmEscalada; 
  etapa: EtapaEscalada;
  onExecutar: () => void;
  isExecutando: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{conta.clienteNome}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatCurrency(conta.valor)}</span>
          <span>•</span>
          <span className="text-destructive font-medium">{conta.diasAtraso} dias</span>
          <span>•</span>
          <span>Venc: {format(new Date(conta.dataVencimento), 'dd/MM', { locale: ptBR })}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        {conta.clienteEmail && etapa.acao === 'email' && (
          <Badge variant="outline" className="text-xs">
            <Mail className="h-3 w-3 mr-1" />
            {conta.clienteEmail.split('@')[0]}...
          </Badge>
        )}
        {conta.clienteTelefone && etapa.acao === 'whatsapp' && (
          <Badge variant="outline" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            ...{conta.clienteTelefone.slice(-4)}
          </Badge>
        )}
        <Button 
          size="sm" 
          onClick={onExecutar}
          disabled={isExecutando}
        >
          {ICONES_ACAO[etapa.acao]}
          <span className="ml-1">Executar</span>
        </Button>
      </div>
    </div>
  );
}
