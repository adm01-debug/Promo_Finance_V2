import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const alertVariants = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
};

const alertIcons = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants;
  title?: string;
  onClose?: () => void;
}

export function Alert({ 
  className, 
  variant = 'default', 
  title, 
  children, 
  onClose,
  ...props 
}: AlertProps) {
  const Icon = alertIcons[variant];
  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-lg border p-4',
        alertVariants[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('font-medium leading-none tracking-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}
