/**
 * Swipeable Table Row Wrapper
 * 
 * Wrapper para linhas de tabela que adiciona swipe actions no mobile
 */

import { ReactNode } from 'react';
import { SwipeActions } from '@/components/ui/swipe-actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableRow } from '@/components/ui/table';
import { Check, Trash2, Edit, Eye, Send, DollarSign, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableTableRowProps {
  children: ReactNode;
  className?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkPaid?: () => void;
  onMarkReceived?: () => void;
  onSend?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function SwipeableTableRow({
  children,
  className,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkReceived,
  onSend,
  onCancel,
  disabled = false,
}: SwipeableTableRowProps) {
  const isMobile = useIsMobile();

  // Build left actions (positive actions)
  const leftActions: SwipeAction[] = [];
  
  if (onMarkPaid) {
    leftActions.push({
      id: 'paid',
      icon: <DollarSign className="h-5 w-5" />,
      label: 'Pagar',
      color: 'text-white',
      bgColor: 'bg-success',
      onClick: onMarkPaid,
    });
  }
  
  if (onMarkReceived) {
    leftActions.push({
      id: 'received',
      icon: <Check className="h-5 w-5" />,
      label: 'Recebido',
      color: 'text-white',
      bgColor: 'bg-success',
      onClick: onMarkReceived,
    });
  }
  
  if (onSend) {
    leftActions.push({
      id: 'send',
      icon: <Send className="h-5 w-5" />,
      label: 'Enviar',
      color: 'text-white',
      bgColor: 'bg-primary',
      onClick: onSend,
    });
  }

  // Build right actions (view/edit/delete)
  const rightActions: SwipeAction[] = [];
  
  if (onView) {
    rightActions.push({
      id: 'view',
      icon: <Eye className="h-5 w-5" />,
      label: 'Ver',
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary',
      onClick: onView,
    });
  }
  
  if (onEdit) {
    rightActions.push({
      id: 'edit',
      icon: <Edit className="h-5 w-5" />,
      label: 'Editar',
      color: 'text-white',
      bgColor: 'bg-warning',
      onClick: onEdit,
    });
  }
  
  if (onCancel) {
    rightActions.push({
      id: 'cancel',
      icon: <XCircle className="h-5 w-5" />,
      label: 'Cancelar',
      color: 'text-white',
      bgColor: 'bg-orange-500',
      onClick: onCancel,
    });
  }
  
  if (onDelete) {
    rightActions.push({
      id: 'delete',
      icon: <Trash2 className="h-5 w-5" />,
      label: 'Excluir',
      color: 'text-white',
      bgColor: 'bg-destructive',
      onClick: onDelete,
    });
  }

  // Only use swipe on mobile and if there are actions
  if (isMobile && (leftActions.length > 0 || rightActions.length > 0) && !disabled) {
    return (
      <SwipeActions
        leftActions={leftActions}
        rightActions={rightActions}
        disabled={disabled}
        className="[&>div]:contents"
      >
        <TableRow className={cn("touch-pan-y", className)}>
          {children}
        </TableRow>
      </SwipeActions>
    );
  }

  return (
    <TableRow className={className}>
      {children}
    </TableRow>
  );
}

export default SwipeableTableRow;
