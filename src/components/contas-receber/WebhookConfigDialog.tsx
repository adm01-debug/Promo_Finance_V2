
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WebhookConfigPanel } from './WebhookConfigPanel';
import { Settings } from 'lucide-react';

interface WebhookConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookConfigDialog({ open, onOpenChange }: WebhookConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black italic tracking-tight">
            <Settings className="h-5 w-5 text-primary" /> Configurador de Integração API
          </DialogTitle>
          <DialogDescription className="text-sm font-medium opacity-60">
            Gerencie endpoints e visualize logs de recepção em tempo real.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <WebhookConfigPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
