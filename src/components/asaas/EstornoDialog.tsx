// ============================================
// DIALOG: Estorno de Cobrança ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Undo2 } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asaasId: string;
  valorOriginal: number;
  empresaId?: string;
}

export function EstornoDialog({ open, onOpenChange, asaasId, valorOriginal, empresaId }: Props) {
  const { estornarCobranca } = useAsaas(empresaId);
  const [valorEstorno, setValorEstorno] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleEstornar = async () => {
    const valor = valorEstorno ? parseFloat(valorEstorno) : undefined;
    if (valor !== undefined && (isNaN(valor) || valor <= 0 || valor > valorOriginal)) {
      toast.error(`Valor deve ser entre R$ 0,01 e ${formatCurrency(valorOriginal)}`);
      return;
    }

    try {
      await estornarCobranca.mutateAsync({
        asaas_id: asaasId,
        valor,
        descricao: descricao || undefined,
      });
      setValorEstorno(''); setDescricao('');
      onOpenChange(false);
    } catch { /* hook handles */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" /> Estornar Cobrança
          </DialogTitle>
          <DialogDescription>
            Valor original: {formatCurrency(valorOriginal)}. Deixe vazio para estorno total.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Valor do estorno (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={valorOriginal}
              value={valorEstorno}
              onChange={e => setValorEstorno(e.target.value)}
              placeholder={`Estorno total: ${formatCurrency(valorOriginal)}`}
            />
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Motivo do estorno..." rows={2} />
          </div>
          <Button className="w-full" variant="destructive" onClick={handleEstornar} disabled={estornarCobranca.isPending}>
            {estornarCobranca.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Estornando...</>
            ) : (
              <><Undo2 className="h-4 w-4 mr-2" /> Confirmar Estorno</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
