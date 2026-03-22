import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Percent, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AplicarDescontoDialogProps {
  conta: { id: string; descricao: string; valor: number; valor_desconto?: number | null; cliente_nome: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AplicarDescontoDialog({ conta, open, onOpenChange }: AplicarDescontoDialogProps) {
  const [tipo, setTipo] = useState<'valor' | 'percentual'>('valor');
  const [valorDesconto, setValorDesconto] = useState(0);
  const [motivo, setMotivo] = useState('');
  const queryClient = useQueryClient();

  const descontoReal = tipo === 'percentual' && conta
    ? Math.round((conta.valor * valorDesconto / 100) * 100) / 100
    : valorDesconto;

  const valorFinal = conta ? conta.valor - descontoReal : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!conta) throw new Error('Conta não encontrada');
      const { error } = await supabase.from('contas_receber').update({
        valor_desconto: descontoReal,
        valor_final: valorFinal,
        observacoes: motivo ? `Desconto: ${motivo}` : undefined,
      }).eq('id', conta.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Desconto aplicado com sucesso!');
      onOpenChange(false);
      setValorDesconto(0);
      setMotivo('');
    },
    onError: () => toast.error('Erro ao aplicar desconto'),
  });

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-warning" />
            </div>
            Aplicar Desconto / Crédito
          </DialogTitle>
          <DialogDescription>
            <span className="block mt-2 p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">{conta.cliente_nome}</span>
              <span className="block text-sm">{conta.descricao} • {formatCurrency(conta.valor)}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo toggle */}
          <div className="flex gap-2">
            <Button type="button" variant={tipo === 'valor' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5"
              onClick={() => setTipo('valor')}>
              <DollarSign className="h-4 w-4" /> Valor fixo
            </Button>
            <Button type="button" variant={tipo === 'percentual' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5"
              onClick={() => setTipo('percentual')}>
              <Percent className="h-4 w-4" /> Percentual
            </Button>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>{tipo === 'valor' ? 'Valor do desconto (R$)' : 'Percentual (%)'}</Label>
            <Input
              type="number"
              step={tipo === 'percentual' ? '0.1' : '0.01'}
              min="0"
              max={tipo === 'percentual' ? '100' : conta.valor}
              value={valorDesconto}
              onChange={e => setValorDesconto(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/30 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Valor original</span><span>{formatCurrency(conta.valor)}</span></div>
            <div className="flex justify-between text-warning"><span>Desconto</span><span>- {formatCurrency(descontoReal)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Valor final</span><span className="text-success">{formatCurrency(valorFinal)}</span></div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Pagamento antecipado, fidelidade..." className="min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => mutation.mutate()} disabled={descontoReal <= 0 || descontoReal > conta.valor || mutation.isPending} className="gap-2">
              <Tag className="h-4 w-4" /> Aplicar Desconto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
