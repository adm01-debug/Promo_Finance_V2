import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCategoria, useUpdateCategoria, CATEGORY_COLORS, CATEGORY_ICONS } from '@/hooks/useCategorias';
import { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

const categoriaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['receita', 'despesa']),
  cor: z.string().optional(),
  icone: z.string().optional(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

interface CategoriaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: any;
  defaultType?: 'receita' | 'despesa';
}

export function CategoriaForm({ open, onOpenChange, categoria, defaultType = 'despesa' }: CategoriaFormProps) {
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      tipo: defaultType,
      cor: CATEGORY_COLORS[0],
      icone: 'tag',
    },
  });

  useEffect(() => {
    if (categoria) {
      form.reset({
        nome: categoria.nome,
        tipo: categoria.tipo,
        cor: categoria.cor || CATEGORY_COLORS[0],
        icone: categoria.icone || 'tag',
      });
    } else {
      form.reset({
        nome: '',
        tipo: defaultType,
        cor: CATEGORY_COLORS[0],
        icone: 'tag',
      });
    }
  }, [categoria, open, form, defaultType]);

  const onSubmit = async (data: CategoriaFormData) => {
    if (categoria) {
      await updateMutation.mutateAsync({ id: categoria.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Alimentação, Aluguel..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Cor</FormLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      form.watch('cor') === color ? "border-primary scale-110 shadow-md" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => form.setValue('cor', color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Ícone</FormLabel>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 border rounded-md">
                {CATEGORY_ICONS.map((iconName) => {
                  // @ts-ignore
                  const IconComponent = Icons[iconName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || Icons.Tag;
                  return (
                    <Button
                      key={iconName}
                      type="button"
                      variant={form.watch('icone') === iconName ? 'default' : 'outline'}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => form.setValue('icone', iconName)}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {categoria ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
