import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackBannerProps {
  type: FeedbackType;
  message: string;
  description?: string;
  show: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

const typeConfig: Record<FeedbackType, { 
  icon: typeof CheckCircle2; 
  bgClass: string; 
  iconClass: string;
}> = {
  success: { 
    icon: CheckCircle2, 
    bgClass: 'bg-success/10 border-success/20',
    iconClass: 'text-success',
  },
  error: { 
    icon: AlertCircle, 
    bgClass: 'bg-destructive/10 border-destructive/20',
    iconClass: 'text-destructive',
  },
  warning: { 
    icon: AlertTriangle, 
    bgClass: 'bg-warning/10 border-warning/20',
    iconClass: 'text-warning',
  },
  info: { 
    icon: Info, 
    bgClass: 'bg-primary/10 border-primary/20',
    iconClass: 'text-primary',
  },
};

export function FeedbackBanner({
  type,
  message,
  description,
  show,
  onClose,
  autoHide = false,
  autoHideDelay = 5000,
  className,
}: FeedbackBannerProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  React.useEffect(() => {
    if (show && autoHide && onClose) {
      const timer = setTimeout(onClose, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoHide, autoHideDelay, onClose]);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className={cn(
            "rounded-lg border p-4 flex items-start gap-3",
            config.bgClass,
            className
          )}
        >
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{message}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating notification in corner
interface FloatingNotificationProps {
  type: FeedbackType;
  message: string;
  show: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function FloatingNotification({
  type,
  message,
  show,
  onClose,
  position = 'bottom-right',
}: FloatingNotificationProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };
  
  React.useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={cn(
            "fixed z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border bg-popover",
            positionClasses[position]
          )}
        >
          <Icon className={cn("h-5 w-5", config.iconClass)} />
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
