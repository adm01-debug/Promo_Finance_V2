import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, DollarSign, Calendar, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useContasBancarias } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';
import { toastReceiptSuccess } from '@/lib/toast-confetti';
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
import { cn } from '@/lib/utils';

interface ContaReceber {
  id: string;
  cliente_nome: string;
  descricao: string;
  valor: number;
  valor_recebido: number | null;
  data_vencimento: string;
  status: string;
}

interface RegistrarRecebimentoDialogProps {
  conta: ContaReceber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recebimentoSchema = z.object({
  valor_recebido: z.number().positive('Valor deve ser maior que zero'),
  data_recebimento: z.string().min(1, 'Data é obrigatória'),
  conta_bancaria_id: z.string().optional(),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
});

type RecebimentoFormData = z.infer<typeof recebimentoSchema>;

const tiposRecebimento = [
  { value: 'total', label: 'Recebimento Total', icon: DollarSign },
  { value: 'parcial', label: 'Recebimento Parcial', icon: Wallet },
];

export function RegistrarRecebimentoDialog({ conta, open, onOpenChange }: RegistrarRecebimentoDialogProps) {
  const queryClient = useQueryClient();
  const [tipoRecebimento, setTipoRecebimento] = useState<'total' | 'parcial'>('total');
  const { data: contasBancarias = [] } = useContasBancarias();

  const saldoRestante = conta ? conta.valor - (conta.valor_recebido || 0) : 0;
  const percentualRecebido = conta ? ((conta.valor_recebido || 0) / conta.valor) * 100 : 0;

  const form = useForm<RecebimentoFormData>({
    resolver: zodResolver(recebimentoSchema),
    defaultValues: {
      valor_recebido: saldoRestante,
      data_recebimento: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  useEffect(() => {
    if (conta && open) {
      const saldo = conta.valor - (conta.valor_recebido || 0);
      form.reset({
        valor_recebido: tipoRecebimento === 'total' ? saldo : 0,
        data_recebimento: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    }
  }, [conta, open, tipoRecebimento, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: RecebimentoFormData) => {
      if (!conta) throw new Error('Conta não encontrada');

      const valorRecebidoAtual = conta.valor_recebido || 0;
      const novoValorRecebido = valorRecebidoAtual + data.valor_recebido;
      const isRecebidoTotal = novoValorRecebido >= conta.valor;

      const { error } = await supabase
        .from('contas_receber')
        .update({
          valor_recebido: novoValorRecebido,
          data_recebimento: data.data_recebimento,
          conta_bancaria_id: data.conta_bancaria_id || null,
          status: isRecebidoTotal ? 'pago' : 'parcial',
          observacoes: data.observacoes 
            ? `${conta.descricao ? conta.descricao + ' | ' : ''}Recebimento: ${data.observacoes}`
            : undefined,
        })
        .eq('id', conta.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      sounds.success();
      haptic('success');
      // Use confetti toast for successful receipt
      toastReceiptSuccess(formatCurrency(form.getValues('valor_recebido')));
      onOpenChange(false);
    },
    onError: (error) => {
      sounds.error();
      haptic('error');
      console.error('Error registering receipt:', error);
      toast({
        title: 'Erro ao registrar recebimento',
        description: 'Não foi possível registrar o recebimento. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RecebimentoFormData) => {
    if (data.valor_recebido > saldoRestante) {
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
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            Registrar Recebimento
          </DialogTitle>
          <DialogDescription className="text-left">
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">{conta.cliente_nome}</p>
              <p className="text-sm text-muted-foreground truncate">{conta.descricao}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Valor Total:</span>
                <span className="font-semibold text-foreground">{formatCurrency(conta.valor)}</span>
              </div>
              {(conta.valor_recebido || 0) > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Já Recebido:</span>
                    <span className="text-success font-medium">{formatCurrency(conta.valor_recebido || 0)}</span>
                  </div>
                  <Progress value={percentualRecebido} className="h-2 mt-2" />
                </>
              )}
              <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-border">
                <span className="font-medium">Saldo Restante:</span>
                <span className="font-bold text-foreground">{formatCurrency(saldoRestante)}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Tipo de Recebimento */}
            <div className="flex gap-3">
              {tiposRecebimento.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tipoRecebimento === tipo.value;
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
                      setTipoRecebimento(tipo.value as 'total' | 'parcial');
                      if (tipo.value === 'total') {
                        form.setValue('valor_recebido', saldoRestante);
                      } else {
                        form.setValue('valor_recebido', 0);
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
              name="valor_recebido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Recebimento *</FormLabel>
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
                        disabled={tipoRecebimento === 'total'}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data do Recebimento */}
            <FormField
              control={form.control}
              name="data_recebimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Recebimento *</FormLabel>
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
                    <Textarea {...field} placeholder="Observações do recebimento (opcional)" className="min-h-[60px]" />
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
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Recebimento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
