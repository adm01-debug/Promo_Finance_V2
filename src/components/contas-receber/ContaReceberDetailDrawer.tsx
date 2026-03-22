import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Calendar, DollarSign, FileText, Clock, CheckCircle2,
  AlertTriangle, Send, MessageCircle, Paperclip, History, Calculator,
  ExternalLink, Copy, X, Banknote, QrCode, CreditCard, Wallet,
  TrendingUp, Shield, Users, Scale,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalculadoraJurosMulta } from './CalculadoraJurosMulta';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, formatDateTime, calculateOverdueDays, getEtapaCobrancaLabel } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ContaReceberWithRelations } from './ContasReceberTableRow';

interface ContaReceberDetailDrawerProps {
  conta: ContaReceberWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (conta: ContaReceberWithRelations) => void;
  onRegistrarRecebimento: (conta: ContaReceberWithRelations) => void;
  onEnviarCobranca: (conta: ContaReceberWithRelations) => void;
}

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: X },
};

const etapaConfig: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  preventiva: { label: 'Preventiva', color: 'bg-primary/10 text-primary', icon: Shield },
  lembrete: { label: 'Lembrete', color: 'bg-warning/10 text-warning', icon: Clock },
  cobranca: { label: 'Cobrança', color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  negociacao: { label: 'Negociação', color: 'bg-secondary/10 text-secondary', icon: Users },
  juridico: { label: 'Jurídico', color: 'bg-destructive/10 text-destructive', icon: Scale },
};

const tipoCobrancaIcons: Record<string, typeof Banknote> = {
  boleto: Banknote,
  pix: QrCode,
  cartao: CreditCard,
  transferencia: Building2,
  dinheiro: Wallet,
};

