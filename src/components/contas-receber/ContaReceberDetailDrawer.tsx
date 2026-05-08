import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, FileText, Clock, CheckCircle2,
  AlertTriangle, MessageCircle, Shield, Users, Scale,
  Banknote, QrCode, CreditCard, Wallet, X, Building2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { DrawerDetailsTab } from './DrawerDetailsTab';
import { DrawerTimelineTab } from './DrawerTimelineTab';
import { DrawerCobrancasTab } from './DrawerCobrancasTab';
import { DrawerAnexosTab } from './DrawerAnexosTab';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateOverdueDays, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
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
          <TabsList className="mx-6 mt-3 grid grid-cols-5">
            <TabsTrigger value="detalhes" className="text-[10px] sm:text-xs">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[10px] sm:text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="boletos" className="text-[10px] sm:text-xs">Boletos</TabsTrigger>
            <TabsTrigger value="cobrancas" className="text-[10px] sm:text-xs">Mensagens</TabsTrigger>
            <TabsTrigger value="anexos" className="text-[10px] sm:text-xs">
              Anexos {anexos.length > 0 && <span className="ml-0.5 sm:ml-1 text-[9px] bg-primary/10 text-primary rounded-full px-1.5">{anexos.length}</span>}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="detalhes" className="mt-0">
              <DrawerDetailsTab conta={conta} overdueDays={overdueDays} boletos={boletos} acordos={acordos} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 space-y-4">
              <DrawerTimelineTab auditHistory={auditHistory as any} events={conta.metadata?.events as any[]} />
            </TabsContent>

            <TabsContent value="boletos" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-primary" /> Boletos do Título
                  </h4>
                </div>
                {boletos.length > 0 ? (
                  <div className="space-y-3">
                    {boletos.map((b: any) => (
                      <Card key={b.id} className="p-4 border-white/5 bg-white/[0.02]">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-black tabular-nums tracking-tight">#{b.numero}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{formatDate(b.vencimento)}</p>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] font-black uppercase", b.status === 'pago' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                            {b.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-lg font-black tracking-tighter tabular-nums">{formatCurrency(b.valor)}</p>
                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => window.open(b.link_pdf || '#', '_blank')}>
                            <FileText className="h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-white/5 bg-black/10">
                    <Banknote className="h-8 w-8 text-white/5 mx-auto mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/30">Nenhum boleto gerado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cobrancas" className="mt-0 space-y-3">
              <DrawerCobrancasTab
                cobrancas={cobrancas as any}
                canEnviar={conta.status !== 'pago' && conta.status !== 'cancelado'}
                onEnviarCobranca={() => onEnviarCobranca(conta)}
              />
            </TabsContent>

            <TabsContent value="anexos" className="mt-0 space-y-3">
              <DrawerAnexosTab anexos={anexos as any} />
            </TabsContent>
          </ScrollArea>
        </Tabs>

      </SheetContent>
    </Sheet>
  );
}
