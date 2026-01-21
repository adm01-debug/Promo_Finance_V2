import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: typeof AlertCircle; bg: string; border: string; text: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500',
  },
};

export function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconColor)} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-sm font-medium', config.text)}>{title}</h3>
          )}
          <div className={cn('text-sm', config.text, title && 'mt-1')}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'ml-3 inline-flex flex-shrink-0 rounded-lg p-1.5 transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              config.text
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        )}
      </div>
    </div>
  );
}
