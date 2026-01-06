import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, DollarSign, Calendar, Wallet, CreditCard, Building2, Banknote, QrCode, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useContasBancarias } from '@/hooks/useFinancialData';
import { useConfiguracaoAprovacao, useCriarSolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { toast } from '@/hooks/use-toast';
import { toastPaymentSuccess } from '@/lib/toast-confetti';
import { sounds } from '@/lib/sound-feedback';
import { haptic } from '@/lib/haptic-feedback';
import { formatCurrency } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContaPagar {
  id: string;
  fornecedor_nome: string;
  descricao: string;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  status: string;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
}

interface RegistrarPagamentoDialogProps {
  conta: ContaPagar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pagamentoSchema = z.object({
  valor_pago: z.number().positive('Valor deve ser maior que zero'),
  data_pagamento: z.string().min(1, 'Data é obrigatória'),
  conta_bancaria_id: z.string().optional(),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
});

type PagamentoFormData = z.infer<typeof pagamentoSchema>;

const tiposPagamento = [
  { value: 'total', label: 'Pagamento Total', icon: DollarSign },
  { value: 'parcial', label: 'Pagamento Parcial', icon: Wallet },
];

export function RegistrarPagamentoDialog({ conta, open, onOpenChange }: RegistrarPagamentoDialogProps) {
  const queryClient = useQueryClient();
  const [tipoPagamento, setTipoPagamento] = useState<'total' | 'parcial'>('total');
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: configAprovacao } = useConfiguracaoAprovacao();
  const criarSolicitacaoMutation = useCriarSolicitacaoAprovacao();

  const saldoRestante = conta ? conta.valor - (conta.valor_pago || 0) : 0;
  const percentualPago = conta ? ((conta.valor_pago || 0) / conta.valor) * 100 : 0;

  // Check if this payment requires approval
  const requerAprovacao = useMemo(() => {
    if (!conta || !configAprovacao?.ativo) return false;
    return conta.valor >= configAprovacao.valor_minimo_aprovacao;
  }, [conta, configAprovacao]);

  const estaAprovado = useMemo(() => {
    return conta?.aprovado_por != null && conta?.aprovado_em != null;
  }, [conta]);

  // Check if there's a pending approval request
  const { data: solicitacaoPendente } = useQuery({
    queryKey: ['solicitacao-pendente', conta?.id],
    queryFn: async () => {
      if (!conta) return null;
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select('*')
        .eq('conta_pagar_id', conta.id)
        .order('solicitado_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!conta && requerAprovacao,
  });

  const aprovacaoBloqueada = requerAprovacao && !estaAprovado;
  const temSolicitacaoPendente = solicitacaoPendente?.status === 'pendente';
  const solicitacaoRejeitada = solicitacaoPendente?.status === 'rejeitado';

  const form = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      valor_pago: saldoRestante,
      data_pagamento: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  useEffect(() => {
    if (conta && open) {
      const saldo = conta.valor - (conta.valor_pago || 0);
      form.reset({
        valor_pago: tipoPagamento === 'total' ? saldo : 0,
        data_pagamento: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    }
  }, [conta, open, tipoPagamento, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: PagamentoFormData) => {
      if (!conta) throw new Error('Conta não encontrada');

      // Validate approval requirement
      if (aprovacaoBloqueada) {
        throw new Error('Este pagamento requer aprovação antes de ser efetuado.');
      }

      const valorPagoAtual = conta.valor_pago || 0;
      const novoValorPago = valorPagoAtual + data.valor_pago;
      const isPagoTotal = novoValorPago >= conta.valor;

      const { error } = await supabase
        .from('contas_pagar')
        .update({
          valor_pago: novoValorPago,
          data_pagamento: data.data_pagamento,
          conta_bancaria_id: data.conta_bancaria_id || null,
          status: isPagoTotal ? 'pago' : 'parcial',
          observacoes: data.observacoes 
            ? `${conta.descricao ? conta.descricao + ' | ' : ''}Pagamento: ${data.observacoes}`
            : undefined,
        })
        .eq('id', conta.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      sounds.success();
      haptic('success');
      // Use confetti toast for successful payment
      toastPaymentSuccess(formatCurrency(form.getValues('valor_pago')));
      onOpenChange(false);
    },
    onError: (error) => {
      sounds.error();
      haptic('error');
      console.error('Error registering payment:', error);
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message || 'Não foi possível registrar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSolicitarAprovacao = () => {
    if (!conta) return;
    criarSolicitacaoMutation.mutate(
      { contaPagarId: conta.id, observacoes: form.getValues('observacoes') },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['solicitacao-pendente', conta.id] });
        },
      }
    );
  };

  const onSubmit = (data: PagamentoFormData) => {
    if (aprovacaoBloqueada) {
      toast({
        title: 'Aprovação necessária',
        description: 'Este pagamento requer aprovação antes de ser efetuado.',
        variant: 'destructive',
      });
      return;
    }
    
    if (data.valor_pago > saldoRestante) {
      toast({
        title: 'Valor inválido',
        description: `O valor não pode ser maior que o saldo restante (${formatCurrency(saldoRestante)})`,
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate(data);
  };

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription className="text-left">
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">{conta.fornecedor_nome}</p>
              <p className="text-sm text-muted-foreground truncate">{conta.descricao}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Valor Total:</span>
                <span className="font-semibold text-foreground">{formatCurrency(conta.valor)}</span>
              </div>
              {(conta.valor_pago || 0) > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Já Pago:</span>
                    <span className="text-success font-medium">{formatCurrency(conta.valor_pago || 0)}</span>
                  </div>
                  <Progress value={percentualPago} className="h-2 mt-2" />
                </>
              )}
              <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-border">
                <span className="font-medium">Saldo Restante:</span>
                <span className="font-bold text-foreground">{formatCurrency(saldoRestante)}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Approval Status Alert */}
        {requerAprovacao && (
          <div className="space-y-3">
            {estaAprovado ? (
              <Alert className="border-success/50 bg-success/10">
                <ShieldCheck className="h-4 w-4 text-success" />
                <AlertTitle className="text-success">Pagamento Aprovado</AlertTitle>
                <AlertDescription>
                  Este pagamento foi aprovado e pode ser efetuado.
                </AlertDescription>
              </Alert>
            ) : temSolicitacaoPendente ? (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Aguardando Aprovação</AlertTitle>
                <AlertDescription>
                  Uma solicitação de aprovação foi enviada e está pendente de análise.
                </AlertDescription>
              </Alert>
            ) : solicitacaoRejeitada ? (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Aprovação Rejeitada</AlertTitle>
                <AlertDescription>
                  A solicitação anterior foi rejeitada: {solicitacaoPendente?.motivo_rejeicao || 'Sem motivo informado'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Aprovação Necessária</AlertTitle>
                <AlertDescription>
                  Pagamentos acima de {formatCurrency(configAprovacao?.valor_minimo_aprovacao || 0)} requerem aprovação prévia.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Tipo de Pagamento */}
            <div className="flex gap-3">
              {tiposPagamento.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tipoPagamento === tipo.value;
                return (
                  <Button
                    key={tipo.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 gap-2 transition-all',
                      isSelected && 'shadow-lg shadow-primary/25'
                    )}
                    onClick={() => {
                      setTipoPagamento(tipo.value as 'total' | 'parcial');
                      if (tipo.value === 'total') {
                        form.setValue('valor_pago', saldoRestante);
                      } else {
                        form.setValue('valor_pago', 0);
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {tipo.label}
                  </Button>
                );
              })}
            </div>

            {/* Valor */}
            <FormField
              control={form.control}
              name="valor_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Pagamento *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saldoRestante}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={tipoPagamento === 'total'}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data do Pagamento */}
            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Pagamento *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="date" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conta Bancária */}
            <FormField
              control={form.control}
              name="conta_bancaria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contasBancarias.map((cb: any) => (
                        <SelectItem key={cb.id} value={cb.id}>
                          {cb.banco} - Ag: {cb.agencia} / CC: {cb.conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações do pagamento (opcional)" className="min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {/* Show "Request Approval" button if approval is required but not granted */}
              {aprovacaoBloqueada && !temSolicitacaoPendente ? (
                <Button
                  type="button"
                  onClick={handleSolicitarAprovacao}
                  disabled={criarSolicitacaoMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-warning to-warning/80 shadow-lg shadow-warning/25 text-warning-foreground"
                >
                  {criarSolicitacaoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <ShieldCheck className="h-4 w-4" />
                  Solicitar Aprovação
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || aprovacaoBloqueada}
                  className="gap-2 bg-gradient-to-r from-success to-success/80 shadow-lg shadow-success/25 text-success-foreground"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar Pagamento
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
