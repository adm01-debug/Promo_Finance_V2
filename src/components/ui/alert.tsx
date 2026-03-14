import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const alertVariants = {
  default: 'bg-muted text-foreground',
  info: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
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
  className, variant = 'default', title, children, onClose, ...props 
}: AlertProps) {
  const Icon = alertIcons[variant];
  return (
    <div
      role="alert"
      className={cn('relative flex gap-3 rounded-lg border p-4', alertVariants[variant], className)}
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