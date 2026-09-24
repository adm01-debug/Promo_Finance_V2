import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { ConfirmDialog } from './confirm-dialog';
import { cn } from '@/lib/utils';

interface BulkActionConfirm {
  title: string;
  description: string;
  confirmLabel?: string;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: () => void;
  /**
   * Quando presente, o clique abre um ConfirmDialog em vez de disparar
   * `onClick` direto — para ações destrutivas em lote (ex.: cancelar,
   * ignorar) onde um clique acidental afeta vários registros de uma vez.
   */
  confirm?: BulkActionConfirm;
}

interface BulkActionsBarProps {
  selectedCount: number;
  isProcessing?: boolean;
  progress?: number;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  isProcessing = false,
  progress = 0,
  actions,
  onClear,
  className,
}: BulkActionsBarProps) {
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const handleActionClick = (action: BulkAction) => {
    if (action.confirm) {
      setPendingAction(action);
      return;
    }
    action.onClick();
  };

  const handleConfirmPendingAction = () => {
    pendingAction?.onClick();
    setPendingAction(null);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed z-50",
            // Desktop: centered at bottom
            "md:bottom-6 md:left-1/2 md:-translate-x-1/2",
            // Mobile: full width at bottom with safe area
            "bottom-20 left-4 right-4 md:left-auto md:right-auto",
            "bg-popover border shadow-lg rounded-xl p-3",
            "flex flex-col md:flex-row items-stretch md:items-center gap-3",
            className
          )}
        >
          {/* Header row: Selection count + clear button */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
            
            {/* Clear button - visible on mobile header */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={isProcessing}
              className="h-8 w-8 md:hidden"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Progress bar (when processing) */}
          {isProcessing && (
            <div className="flex items-center gap-2 min-w-[150px]">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          )}

          {/* Action buttons - grid on mobile, flex on desktop */}
          {!isProcessing && (
            <div className="grid grid-cols-2 md:flex items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gap-2 text-xs md:text-sm"
                >
                  {action.icon}
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Clear selection - desktop only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isProcessing}
            className="hidden md:flex h-8 w-8"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      )}
      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
        title={pendingAction?.confirm?.title ?? ''}
        description={pendingAction?.confirm?.description}
        confirmLabel={pendingAction?.confirm?.confirmLabel ?? 'Confirmar'}
        variant={pendingAction?.variant === 'destructive' ? 'danger' : 'default'}
        onConfirm={handleConfirmPendingAction}
      />
    </AnimatePresence>
  );
}
