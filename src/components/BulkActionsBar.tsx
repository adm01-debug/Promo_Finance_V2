/**
 * Componente de Barra de Ações em Massa
 * 
 * @module components/BulkActionsBar
 */

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { X, Loader2 } from 'lucide-react';
import { BulkAction } from '@/hooks/useBulkActions';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps<T> {
  selectionCount: number;
  actions: BulkAction<T>[];
  onAction: (actionId: string) => Promise<void>;
  onClear: () => void;
  isExecuting?: boolean;
  className?: string;
}

export function BulkActionsBar<T>({
  selectionCount,
  actions,
  onAction,
  onClear,
  isExecuting = false,
  className,
}: BulkActionsBarProps<T>) {
  if (selectionCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed z-50',
        // Mobile: full width at bottom with safe area
        'bottom-20 left-4 right-4',
        // Desktop: centered at bottom
        'md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2',
        // Base styles
        'rounded-xl border bg-popover p-3 shadow-lg',
        'flex flex-col md:flex-row items-stretch md:items-center gap-3',
        className
      )}
    >
      {/* Selection info + clear */}
      <div className="flex items-center justify-between md:justify-start gap-2 px-2">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectionCount} selecionado{selectionCount > 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClear}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="sr-only">Limpar seleção</span>
        </Button>
      </div>

      <div className="hidden md:block h-6 w-px bg-border" />

      {/* Action buttons - grid on mobile, flex on desktop */}
      <div className="grid grid-cols-2 md:flex items-center gap-2">
        {actions.map((action) => {
          const ActionButton = (
            <Button
              key={action.id}
              variant={action.variant ?? 'outline'}
              size="sm"
              disabled={isExecuting}
              onClick={action.confirm ? undefined : () => onAction(action.id)}
              className="gap-2 text-xs md:text-sm min-h-[40px] md:min-h-0"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                action.icon && <action.icon className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{action.label}</span>
            </Button>
          );

          if (action.confirm) {
            return (
              <AlertDialog key={action.id}>
                <AlertDialogTrigger asChild>{ActionButton}</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.confirm.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onAction(action.id)}
                      className={
                        action.variant === 'destructive'
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : ''
                      }
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          }

          return ActionButton;
        })}
      </div>
    </div>
  );
}

export default BulkActionsBar;
