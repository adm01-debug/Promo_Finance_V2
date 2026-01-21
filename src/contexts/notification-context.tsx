import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  // Convenience methods
  info: (title: string, message?: string) => string;
  success: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 50,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Generate unique ID
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt'>): string => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        createdAt: new Date(),
        duration: notification.duration ?? defaultDuration,
        dismissible: notification.dismissible ?? true,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        // Limit notifications
        if (updated.length > maxNotifications) {
          return updated.slice(0, maxNotifications);
        }
        return updated;
      });

      // Auto-dismiss
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },
    [generateId, defaultDuration, maxNotifications]
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setReadIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setReadIds(new Set());
  }, []);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  // Convenience methods
  const info = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: 'info', title, message });
    },
    [addNotification]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: 'success', title, message });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: 'warning', title, message });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: 'error', title, message });
    },
    [addNotification]
  );

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    clearAll,
    markAsRead,
    markAllAsRead,
    info,
    success,
    warning,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// ============================================================================
// Notification Store (for use outside React)
// ============================================================================

type NotificationListener = (notifications: Notification[]) => void;

class NotificationStore {
  private notifications: Notification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private idCounter = 0;

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  add(notification: Omit<Notification, 'id' | 'createdAt'>): string {
    const id = `store-notification-${++this.idCounter}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      dismissible: notification.dismissible ?? true,
    };

    this.notifications.unshift(newNotification);
    this.notify();

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.remove(id), notification.duration);
    }

    return id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  info(title: string, message?: string) {
    return this.add({ type: 'info', title, message, duration: 5000 });
  }

  success(title: string, message?: string) {
    return this.add({ type: 'success', title, message, duration: 5000 });
  }

  warning(title: string, message?: string) {
    return this.add({ type: 'warning', title, message, duration: 7000 });
  }

  error(title: string, message?: string) {
    return this.add({ type: 'error', title, message, duration: 10000 });
  }
}

export const notificationStore = new NotificationStore();

// ============================================================================
// Hook to sync with store
// ============================================================================

export function useNotificationStore() {
  const [notifications, setNotifications] = useState<Notification[]>(
    notificationStore.getAll()
  );

  useEffect(() => {
    return notificationStore.subscribe(setNotifications);
  }, []);

  return {
    notifications,
    add: notificationStore.add.bind(notificationStore),
    remove: notificationStore.remove.bind(notificationStore),
    clear: notificationStore.clear.bind(notificationStore),
    info: notificationStore.info.bind(notificationStore),
    success: notificationStore.success.bind(notificationStore),
    warning: notificationStore.warning.bind(notificationStore),
    error: notificationStore.error.bind(notificationStore),
  };
}
