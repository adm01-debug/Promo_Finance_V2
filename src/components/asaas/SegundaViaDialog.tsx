// ============================================
// DIALOG: Segunda Via Boleto ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asaasId: string;
  empresaId?: string;
}

export function SegundaViaDialog({ open, onOpenChange, asaasId, empresaId }: Props) {
  const { segundaViaBoleto } = useAsaas(empresaId);
  const [novaData, setNovaData] = useState('');

  const handleGerar = async () => {
    if (!novaData) {
      toast.error('Informe a nova data de vencimento');
      return;
    }

    try {
      await segundaViaBoleto.mutateAsync({
        asaas_id: asaasId,
        nova_data_vencimento: novaData,
      });
      setNovaData('');
      onOpenChange(false);
    } catch { /* hook handles */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Segunda Via
          </DialogTitle>
          <DialogDescription>Gere uma segunda via com nova data de vencimento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nova data de vencimento *</Label>
            <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <Button className="w-full" onClick={handleGerar} disabled={segundaViaBoleto.isPending || !novaData}>
            {segundaViaBoleto.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
            ) : (
              <>Gerar Segunda Via</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
