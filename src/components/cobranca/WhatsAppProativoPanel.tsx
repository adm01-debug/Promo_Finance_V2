import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface AlertaWhatsApp {
  tipo: 'vencimento' | 'inadimplencia' | 'meta' | 'fluxo' | 'oportunidade';
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  mensagem: string;
  dados: Record<string, unknown>;
  prioridade: 'alta' | 'media' | 'baixa';
}

const prioridadeConfig = {
  alta: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Alta' },
  media: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Média' },
  baixa: { color: 'bg-muted text-muted-foreground', label: 'Baixa' },
};

const tipoConfig = {
  vencimento: { icon: Clock, label: 'Vencimento', color: 'text-warning' },
  inadimplencia: { icon: AlertTriangle, label: 'Inadimplência', color: 'text-destructive' },
  meta: { icon: Zap, label: 'Meta', color: 'text-primary' },
  fluxo: { icon: Zap, label: 'Fluxo', color: 'text-primary' },
  oportunidade: { icon: Sparkles, label: 'Oportunidade', color: 'text-success' },
};

export function WhatsAppProativoPanel() {
  const [alertas, setAlertas] = useState<AlertaWhatsApp[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  const analisarAlertas = async () => {
    setIsAnalyzing(true);
    setAlertas([]);
    setSelectedIds(new Set());
    setSentIds(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: { action: 'analisar-alertas', data: {} },
      });
      if (error) throw error;
      if (data?.alertas) {
        setAlertas(data.alertas);
        toast.success(`${data.alertas.length} alerta(s) identificado(s)`);
      } else {
        toast.info('Nenhum alerta encontrado');
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error('Erro ao analisar alertas');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enviarMensagem = async (idx: number) => {
    const alerta = alertas[idx];
    setSendingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: {
          action: 'enviar-mensagem',
          data: {
            telefone: alerta.cliente_telefone,
            mensagem: alerta.mensagem,
            cliente_id: alerta.cliente_id,
            tipo: alerta.tipo,
          },
        },
      });
      if (error) throw error;
      if (data?.whatsapp_link) {
        window.open(data.whatsapp_link, '_blank');
        setSentIds(prev => new Set(prev).add(idx));
        toast.success(`Mensagem gerada para ${alerta.cliente_nome}`);
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingIdx(null);
    }
  };

  const enviarSelecionados = async () => {
    for (const idx of selectedIds) {
      if (!sentIds.has(idx)) {
        await enviarMensagem(idx);
      }
    }
    toast.success('Envio em lote concluído');
  };

  const toggleSelect = (idx: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === alertas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alertas.map((_, i) => i)));
    }
  };

  const salvarEdicao = (idx: number) => {
    setAlertas(prev => prev.map((a, i) => i === idx ? { ...a, mensagem: editText } : a));
    setEditingIdx(null);
    toast.success('Mensagem editada');
  };

  const resumo = {
    vencimento: alertas.filter(a => a.tipo === 'vencimento').length,
    inadimplencia: alertas.filter(a => a.tipo === 'inadimplencia').length,
    alta: alertas.filter(a => a.prioridade === 'alta').length,
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">Cobranças Proativas via WhatsApp</CardTitle>
                <CardDescription>IA analisa inadimplência e gera mensagens personalizadas</CardDescription>
              </div>
            </div>
            <Button
              onClick={analisarAlertas}
              disabled={isAnalyzing}
              className="gap-2 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Analisar & Gerar Mensagens'}
            </Button>
          </div>
        </CardHeader>

        {alertas.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {alertas.length} cliente(s)
                </Badge>
                {resumo.inadimplencia > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {resumo.inadimplencia} inadimplente(s)
                  </Badge>
                )}
                {resumo.vencimento > 0 && (
                  <Badge className="gap-1 bg-warning/10 text-warning border-warning/20" variant="outline">
                    <Clock className="h-3 w-3" />
                    {resumo.vencimento} a vencer
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedIds.size === alertas.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                {selectedIds.size > 0 && (
                  <Button size="sm" className="gap-1" onClick={enviarSelecionados}>
                    <Send className="h-3.5 w-3.5" />
                    Enviar {selectedIds.size} selecionado(s)
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Alert List */}
      <AnimatePresence>
        {alertas.map((alerta, idx) => {
          const tipo = tipoConfig[alerta.tipo] || tipoConfig.vencimento;
          const TipoIcon = tipo.icon;
          const prioridade = prioridadeConfig[alerta.prioridade];
          const isSent = sentIds.has(idx);
          const dados = alerta.dados as Record<string, unknown>;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={isSent ? 'border-success/30 bg-success/[0.02]' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(idx)}
                      onChange={() => toggleSelect(idx)}
                      className="mt-1"
                    />

                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TipoIcon className={`h-4 w-4 ${tipo.color}`} />
                          <span className="font-semibold text-sm">{alerta.cliente_nome}</span>
                          <Badge variant="outline" className={prioridade.color}>
                            {prioridade.label}
                          </Badge>
                          {isSent && (
                            <Badge className="gap-1 bg-success/10 text-success border-success/20" variant="outline">
                              <CheckCircle2 className="h-3 w-3" />
                              Enviado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {dados.valor && <span className="font-medium">{formatCurrency(Number(dados.valor))}</span>}
                          {dados.dias_atraso && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1">
                              {dados.dias_atraso}d atraso
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      {editingIdx === idx ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => salvarEdicao(idx)}>Salvar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditText(alerta.mensagem);
                          }}
                          title="Clique para editar"
                        >
                          "{alerta.mensagem}"
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isSent ? 'outline' : 'default'}
                          className="gap-1"
                          onClick={() => enviarMensagem(idx)}
                          disabled={sendingIdx === idx}
                        >
                          {sendingIdx === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSent ? (
                            <RefreshCw className="h-3.5 w-3.5" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          {isSent ? 'Reenviar' : 'Abrir WhatsApp'}
                        </Button>
                        <span className="text-xs text-muted-foreground">📱 {alerta.cliente_telefone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {!isAnalyzing && alertas.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="font-semibold text-lg mb-1">Nenhum alerta gerado</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Clique em "Analisar & Gerar Mensagens" para que a IA identifique clientes com contas próximas ao vencimento ou inadimplentes e gere mensagens personalizadas de cobrança.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}