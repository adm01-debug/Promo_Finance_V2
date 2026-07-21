import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: 'ECD' | 'ECF';
  reciboInput: string;
  onReciboInputChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}

export function SpedTransmissaoDialog({
  open,
  onOpenChange,
  tipo,
  reciboInput,
  onReciboInputChange,
  onConfirm,
  onCancel,
  pending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar transmissão SPED {tipo}</DialogTitle>
          <DialogDescription>
            Cole o nº do recibo gerado pelo PVA-{tipo} após a transmissão oficial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="recibo-historico">Nº do recibo</Label>
          <Input
            id="recibo-historico"
            value={reciboInput}
            onChange={(e) => onReciboInputChange(e.target.value)}
            placeholder="Ex.: 12345678901234567890"
            className="font-mono"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!reciboInput.trim() || pending}>
            Marcar como transmitido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
