/**
 * Swipeable List Item Wrapper
 * 
 * Wrapper para itens de lista que adiciona swipe actions no mobile
 */

import { ReactNode } from 'react';
import { SwipeActions } from '@/components/ui/swipe-actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, Trash2, Edit, Eye, Send } from 'lucide-react';

interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkComplete?: () => void;
  onSend?: () => void;
  disabled?: boolean;
}

export function SwipeableListItem({
  children,
  onView,
  onEdit,
  onDelete,
  onMarkComplete,
  onSend,
  disabled = false,
}: SwipeableListItemProps) {
  const isMobile = useIsMobile();

  // Build left actions (positive actions)
  const leftActions: SwipeAction[] = [];
  
  if (onMarkComplete) {
    leftActions.push({
      id: 'complete',
      icon: <Check className="h-5 w-5" />,
      label: 'Concluir',
      color: 'text-white',
      bgColor: 'bg-success',
      onClick: onMarkComplete,
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
      >
        {children}
      </SwipeActions>
    );
  }

  return <>{children}</>;
}

export default SwipeableListItem;
