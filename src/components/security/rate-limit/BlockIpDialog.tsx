import { Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BlockIpDialogProps {
  open: boolean;
  ip: string;
  reason: string;
  permanent: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onIpChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onPermanentChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function BlockIpDialog({
  open,
  ip,
  reason,
  permanent,
  isSubmitting,
  onOpenChange,
  onIpChange,
  onReasonChange,
  onPermanentChange,
  onSubmit,
}: BlockIpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear Endereço IP</DialogTitle>
          <DialogDescription>
            Bloqueie um endereço IP para impedir acesso ao sistema
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ip">Endereço IP</Label>
            <Input
              id="ip"
              placeholder="Ex: 192.168.1.1"
              value={ip}
              onChange={(event) => onIpChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              placeholder="Motivo do bloqueio"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="permanent" checked={permanent} onCheckedChange={onPermanentChange} />
            <Label htmlFor="permanent">Bloqueio permanente</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Ban className="h-4 w-4 mr-2" />
            )}
            Bloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
