/**
 * Floating Action Button - FAB com animações
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptic-feedback';

interface FABAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  icon?: LucideIcon;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

export function FloatingActionButton({
  actions,
  icon: MainIcon = Plus,
  className,
  position = 'bottom-right',
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    haptic('light');
    setIsOpen(!isOpen);
  };

  const handleAction = (action: FABAction) => {
    haptic('medium');
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.05,
                }}
                className="flex items-center gap-3 justify-end"
              >
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap"
                >
                  {action.label}
                </motion.span>
                <Button
                  size="icon"
                  className={cn(
                    'h-12 w-12 rounded-full shadow-lg',
                    action.color || 'bg-secondary hover:bg-secondary/90'
                  )}
                  onClick={() => handleAction(action)}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl"
          onClick={toggleOpen}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <MainIcon className="h-6 w-6" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple FAB (single action)
interface SimpleFABProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  label?: string;
}

export function SimpleFAB({
  icon: Icon,
  onClick,
  className,
  position = 'bottom-right',
  label,
}: SimpleFABProps) {
  const handleClick = () => {
    haptic('medium');
    onClick();
  };

  return (
    <motion.div
      className={cn('fixed z-50', positionClasses[position], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl"
        onClick={handleClick}
        title={label}
      >
        <Icon className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}

export default FloatingActionButton;
