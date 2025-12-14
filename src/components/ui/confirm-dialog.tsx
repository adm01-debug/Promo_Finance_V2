import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Loader2, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'danger' | 'warning' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const variantConfig: Record<ConfirmVariant, { 
  icon: typeof AlertTriangle; 
  iconColor: string; 
  buttonClass: string;
}> = {
  danger: { 
    icon: Trash2, 
    iconColor: 'text-destructive',
    buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: { 
    icon: AlertTriangle, 
    iconColor: 'text-warning',
    buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90',
  },
  success: { 
    icon: CheckCircle2, 
    iconColor: 'text-success',
    buttonClass: 'bg-success text-success-foreground hover:bg-success/90',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  
  const showLoading = isLoading || loading;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
              variant === 'danger' && "bg-destructive/10",
              variant === 'warning' && "bg-warning/10",
              variant === 'success' && "bg-success/10",
            )}>
              <Icon className={cn("h-6 w-6", config.iconColor)} />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={showLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={showLoading}
            className={cn(config.buttonClass, "gap-2")}
          >
            {showLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
