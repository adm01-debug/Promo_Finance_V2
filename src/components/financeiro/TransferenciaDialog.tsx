import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Building2, Landmark, Wallet } from 'lucide-react';
import { useContasBancarias, useEmpresas } from '@/hooks/useFinancialData';
import { toast } from 'sonner';

const transferenciaSchema = z.object({
  empresa_id: z.string().min(1, 'Selecione a empresa'),
  conta_origem_id: z.string().min(1, 'Selecione a conta de origem'),
  conta_destino_id: z.string().min(1, 'Selecione a conta de destino'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  data_transferencia: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().optional(),
}).refine(data => data.conta_origem_id !== data.conta_destino_id, {
  message: "As contas de origem e destino devem ser diferentes",
  path: ["conta_destino_id"],
});

type TransferenciaFormData = z.infer<typeof transferenciaSchema>;

interface TransferenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferenciaDialog({ open, onOpenChange }: TransferenciaDialogProps) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresas();
  const { data: contas = [] } = useContasBancarias();

  const form = useForm<TransferenciaFormData>({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: {
      valor: 0,
      data_transferencia: new Date().toISOString().split('T')[0],
      descricao: 'Transferência interna',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: TransferenciaFormData) => {
      const { error } = await supabase
        .from('transferencias')
        .insert({
          empresa_id: data.empresa_id,
          conta_origem_id: data.conta_origem_id,
          conta_destino_id: data.conta_destino_id,
          valor: data.valor,
          data_transferencia: data.data_transferencia,
          descricao: data.descricao,
          status: 'concluido'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias'] });
      qc.invalidateQueries({ queryKey: ['contas-bancarias'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
      toast.success('Transferência realizada com sucesso');
      onOpenChange(false);
      form.reset();
    },
    onError: (e: any) => {
      toast.error('Erro ao realizar transferência: ' + e.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none bg-background/80 backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Nova Transferência entre Contas
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="empresa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> Empresa
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conta_origem_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Débito" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {contas.filter(c => !form.watch('empresa_id') || c.empresa_id === form.watch('empresa_id')).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.banco} - {c.conta}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conta_destino_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Crédito" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {contas.filter(c => !form.watch('empresa_id') || c.empresa_id === form.watch('empresa_id')).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.banco} - {c.conta}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_transferencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Motivo</FormLabel>
                  <FormControl><Input placeholder="Ex: Aporte capital, Reequilíbrio..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processando...' : 'Confirmar Transferência'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
