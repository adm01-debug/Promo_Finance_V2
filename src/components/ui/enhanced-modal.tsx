/**
 * Enhanced Modal System
 * Sistema de modais avançado com múltiplas variantes e funcionalidades
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button';

// ============================================
// MODAL CONTEXT & PROVIDER
// ============================================

interface ModalInstance {
  id: string;
  component: ReactNode;
  options: ModalOptions;
}

interface ModalContextValue {
  modals: ModalInstance[];
  openModal: (component: ReactNode, options?: ModalOptions) => string;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalOptions {
  id?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'drawer' | 'fullscreen';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventClose?: boolean;
  className?: string;
  overlayClassName?: string;
  onClose?: () => void;
}

const defaultOptions: ModalOptions = {
  size: 'md',
  variant: 'default',
  closeOnOverlay: true,
  closeOnEscape: true,
  showCloseButton: true,
  preventClose: false,
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  const openModal = useCallback((component: ReactNode, options: ModalOptions = {}) => {
    const id = options.id || `modal-${Date.now()}`;
    setModals(prev => [...prev, { id, component, options: { ...defaultOptions, ...options } }]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    setModals(prev => {
      if (id) {
        const modal = prev.find(m => m.id === id);
        modal?.options.onClose?.();
        return prev.filter(m => m.id !== id);
      }
      // Close last modal
      const last = prev[prev.length - 1];
      last?.options.onClose?.();
      return prev.slice(0, -1);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    modals.forEach(m => m.options.onClose?.());
    setModals([]);
  }, [modals]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modals.length > 0) {
        const lastModal = modals[modals.length - 1];
        if (lastModal.options.closeOnEscape && !lastModal.options.preventClose) {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modals, closeModal]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (modals.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modals.length]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
      <ModalRenderer />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
}

// ============================================
// MODAL RENDERER
// ============================================

function ModalRenderer() {
  const { modals, closeModal } = useModal();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw]',
  };

  const getVariantStyles = (variant: string, size: string) => {
    switch (variant) {
      case 'drawer':
        return 'fixed right-0 top-0 h-full max-h-full rounded-l-xl';
      case 'fullscreen':
        return 'fixed inset-4 max-w-none max-h-none rounded-xl';
      default:
        return `${sizeClasses[size as keyof typeof sizeClasses]} w-full rounded-xl`;
    }
  };

  return (
    <AnimatePresence>
      {modals.map((modal, index) => (
        <div key={modal.id} className="fixed inset-0 z-50" style={{ zIndex: 50 + index }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (modal.options.closeOnOverlay && !modal.options.preventClose) {
                closeModal(modal.id);
              }
            }}
            className={cn(
              'fixed inset-0 bg-black/50 backdrop-blur-sm',
              modal.options.overlayClassName
            )}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={cn(
                'relative bg-background shadow-xl overflow-hidden',
                getVariantStyles(modal.options.variant || 'default', modal.options.size || 'md'),
                modal.options.className
              )}
            >
              {modal.options.showCloseButton && !modal.options.preventClose && (
                <button
                  onClick={() => closeModal(modal.id)}
                  className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {modal.component}
            </motion.div>
          </div>
        </div>
      ))}
    </AnimatePresence>
  );
}

// ============================================
// MODAL COMPONENTS
// ============================================

interface ModalProps {
  children: ReactNode;
  className?: string;
}

export function Modal({ children, className }: ModalProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {children}
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

Modal.Header = function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b', className)}>
      {children}
    </div>
  );
};

interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

Modal.Title = function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  );
};

interface ModalDescriptionProps {
  children: ReactNode;
  className?: string;
}

Modal.Description = function ModalDescription({ children, className }: ModalDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  );
};

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

Modal.Body = function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4 flex-1 overflow-auto', className)}>
      {children}
    </div>
  );
};

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

Modal.Footer = function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t flex justify-end gap-2', className)}>
      {children}
    </div>
  );
};

// ============================================
// SPECIALIZED MODALS
// ============================================

interface AlertModalProps {
  title: string;
  description?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  onConfirm?: () => void;
}

export function AlertModal({ 
  title, 
  description, 
  variant = 'info',
  confirmText = 'OK',
  onConfirm 
}: AlertModalProps) {
  const { closeModal } = useModal();

  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };

  const colors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-destructive',
    success: 'text-green-500',
  };

  const Icon = icons[variant];

  return (
    <Modal>
      <Modal.Body className="text-center py-8">
        <div className={cn('mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4', colors[variant])}>
          <Icon className="h-6 w-6" />
        </div>
        <Modal.Title className="text-center">{title}</Modal.Title>
        {description && (
          <Modal.Description className="text-center mt-2">{description}</Modal.Description>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-center">
        <Button onClick={() => { onConfirm?.(); closeModal(); }}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

interface ConfirmModalProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmModal({ 
  title, 
  description,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel 
}: ConfirmModalProps) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm?.();
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        {description && <Modal.Description>{description}</Modal.Description>}
      </Modal.Header>
      <Modal.Footer>
        <Button 
          variant="outline" 
          onClick={() => { onCancel?.(); closeModal(); }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

interface PromptModalProps {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export function PromptModal({ 
  title, 
  description,
  placeholder = '',
  defaultValue = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel 
}: PromptModalProps) {
  const { closeModal } = useModal();
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm?.(value);
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        {description && <Modal.Description>{description}</Modal.Description>}
      </Modal.Header>
      <Modal.Body>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline" 
          onClick={() => { onCancel?.(); closeModal(); }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

interface LoadingModalProps {
  title?: string;
  description?: string;
}

export function LoadingModal({ 
  title = 'Processando...', 
  description 
}: LoadingModalProps) {
  return (
    <Modal>
      <Modal.Body className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <Modal.Title className="text-center">{title}</Modal.Title>
        {description && (
          <Modal.Description className="text-center mt-2">{description}</Modal.Description>
        )}
      </Modal.Body>
    </Modal>
  );
}

// ============================================
// HELPER HOOKS
// ============================================

export function useConfirmModal() {
  const { openModal, closeModal } = useModal();

  return useCallback((props: ConfirmModalProps) => {
    return new Promise<boolean>((resolve) => {
      openModal(
        <ConfirmModal
          {...props}
          onConfirm={async () => {
            await props.onConfirm?.();
            resolve(true);
          }}
          onCancel={() => {
            props.onCancel?.();
            resolve(false);
          }}
        />,
        { size: 'sm', closeOnOverlay: false }
      );
    });
  }, [openModal]);
}

export function useAlertModal() {
  const { openModal } = useModal();

  return useCallback((props: AlertModalProps) => {
    openModal(<AlertModal {...props} />, { size: 'sm' });
  }, [openModal]);
}

export function usePromptModal() {
  const { openModal } = useModal();

  return useCallback((props: PromptModalProps) => {
    return new Promise<string | null>((resolve) => {
      openModal(
        <PromptModal
          {...props}
          onConfirm={async (value) => {
            await props.onConfirm?.(value);
            resolve(value);
          }}
          onCancel={() => {
            props.onCancel?.();
            resolve(null);
          }}
        />,
        { size: 'sm', closeOnOverlay: false }
      );
    });
  }, [openModal]);
}

export function useLoadingModal() {
  const { openModal, closeModal } = useModal();

  const show = useCallback((props?: LoadingModalProps) => {
    return openModal(
      <LoadingModal {...props} />,
      { size: 'sm', closeOnOverlay: false, closeOnEscape: false, showCloseButton: false, preventClose: true }
    );
  }, [openModal]);

  return { show, hide: closeModal };
}
