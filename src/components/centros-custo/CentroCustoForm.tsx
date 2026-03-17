import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useCriarCentroCusto, useAtualizarCentroCusto, type CentroCusto } from '@/hooks/useCentrosCusto';
import { logger } from '@/lib/logger';

const formSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(10, 'Máximo 10 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional(),
  parent_id: z.string().optional(),
  responsavel: z.string().max(100).optional(),
  orcamento_previsto: z.coerce.number().min(0, 'Valor deve ser positivo'),
  ativo: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CentroCustoFormProps {
  centroCusto?: CentroCusto | null;
  centrosCusto: CentroCusto[];
  defaultParentId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CentroCustoForm({ centroCusto, centrosCusto, defaultParentId, onSuccess, onCancel }: CentroCustoFormProps) {
  const criarCentroCusto = useCriarCentroCusto();
  const atualizarCentroCusto = useAtualizarCentroCusto();
  const isEditing = !!centroCusto;

  // Filter out the current centro and its children to prevent circular references
  const availableParents = centrosCusto.filter(c => {
    if (!centroCusto) return true;
    if (c.id === centroCusto.id) return false;
    // Prevent selecting children as parents
    if (c.parent_id === centroCusto.id) return false;
    return true;
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: centroCusto?.codigo || '',
      nome: centroCusto?.nome || '',
      descricao: centroCusto?.descricao || '',
      parent_id: centroCusto?.parent_id || defaultParentId || undefined,
      responsavel: centroCusto?.responsavel || '',
      orcamento_previsto: centroCusto?.orcamento_previsto || 0,
      ativo: centroCusto?.ativo ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        codigo: values.codigo,
        nome: values.nome,
        descricao: values.descricao || null,
        parent_id: values.parent_id || null,
        responsavel: values.responsavel || null,
        orcamento_previsto: values.orcamento_previsto,
        ativo: values.ativo,
      };

      if (isEditing && centroCusto) {
        await atualizarCentroCusto.mutateAsync({ id: centroCusto.id, data });
      } else {
        await criarCentroCusto.mutateAsync(data);
      }
      onSuccess();
    } catch (error: unknown) {
      logger.error('Erro ao salvar centro de custo:', error);
    }
  };

  const isLoading = criarCentroCusto.isPending || atualizarCentroCusto.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input placeholder="CC001" {...field} maxLength={10} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do centro de custo" {...field} />
                </FormControl>
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição detalhada do centro de custo..."
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro Pai (Hierarquia)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro pai (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhum (Raiz)</SelectItem>
                    {availableParents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.codigo} - {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orcamento_previsto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orçamento Previsto *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status Ativo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Centros inativos não aparecem em relatórios e lançamentos
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Centro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
