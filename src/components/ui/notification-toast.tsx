import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { Notification, useNotificationStore } from '@/contexts/notification-context';

// ============================================================================
// Types
// ============================================================================

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

// ============================================================================
// Notification Toast Item
// ============================================================================

function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 200);
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  const iconStyles = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  const Icon = icons[notification.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-[400px]',
        'transition-all duration-200',
        isExiting ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0',
        styles[notification.type]
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[notification.type])} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-sm opacity-80 mt-1">{notification.message}</p>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {notification.action.label}
          </button>
        )}
      </div>

      {notification.dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Notification Container
// ============================================================================

export function NotificationContainer({
  position = 'top-right',
  className,
}: NotificationContainerProps) {
  const { notifications, remove } = useNotificationStore();

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionStyles[position],
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={remove}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Standalone Toast Component (for direct use)
// ============================================================================

interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  onClose,
  dismissible = true,
  className,
}: ToastProps) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  const iconStyles = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        styles[type],
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && (
          <p className="text-sm opacity-80 mt-1">{message}</p>
        )}
      </div>

      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export { NotificationToast };
