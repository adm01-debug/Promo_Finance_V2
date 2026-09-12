import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseZodFormReturn } from '@/hooks/useZodForm';
import type { BudgetFormData } from './orcamentos.types';

interface OrcamentosFormDialogProps {
  open: boolean;
  editing: boolean;
  categorias: Array<{ id: string; nome: string }>;
  form: UseZodFormReturn<BudgetFormData>;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrcamentosFormDialog({
  open,
  editing,
  categorias,
  form,
  isSubmitting,
  onOpenChange,
}: OrcamentosFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
          <DialogDescription className="text-foreground/40">
            Defina o limite de gastos para uma categoria específica no período selecionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="orcamento-categoria">Categoria</Label>
            <Select
              value={form.values.category}
              onValueChange={(value) => form.setFieldValue('category', value)}
            >
              <SelectTrigger id="orcamento-categoria" className="bg-card/5 border-border">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.category && <p className="text-xs text-red-500">{form.errors.category}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orcamento-valor">Valor Orçado (R$)</Label>
            <Input
              id="orcamento-valor"
              type="number"
              step="0.01"
              {...form.getFieldProps('budgeted_amount')}
              className="bg-card/5 border-border"
              placeholder="0,00"
            />
            {form.errors.budgeted_amount && (
              <p className="text-xs text-red-500">{form.errors.budgeted_amount}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orcamento-periodo">Período</Label>
            <Input
              id="orcamento-periodo"
              type="month"
              {...form.getFieldProps('period')}
              className="bg-card/5 border-border"
            />
            {form.errors.period && <p className="text-xs text-red-500">{form.errors.period}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground/40"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {editing ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
