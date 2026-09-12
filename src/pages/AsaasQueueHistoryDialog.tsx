import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface QueueHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: Record<string, unknown>[] | null;
}

export function QueueHistoryDialog({ isOpen, onClose, logs }: QueueHistoryDialogProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de Falhas (Fila)"
      message={
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {logs?.map((log, index) => (
            <div key={index} className="p-3 bg-muted/20 rounded-md border text-xs">
              <div className="flex justify-between font-bold mb-1">
                <span>Tentativa #{String(log.attempt)}</span>
                <span className="text-muted-foreground">
                  {format(parseISO(String(log.timestamp)), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
              <p className="text-destructive font-mono">{String(log.message)}</p>
            </div>
          ))}
        </div>
      }
      confirmText="Entendido"
      onConfirm={onClose}
    />
  );
}
