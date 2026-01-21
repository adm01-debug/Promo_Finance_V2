import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantConfig = {
  default: {
    icon: <Info className="w-6 h-6" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    button: 'primary' as const,
  },
  danger: {
    icon: <XCircle className="w-6 h-6" />,
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    button: 'destructive' as const,
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    button: 'warning' as const,
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    button: 'success' as const,
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    button: 'primary' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn('p-3 rounded-full', config.iconBg)}>
              {icon || config.icon}
            </div>

            {/* Text */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName = 'item',
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Excluir ${itemName}`}
      description={`Tem certeza que deseja excluir este ${itemName}? Esta ação não pode ser desfeita.`}
      confirmText="Excluir"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function BulkDeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
  itemName = 'itens',
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  count: number;
  itemName?: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Excluir ${count} ${itemName}`}
      description={`Tem certeza que deseja excluir ${count} ${itemName}? Esta ação não pode ser desfeita.`}
      confirmText={`Excluir ${count} ${itemName}`}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sair da conta"
      description="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema."
      confirmText="Sair"
      variant="warning"
      isLoading={isLoading}
    />
  );
}

export default ConfirmDialog;
