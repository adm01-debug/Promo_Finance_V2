/**
 * Swipe Actions - Touch-friendly swipe actions for mobile
 * 
 * Provides left/right swipe actions for list items
 */

import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeActionsProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  className,
  threshold = 80,
  disabled = false,
}: SwipeActionsProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  const leftActionsWidth = leftActions.length * 70;
  const rightActionsWidth = rightActions.length * 70;

  // Transform for action button opacity
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > threshold || velocity > 500) {
      if (leftActions.length > 0) {
        setIsOpen('left');
        x.set(leftActionsWidth);
      }
    } else if (offset < -threshold || velocity < -500) {
      if (rightActions.length > 0) {
        setIsOpen('right');
        x.set(-rightActionsWidth);
      }
    } else {
      setIsOpen(null);
      x.set(0);
    }
  };

  const handleClose = () => {
    setIsOpen(null);
    x.set(0);
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    handleClose();
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden', className)}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute left-0 top-0 bottom-0 flex items-center"
        >
          {leftActions.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                'h-full w-[70px] flex flex-col items-center justify-center gap-1',
                action.bgColor
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span className={action.color}>{action.icon}</span>
              <span className={cn('text-xs font-medium', action.color)}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute right-0 top-0 bottom-0 flex items-center"
        >
          {rightActions.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                'h-full w-[70px] flex flex-col items-center justify-center gap-1',
                action.bgColor
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span className={action.color}>{action.icon}</span>
              <span className={cn('text-xs font-medium', action.color)}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionsWidth : 0,
          right: leftActions.length > 0 ? leftActionsWidth : 0,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-background z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>

      {/* Tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={handleClose}
        />
      )}
    </div>
  );
}

// Preset action configurations
export const swipeActionPresets = {
  edit: (onClick: () => void) => ({
    id: 'edit',
    icon: <EditIcon />,
    label: 'Editar',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    onClick,
  }),
  delete: (onClick: () => void) => ({
    id: 'delete',
    icon: <DeleteIcon />,
    label: 'Excluir',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    onClick,
  }),
  archive: (onClick: () => void) => ({
    id: 'archive',
    icon: <ArchiveIcon />,
    label: 'Arquivar',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    onClick,
  }),
  complete: (onClick: () => void) => ({
    id: 'complete',
    icon: <CheckIcon />,
    label: 'Concluir',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    onClick,
  }),
};

// Simple icons for swipe actions
function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
