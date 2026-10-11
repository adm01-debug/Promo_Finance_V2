import { ReactNode, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPEN_DIALOG_SELECTOR } from '@/components/navigation/ModalHistoryManager';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape roteado pelo ModalHistoryManager chega direcionado a este
  // elemento (só ele fecha, nunca um dialog de baixo); o listener no
  // documento cobre o caso do gerenciador ausente (ex.: testes).
  useEffect(() => {
    if (isOpen) {
      const el = dialogRef.current;
      const onEscape = (e: KeyboardEvent) => {
        // Só o dialog do topo fecha: um Escape chegando ao documento
        // (topo Radix ou gerenciador ausente) não fecha os de baixo.
        const dialogs = document.querySelectorAll(OPEN_DIALOG_SELECTOR);
        if (dialogs[dialogs.length - 1] !== el) return;
        handleEscape(e);
      };
      el?.addEventListener('keydown', onEscape);
      document.addEventListener('keydown', onEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        el?.removeEventListener('keydown', onEscape);
        document.removeEventListener('keydown', onEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        // Só conta como dialog fechável no histórico se Escape o fecha —
        // o ModalHistoryManager usa Escape para consumir o marcador.
        data-state={closeOnEscape ? 'open' : 'closed'}
        data-escape-owned={closeOnEscape ? '' : undefined}
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative z-50 w-full mx-4 bg-card rounded-lg shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirm Modal preset
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmVariant =
    variant === 'danger' ? 'destructive' : variant === 'warning' ? 'warning' : 'default';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processando...' : ''}
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-muted-foreground">{message}</p>
    </Modal>
  );
}
