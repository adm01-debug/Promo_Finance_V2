import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/notification-context';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { LoadingProvider } from '@/contexts/loading-context';
import { ErrorBoundary } from '@/components/common/error-boundary';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * App Providers Component
 * Wraps the entire application with all necessary context providers
 * Order matters - providers at the bottom wrap those above
 */
export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <LoadingProvider>
                  <SidebarProvider>
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                    
                    {/* Toast notifications */}
                    <Toaster
                      position="top-right"
                      expand={false}
                      richColors
                      closeButton
                      duration={4000}
                      toastOptions={{
                        classNames: {
                          toast: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                          title: 'text-gray-900 dark:text-white font-medium',
                          description: 'text-gray-600 dark:text-gray-400',
                          actionButton: 'bg-primary-600 text-white',
                          cancelButton: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                          closeButton: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                        },
                      }}
                    />
                  </SidebarProvider>
                </LoadingProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * Test providers for unit tests
 * Includes minimal providers needed for testing
 */
export function TestProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <BrowserRouter>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

/**
 * Storybook providers for component stories
 */
export function StorybookProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  );
}

export default AppProviders;
