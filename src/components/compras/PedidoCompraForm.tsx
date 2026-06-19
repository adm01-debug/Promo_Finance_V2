import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const itemSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  valor_unitario: z.number().min(0, 'Valor unitário não pode ser negativo'),
});

const formSchema = z.object({
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  centro_custo_id: z.string().optional(),
  data_entrega_prevista: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
});

interface PedidoCompraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PedidoCompraForm({ open, onOpenChange }: PedidoCompraFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itens: [{ descricao: '', quantidade: 1, valor_unitario: 0 }],
    },
  });

  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('id, nome_fantasia, razao_social');
      if (error) throw error;
      return data;
    },
  });

  const { data: centrosCusto } = useQuery({
    queryKey: ['centros_custo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_custo').select('id, nome');
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorTotal = values.itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_compra')
        .insert({
          user_id: user.id,
          fornecedor_id: values.fornecedor_id,
          centro_custo_id: values.centro_custo_id,
          data_entrega_prevista: values.data_entrega_prevista,
          observacoes: values.observacoes,
          valor_total: valorTotal,
          status: 'pendente_aprovacao'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const itensParaInserir = values.itens.map(item => ({
        pedido_id: pedido.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido_compra')
        .insert(itensParaInserir);

      if (itensError) throw itensError;

      toast.success('Pedido de compra criado com sucesso!');
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error('Erro ao criar pedido: ' + error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Novo Pedido de Compra</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card/5 border-white/10">
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fornecedores?.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card/5 border-white/10">
                          <SelectValue placeholder="Selecione um centro de custo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centrosCusto?.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Itens do Pedido</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => form.setValue('itens', [...form.getValues('itens'), { descricao: '', quantidade: 1, valor_unitario: 0 }])}
                >
                  Adicionar Item
                </Button>
              </div>

              {form.watch('itens').map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-card/5 rounded-xl border border-white/10">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`itens.${index}.descricao`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold">Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background border-white/10 h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`itens.${index}.quantidade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold">Qtd</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="bg-background border-white/10 h-10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`itens.${index}.valor_unitario`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold">Vlr Unit.</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="bg-background border-white/10 h-10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-card/5 border-white/10 min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary font-black">Gerar Pedido</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
