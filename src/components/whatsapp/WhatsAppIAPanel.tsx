import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, RefreshCw, Phone, Bot,
  AlertCircle, CheckCircle2, Clock, Sparkles,
  ExternalLink, Copy, Users, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertaProativo {
  tipo: 'vencimento' | 'inadimplencia' | 'meta' | 'fluxo' | 'oportunidade';
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  mensagem: string;
  dados: Record<string, unknown>;
  prioridade: 'alta' | 'media' | 'baixa';
}

const tipoConfig = {
  vencimento: { icone: '📅', cor: 'bg-amber-100 text-amber-800', label: 'Vencimento' },
  inadimplencia: { icone: '⚠️', cor: 'bg-red-100 text-red-800', label: 'Inadimplência' },
  meta: { icone: '🎯', cor: 'bg-blue-100 text-blue-800', label: 'Meta' },
  fluxo: { icone: '💰', cor: 'bg-green-100 text-green-800', label: 'Fluxo' },
  oportunidade: { icone: '✨', cor: 'bg-purple-100 text-purple-800', label: 'Oportunidade' }
};

export default function WhatsAppIAPanel() {
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaProativo | null>(null);
  const [mensagemEditada, setMensagemEditada] = useState('');
  const [perguntaIA, setPerguntaIA] = useState('');

  // Buscar alertas proativos
  const { data: alertasData, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-alertas'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: { action: 'analisar-alertas' }
      });
      
      if (error) throw error;
      return data;
    }
  });

  // Enviar mensagem
  const enviarMensagem = useMutation({
    mutationFn: async (alerta: AlertaProativo) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: {
          action: 'enviar-mensagem',
          data: {
            telefone: alerta.cliente_telefone,
            mensagem: mensagemEditada || alerta.mensagem,
            cliente_id: alerta.cliente_id,
            tipo: alerta.tipo
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Link do WhatsApp gerado!');
      window.open(data.whatsapp_link, '_blank');
      setAlertaSelecionado(null);
      setMensagemEditada('');
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    }
  });

  // Gerar resposta IA
  const gerarRespostaIA = useMutation({
    mutationFn: async () => {
      if (!alertaSelecionado) throw new Error('Nenhum alerta selecionado');

      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: {
          action: 'gerar-resposta-ia',
          data: {
            pergunta_cliente: perguntaIA,
            contexto: {
              cliente: alertaSelecionado.cliente_nome,
              tipo: alertaSelecionado.tipo,
              dados: alertaSelecionado.dados
            }
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setMensagemEditada(data.resposta);
      setPerguntaIA('');
    },
    onError: () => {
      toast.error('Erro ao gerar resposta');
    }
  });

  const alertas = alertasData?.alertas || [];
  const resumo = alertasData?.resumo || { total: 0, vencimento: 0, inadimplencia: 0 };

  const copiarMensagem = (mensagem: string) => {
    navigator.clipboard.writeText(mensagem);
    toast.success('Mensagem copiada!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-500" />
            WhatsApp IA Proativo
          </h2>
          <p className="text-muted-foreground">
            Mensagens inteligentes com IA conversacional
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alertas</p>
                <p className="text-2xl font-bold">{resumo.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencimentos</p>
                <p className="text-2xl font-bold text-amber-600">{resumo.vencimento}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inadimplência</p>
                <p className="text-2xl font-bold text-red-600">{resumo.inadimplencia}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IA Ativa</p>
                <p className="text-2xl font-bold text-green-600">✓</p>
              </div>
              <Sparkles className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas Proativos</CardTitle>
            <CardDescription>
              Clientes que precisam ser contatados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p className="font-medium">Tudo em dia!</p>
                  <p className="text-sm">Não há alertas pendentes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertas.map((alerta: AlertaProativo, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        setAlertaSelecionado(alerta);
                        setMensagemEditada(alerta.mensagem);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        alertaSelecionado === alerta ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {tipoConfig[alerta.tipo].icone}
                          </span>
                          <div>
                            <p className="font-medium">{alerta.cliente_nome}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={tipoConfig[alerta.tipo].cor}
                              >
                                {tipoConfig[alerta.tipo].label}
                              </Badge>
                              <Badge
                                variant={
                                  alerta.prioridade === 'alta' ? 'destructive' :
                                  alerta.prioridade === 'media' ? 'default' : 'secondary'
                                }
                              >
                                {alerta.prioridade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {alerta.dados && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {(alerta.dados as any).valor && (
                            <span>R$ {Number((alerta.dados as any).valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          )}
                          {(alerta.dados as any).dias_atraso && (
                            <span className="ml-2 text-red-600">
                              {(alerta.dados as any).dias_atraso} dias em atraso
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Painel de Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Mensagem IA
            </CardTitle>
            <CardDescription>
              {alertaSelecionado 
                ? `Mensagem para ${alertaSelecionado.cliente_nome}`
                : 'Selecione um alerta para compor a mensagem'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertaSelecionado ? (
              <>
                {/* Área de mensagem */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Mensagem Gerada por IA
                  </label>
                  <Textarea
                    value={mensagemEditada}
                    onChange={(e) => setMensagemEditada(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {mensagemEditada.length}/300 caracteres
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => enviarMensagem.mutate(alertaSelecionado)}
                    disabled={enviarMensagem.isPending}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copiarMensagem(mensagemEditada)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Chat com IA para ajustar resposta */}
                <div className="border-t pt-4 mt-4">
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ajustar com IA
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: torne mais amigável, ofereça desconto..."
                      value={perguntaIA}
                      onChange={(e) => setPerguntaIA(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && perguntaIA) {
                          gerarRespostaIA.mutate();
                        }
                      }}
                    />
                    <Button
                      onClick={() => gerarRespostaIA.mutate()}
                      disabled={gerarRespostaIA.isPending || !perguntaIA}
                    >
                      {gerarRespostaIA.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Dados do alerta */}
                <div className="border-t pt-4 mt-4">
                  <label className="text-sm font-medium mb-2 block">
                    Contexto
                  </label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                    {JSON.stringify(alertaSelecionado.dados, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Selecione um alerta na lista</p>
                <p className="text-sm">para compor a mensagem</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