export function ContaReceberDetailDrawer({
  conta, open, onOpenChange, onEdit, onRegistrarRecebimento, onEnviarCobranca,
}: ContaReceberDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('detalhes');

  // Fetch audit history
  const { data: auditHistory = [] } = useQuery({
    queryKey: ['audit-conta-receber', conta?.id],
    queryFn: async () => {
      if (!conta?.id) return [];
      const { data } = await supabase
        .from('auditoria_financeira')
        .select('*')
        .eq('tabela', 'contas_receber')
        .eq('registro_id', conta.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!conta?.id && open,
  });

  // Fetch attachments
  const { data: anexos = [] } = useQuery({
    queryKey: ['anexos-conta-receber', conta?.id],
    queryFn: async () => {
      if (!conta?.id) return [];
      const { data } = await supabase
        .from('anexos_financeiros')
        .select('*')
        .eq('entidade_tipo', 'conta_receber')
        .eq('entidade_id', conta.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!conta?.id && open,
  });

  // Fetch collection history
  const { data: cobrancas = [] } = useQuery({
    queryKey: ['cobrancas-conta-receber', conta?.id],
    queryFn: async () => {
      if (!conta?.id) return [];
      const { data } = await supabase
        .from('execucoes_cobranca')
        .select('*')
        .eq('conta_receber_id', conta.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!conta?.id && open,
  });

  // Fetch linked acordos
  const { data: acordos = [] } = useQuery({
    queryKey: ['acordos-conta-receber', conta?.id],
    queryFn: async () => {
      if (!conta?.id) return [];
      const { data } = await supabase
        .from('acordos_parcelamento')
        .select('*')
        .contains('contas_receber_ids', [conta.id])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!conta?.id && open,
  });

  // Fetch linked boleto
  const { data: boletos = [] } = useQuery({
    queryKey: ['boletos-conta-receber', conta?.id],
    queryFn: async () => {
      if (!conta?.id) return [];
      const { data } = await supabase
        .from('boletos')
        .select('*')
        .eq('conta_receber_id', conta.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!conta?.id && open,
  });

  if (!conta) return null;

  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon || Clock;
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  const saldo = conta.valor - (conta.valor_recebido || 0);
  const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0;
  const etapa = conta.etapa_cobranca ? etapaConfig[conta.etapa_cobranca] : null;
  const TipoIcon = tipoCobrancaIcons[conta.tipo_cobranca || 'boleto'] || Banknote;

  const handleCopyPix = () => {
    if (conta.chave_pix) {
      navigator.clipboard.writeText(conta.chave_pix);
      toast.success('Chave PIX copiada!');
    }
  };

  const operacaoLabels: Record<string, string> = {
    INSERT: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-display truncate">
                {conta.descricao}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={cn("gap-1", status?.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status?.label || conta.status}
                </Badge>
                {etapa && (
                  <Badge variant="outline" className={cn("gap-1", etapa.color)}>
                    <etapa.icon className="h-3 w-3" />
                    {etapa.label}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <TipoIcon className="h-3 w-3" />
                  {conta.tipo_cobranca?.toUpperCase() || 'BOLETO'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Value Summary */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="text-xl font-bold font-display tabular-nums">{formatCurrency(conta.valor)}</span>
            </div>
            {(conta.valor_recebido || 0) > 0 && (
              <>
                <Progress value={percentualRecebido} className="h-2 mt-2" />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-success">Recebido: {formatCurrency(conta.valor_recebido || 0)}</span>
                  <span className="text-muted-foreground">Saldo: {formatCurrency(saldo)}</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            {conta.status !== 'pago' && conta.status !== 'cancelado' && (
              <>
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => { onOpenChange(false); onRegistrarRecebimento(conta); }}>
                  <DollarSign className="h-3.5 w-3.5" /> Receber
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onEnviarCobranca(conta)}>
                  <MessageCircle className="h-3.5 w-3.5" /> Cobrar
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { onOpenChange(false); onEdit(conta); }}>
              <FileText className="h-3.5 w-3.5" /> Editar
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 grid grid-cols-4">
            <TabsTrigger value="detalhes" className="text-xs">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="cobrancas" className="text-xs">Cobranças</TabsTrigger>
            <TabsTrigger value="anexos" className="text-xs">
              Anexos {anexos.length > 0 && <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5">{anexos.length}</span>}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="detalhes" className="mt-0 space-y-4">
              {/* Juros/Multa Calculator for overdue */}
              {conta.status === 'vencido' && (
                <CalculadoraJurosMulta
                  valorOriginal={conta.valor}
                  dataVencimento={conta.data_vencimento}
                  valorRecebido={conta.valor_recebido || 0}
                />
              )}

              {/* Client Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{conta.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{conta.clientes?.nome_fantasia || '-'}</p>
                  </div>
                  {conta.clientes?.score && (
                    <Badge variant="outline" className={cn(
                      "ml-auto",
                      conta.clientes.score >= 800 ? 'text-success border-success/30' :
                      conta.clientes.score >= 600 ? 'text-warning border-warning/30' :
                      'text-destructive border-destructive/30'
                    )}>
                      Score: {conta.clientes.score}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground">Emissão</span>
                    <p className="text-sm font-medium mt-0.5">{formatDate(conta.data_emissao)}</p>
                  </div>
                  <div className={cn("p-3 rounded-lg", overdueDays > 0 && conta.status !== 'pago' ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30')}>
                    <span className="text-xs text-muted-foreground">Vencimento</span>
                    <p className="text-sm font-medium mt-0.5">{formatDate(conta.data_vencimento)}</p>
                    {overdueDays > 0 && conta.status !== 'pago' && (
                      <p className="text-xs text-destructive font-medium">{overdueDays} dias em atraso</p>
                    )}
                  </div>
                  {conta.data_recebimento && (
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                      <span className="text-xs text-muted-foreground">Recebimento</span>
                      <p className="text-sm font-medium mt-0.5 text-success">{formatDate(conta.data_recebimento)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações</h4>
                <div className="space-y-2">
                  {conta.numero_documento && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nº Documento</span>
                      <span className="font-medium">{conta.numero_documento}</span>
                    </div>
                  )}
                  {conta.numero_parcela_atual && conta.total_parcelas && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parcela</span>
                      <span className="font-medium">{conta.numero_parcela_atual}/{conta.total_parcelas}</span>
                    </div>
                  )}
                  {conta.centros_custo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Centro de Custo</span>
                      <span className="font-medium">{conta.centros_custo.codigo} - {conta.centros_custo.nome}</span>
                    </div>
                  )}
                  {conta.contas_bancarias && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conta Bancária</span>
                      <span className="font-medium">{conta.contas_bancarias.banco}</span>
                    </div>
                  )}
                  {conta.chave_pix && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Chave PIX</span>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyPix}>
                        <Copy className="h-3 w-3" /> {conta.chave_pix}
                      </Button>
                    </div>
                  )}
                  {conta.link_boleto && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Boleto</span>
                      <a href={conta.link_boleto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> Abrir Boleto
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Boletos vinculados */}
              {boletos.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> Boletos Emitidos
                    </h4>
                    {boletos.map((b: any) => (
                      <div key={b.id} className="p-3 rounded-lg border bg-muted/20 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">Nº {b.numero}</span>
                          <Badge variant="outline" className="text-xs">{b.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">Venc: {formatDate(b.vencimento)} • {formatCurrency(b.valor)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Acordos vinculados */}
              {acordos.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Handshake className="h-4 w-4" /> Acordos de Parcelamento
                    </h4>
                    {acordos.map((a: any) => (
                      <div key={a.id} className="p-3 rounded-lg border bg-muted/20 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{a.numero_acordo}</span>
                          <Badge variant="outline" className="text-xs">{a.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {a.numero_parcelas}x de {formatCurrency(a.valor_parcela)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Observações */}
              {conta.observacoes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{conta.observacoes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 space-y-1">
              {auditHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  {auditHistory.map((item: any, i: number) => (
                    <div key={item.id} className="relative pl-10 pb-4">
                      <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <div className="text-sm">
                        <p className="font-medium">{operacaoLabels[item.operacao] || item.operacao}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                        {item.dados_novos && item.operacao === 'UPDATE' && (
                          <div className="mt-1 p-2 rounded bg-muted/30 text-xs space-y-0.5">
                            {Object.entries(item.dados_novos as Record<string, unknown>).slice(0, 5).map(([key, val]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-muted-foreground">{key}:</span>
                                <span>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cobrancas" className="mt-0 space-y-3">
              {cobrancas.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma cobrança enviada</p>
                  {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => onEnviarCobranca(conta)}>
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar Cobrança
                    </Button>
                  )}
                </div>
              ) : cobrancas.map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs gap-1">
                      {c.canal === 'whatsapp' && <MessageCircle className="h-3 w-3" />}
                      {c.canal === 'email' && <Send className="h-3 w-3" />}
                      {c.canal?.toUpperCase() || 'N/A'}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      c.status === 'enviado' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                    )}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Etapa: {getEtapaCobrancaLabel(c.etapa || '')}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="anexos" className="mt-0 space-y-3">
              {anexos.length === 0 ? (
                <div className="text-center py-8">
                  <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum anexo encontrado</p>
                </div>
              ) : anexos.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.nome_arquivo}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </a>
                  )}
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
