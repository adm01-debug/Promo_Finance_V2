/**
 * Animated Modal - Modal com animações suaves e variantes avançadas
 */

import { ReactNode, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animation?: 'scale' | 'slide-up' | 'slide-down' | 'fade' | 'flip' | 'rotate';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  overlayBlur?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

const animations = {
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 60 },
  },
  'slide-down': {
    initial: { opacity: 0, y: -60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -60 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  flip: {
    initial: { opacity: 0, rotateX: -15, perspective: 1000 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: 15 },
  },
  rotate: {
    initial: { opacity: 0, rotate: -5, scale: 0.95 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 5, scale: 0.95 },
  },
};

export function AnimatedModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  animation = 'scale',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  overlayBlur = true,
}: AnimatedModalProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const animationConfig = shouldReduceMotion ? animations.fade : animations[animation];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 bg-black/50",
              overlayBlur && "backdrop-blur-sm"
            )}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            {...animationConfig}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30,
            }}
            className={cn(
              'relative w-full rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border/50',
              sizeClasses[size],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Close button */}
            {showCloseButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-3 top-3 rounded-full hover:bg-muted"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Header */}
            {(title || description) && (
              <motion.div 
                className="mb-4 pr-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </motion.div>
            )}

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Confirm Modal - Para confirmações
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const icons = {
    default: <Info className="h-6 w-6 text-primary" />,
    destructive: <AlertTriangle className="h-6 w-6 text-destructive" />,
    warning: <AlertCircle className="h-6 w-6 text-warning" />,
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      animation="scale"
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center mb-4",
            variant === 'default' && "bg-primary/10",
            variant === 'destructive' && "bg-destructive/10",
            variant === 'warning' && "bg-warning/10"
          )}
        >
          {icons[variant]}
        </motion.div>

        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}

        <div className="flex gap-3 mt-6 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );
}

// ============================================================================
// Success Modal - Para feedback de sucesso
// ============================================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  buttonText?: string;
  autoClose?: number;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  buttonText = 'Continuar',
  autoClose,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      animation="scale"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          >
            <CheckCircle2 className="h-8 w-8 text-success" />
          </motion.div>
        </motion.div>

        <motion.h3 
          className="text-lg font-semibold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {title}
        </motion.h3>
        
        {description && (
          <motion.p 
            className="text-sm text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}

        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button onClick={onClose} className="w-full">
            {buttonText}
          </Button>
        </motion.div>
      </div>
    </AnimatedModal>
  );
}

// ============================================================================
// Drawer Modal - Modal que desliza de baixo (mobile-friendly)
// ============================================================================

interface DrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function DrawerModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: DrawerModalProps) {
  const [dragY, setDragY] = useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: dragY }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
              setDragY(0);
            }}
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 pt-2 max-h-[90vh] overflow-auto",
              className
            )}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {title && (
              <h3 className="text-lg font-semibold mb-4">{title}</h3>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Full Screen Modal
// ============================================================================

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function FullScreenModal({
  isOpen,
  onClose,
  children,
  className,
}: FullScreenModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn("h-full overflow-auto", className)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="fixed right-4 top-4 z-10 rounded-full bg-muted/80 backdrop-blur-sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedModal;
