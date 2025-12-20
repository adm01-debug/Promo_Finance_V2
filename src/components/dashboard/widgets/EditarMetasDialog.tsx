import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Target, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { useMetasFinanceiras } from '@/hooks/useMetasFinanceiras';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface EditarMetasDialogProps {
  onClose?: () => void;
}

export const EditarMetasDialog = ({ onClose }: EditarMetasDialogProps) => {
  const [open, setOpen] = useState(false);
  const { metas, isLoading, upsertMeta, getMetaByTipo, mesAtual, anoAtual } = useMetasFinanceiras();
  
  const [metaReceita, setMetaReceita] = useState<string>('');
  const [metaDespesa, setMetaDespesa] = useState<string>('');
  const [metaInadimplencia, setMetaInadimplencia] = useState<string>('');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setMetaReceita(getMetaByTipo('receita').toString());
      setMetaDespesa(getMetaByTipo('despesa').toString());
      setMetaInadimplencia(getMetaByTipo('inadimplencia').toString());
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    const mutations = [];

    if (metaReceita) {
      mutations.push(
        upsertMeta.mutateAsync({
          tipo: 'receita',
          titulo: 'Meta de Receitas',
          valor_meta: parseFloat(metaReceita),
          mes: mesAtual,
          ano: anoAtual,
        })
      );
    }

    if (metaDespesa) {
      mutations.push(
        upsertMeta.mutateAsync({
          tipo: 'despesa',
          titulo: 'Limite de Despesas',
          valor_meta: parseFloat(metaDespesa),
          mes: mesAtual,
          ano: anoAtual,
        })
      );
    }

    if (metaInadimplencia) {
      mutations.push(
        upsertMeta.mutateAsync({
          tipo: 'inadimplencia',
          titulo: 'Inadimplência Máxima',
          valor_meta: parseFloat(metaInadimplencia),
          mes: mesAtual,
          ano: anoAtual,
        })
      );
    }

    await Promise.all(mutations);
    setOpen(false);
    onClose?.();
  };

  const metaItems = [
    {
      id: 'receita',
      label: 'Meta de Receitas',
      description: 'Valor que deseja receber no mês',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      value: metaReceita,
      setValue: setMetaReceita,
      prefix: 'R$',
      placeholder: '150000',
    },
    {
      id: 'despesa',
      label: 'Limite de Despesas',
      description: 'Valor máximo de despesas no mês',
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      value: metaDespesa,
      setValue: setMetaDespesa,
      prefix: 'R$',
      placeholder: '100000',
    },
    {
      id: 'inadimplencia',
      label: 'Inadimplência Máxima',
      description: 'Percentual máximo tolerado de inadimplência',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      value: metaInadimplencia,
      setValue: setMetaInadimplencia,
      prefix: '%',
      placeholder: '5',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Configurar Metas do Mês
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Defina as metas financeiras para {new Date(anoAtual, mesAtual - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
          </p>

          {metaItems.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded-md', item.bgColor)}>
                  <item.icon className={cn('h-4 w-4', item.color)} />
                </div>
                <div>
                  <Label htmlFor={item.id} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {item.prefix}
                </span>
                <Input
                  id={item.id}
                  type="number"
                  value={item.value}
                  onChange={(e) => item.setValue(e.target.value)}
                  placeholder={item.placeholder}
                  className="pl-10"
                  min={0}
                  step={item.id === 'inadimplencia' ? '0.1' : '1000'}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsertMeta.isPending}>
            {upsertMeta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Metas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
