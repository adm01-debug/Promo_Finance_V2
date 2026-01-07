/**
 * Confirmation Dialogs
 * Diálogos de confirmação reutilizáveis para ações destrutivas e importantes
 */

import React, { useState, useCallback, ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Trash2, 
  LogOut, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

// ============================================
// TYPES
// ============================================

type ConfirmationType = 'delete' | 'logout' | 'destructive' | 'warning' | 'info' | 'success';

interface ConfirmationConfig {
  type?: ConfirmationType;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmInput?: string; // Text user must type to confirm
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
}

interface ConfirmationState extends ConfirmationConfig {
  isOpen: boolean;
  isLoading: boolean;
  resolve: ((value: boolean) => void) | null;
}

// ============================================
// CONTEXT
// ============================================

interface ConfirmationContextValue {
  confirm: (config: ConfirmationConfig) => Promise<boolean>;
  confirmDelete: (itemName?: string) => Promise<boolean>;
  confirmLogout: () => Promise<boolean>;
  confirmDestructive: (title: string, description?: string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    title: '',
    resolve: null,
  });

  const confirm = useCallback((config: ConfirmationConfig): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...config,
        isOpen: true,
        isLoading: false,
        resolve,
      });
    });
  }, []);

  const confirmDelete = useCallback((itemName?: string): Promise<boolean> => {
    return confirm({
      type: 'delete',
      title: 'Confirmar exclusão',
      description: itemName 
        ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
        : 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
  }, [confirm]);

  const confirmLogout = useCallback((): Promise<boolean> => {
    return confirm({
      type: 'logout',
      title: 'Sair da conta',
      description: 'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
    });
  }, [confirm]);

  const confirmDestructive = useCallback((title: string, description?: string): Promise<boolean> => {
    return confirm({
      type: 'destructive',
      title,
      description,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
  }, [confirm]);

  const handleClose = useCallback((confirmed: boolean) => {
    state.resolve?.(confirmed);
    setState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  return (
    <ConfirmationContext.Provider value={{ confirm, confirmDelete, confirmLogout, confirmDestructive }}>
      {children}
      <ConfirmationDialog state={state} onClose={handleClose} />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useConfirmation must be used within ConfirmationProvider');
  return context;
}

// ============================================
// DIALOG COMPONENT
// ============================================

interface ConfirmationDialogProps {
  state: ConfirmationState;
  onClose: (confirmed: boolean) => void;
}

function ConfirmationDialog({ state, onClose }: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const icons: Record<ConfirmationType, ReactNode> = {
    delete: <Trash2 className="h-6 w-6 text-destructive" />,
    logout: <LogOut className="h-6 w-6 text-muted-foreground" />,
    destructive: <AlertTriangle className="h-6 w-6 text-destructive" />,
    warning: <AlertCircle className="h-6 w-6 text-yellow-500" />,
    info: <HelpCircle className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
  };

  const bgColors: Record<ConfirmationType, string> = {
    delete: 'bg-destructive/10',
    logout: 'bg-muted',
    destructive: 'bg-destructive/10',
    warning: 'bg-yellow-500/10',
    info: 'bg-blue-500/10',
    success: 'bg-green-500/10',
  };

  const handleConfirm = async () => {
    if (state.confirmInput && inputValue !== state.confirmInput) return;
    
    setIsProcessing(true);
    // Small delay for UX
    await new Promise(r => setTimeout(r, 200));
    setIsProcessing(false);
    setInputValue('');
    onClose(true);
  };

  const handleCancel = () => {
    setInputValue('');
    onClose(false);
  };

  const canConfirm = !state.confirmInput || inputValue === state.confirmInput;

  return (
    <AnimatePresence>
      {state.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden"
          >
            {/* Icon header */}
            <div className="flex justify-center pt-6">
              <div className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                bgColors[state.type || 'warning']
              )}>
                {state.icon || icons[state.type || 'warning']}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 text-center">
              <h2 className="text-lg font-semibold">
                {state.title}
              </h2>
              {state.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {state.description}
                </p>
              )}

              {/* Confirmation input */}
              {state.confirmInput && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Digite <span className="font-mono font-bold text-foreground">{state.confirmInput}</span> para confirmar:
                  </p>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={state.confirmInput}
                    className="text-center"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                {state.cancelText || 'Cancelar'}
              </Button>
              <Button
                variant={state.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={handleConfirm}
                disabled={!canConfirm || isProcessing}
                className="flex-1"
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {state.confirmText || 'Confirmar'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// STANDALONE DIALOGS
// ============================================

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  requireInput?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar exclusão',
  description,
  itemName,
  requireInput = false,
}: DeleteConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const confirmText = 'EXCLUIR';
  const canConfirm = !requireInput || inputValue === confirmText;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const handleCancel = () => {
    setInputValue('');
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex justify-center pt-6">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
            </div>

            <div className="px-6 py-4 text-center">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {description || (itemName 
                  ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
                  : 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'
                )}
              </p>

              {requireInput && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Digite <span className="font-mono font-bold text-destructive">{confirmText}</span> para confirmar:
                  </p>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={confirmText}
                    className="text-center"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirm} 
                disabled={!canConfirm || isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface SecurityConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  securityCode: string;
}

export function SecurityConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  securityCode,
}: SecurityConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canConfirm = inputValue === securityCode;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setInputValue(''); onOpenChange(false); }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex justify-center pt-6">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-yellow-500" />
              </div>
            </div>

            <div className="px-6 py-4 text-center">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>

              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                  Código de segurança: <span className="font-mono">{securityCode}</span>
                </p>
              </div>

              <div className="mt-4">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite o código"
                  className="text-center font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setInputValue(''); onOpenChange(false); }} 
                disabled={isLoading} 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!canConfirm || isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
