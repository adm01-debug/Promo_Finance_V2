// ============================================================================
// Contexts Index - Finance Hub
// ============================================================================

// Auth Context
export { AuthProvider, useAuth } from './auth-context';

// Theme Context
export { ThemeProvider, useTheme } from './theme-context';

// Notification Context
export {
  NotificationProvider,
  useNotifications,
  useNotificationStore,
  notificationStore,
} from './notification-context';
export type {
  Notification,
  NotificationType,
  NotificationContextValue,
} from './notification-context';

// Loading Context
export {
  LoadingProvider,
  useLoading,
  useLoadingState,
  useGlobalLoading,
  LOADING_KEYS,
} from './loading-context';
export type { LoadingState, LoadingContextValue, LoadingKey } from './loading-context';

// Sidebar Context
export { SidebarProvider, useSidebar } from './sidebar-context';
export type { SidebarContextValue } from './sidebar-context';

// ============================================================================
// Combined Provider
// ============================================================================

import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from './auth-context';
import { ThemeProvider } from './theme-context';
import { NotificationProvider } from './notification-context';
import { LoadingProvider } from './loading-context';
import { SidebarProvider } from './sidebar-context';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <LoadingProvider>
              <NotificationProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </NotificationProvider>
            </LoadingProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
