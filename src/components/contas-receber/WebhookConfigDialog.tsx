import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WebhookConfigPanel } from './WebhookConfigPanel';
import { WebhookDlqPanel } from './WebhookDlqPanel';
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
        <div className="py-4 space-y-6">
          <WebhookConfigPanel />
          {/*
            O painel acima mostra `webhooks_log` -- o que CHEGOU. A fila de
            falhas (`webhook_dlq`) nao tinha tela nenhuma: webhook de cobranca
            que esgota as tentativas saia de cena sem aviso.
          */}
          <WebhookDlqPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
