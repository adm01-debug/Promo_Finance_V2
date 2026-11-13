import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/hooks/AuthProvider';
import { KeyboardShortcutsProvider } from '@/components/layout/KeyboardShortcutsProvider';
import { DataPrefetcher } from '@/components/providers/DataPrefetcher';
import { NavigationTracker } from '@/components/providers/NavigationTracker';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { PageLoading } from '@/components/ui/loading-skeleton';
import { MotionConfig } from 'framer-motion';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { StartupDiagnostic } from '@/components/common/StartupDiagnostic';
import { VisualValidator } from '@/components/ui/ux-validator';
import { VisualCorrectionOverlay } from '@/components/layout/VisualCorrectionOverlay';
import { TransitionProvider } from '@/components/layout/transitions';
import { useSelectiveEmpresaInvalidation } from '@/hooks/useSelectiveEmpresaInvalidation';
import { ModalHistoryManager } from '@/components/navigation/ModalHistoryManager';
import { UnsavedGuardProvider } from '@/components/navigation/UnsavedGuardProvider';
import { analiseRoutes } from './routes/analiseRoutes';
import { contabilRoutes } from './routes/contabilRoutes';
import { financeiroRoutes } from './routes/financeiroRoutes';
import { geralRoutes } from './routes/geralRoutes';
import { fiscalRoutes } from './routes/fiscalRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { reformaTributariaRoutes } from './routes/reformaTributariaRoutes';
import { tributarioRoutes } from './routes/tributarioRoutes';
const Auth = lazy(() => import('./pages/Auth'));
const CorporateOnboarding = lazy(() => import('./pages/auth/CorporateOnboarding'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ContadorReadonly = lazy(() => import('./pages/ContadorReadonly'));
const DesignSystemDebug = lazy(() => import('./pages/design-system-debug'));
// Galeria de espécimes Vela (gate G2/G3) — bundle só em DEV
const Especimes = lazy(() => import('./pages/dev/Especimes'));
const ThemeDiagnostics = lazy(() => import('./pages/ThemeDiagnostics'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppRoutes() {
  // Sprint 2.3: invalidação seletiva do cache ao trocar de empresa
  // (evita refetch storm de `queryClient.clear()`).
  useSelectiveEmpresaInvalidation();

  return (
    <KeyboardShortcutsProvider>
      <DataPrefetcher>
        <NavigationTracker />
        <CommandPalette />
        <Toaster richColors closeButton position="top-right" />
        {new URLSearchParams(window.location.search).has('visualDebug') && <VisualValidator />}
        <VisualCorrectionOverlay />
        {/* Voltar-fecha-modal FORA do Suspense: a paleta de comandos
            (montada acima) pode abrir um dialog enquanto o chunk lazy
            carrega — o gerenciador precisa já estar montado. */}
        <ModalHistoryManager />
        <Suspense fallback={<PageLoading />}>
          {/* Guarda de não-salvos acima das rotas: vale para todas as
              páginas, com ou sem MainLayout. */}
          <UnsavedGuardProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/corporate" element={<CorporateOnboarding />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contador/:token" element={<ContadorReadonly />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/design-system-debug" element={<DesignSystemDebug />} />
              {import.meta.env.DEV && <Route path="/__especimes" element={<Especimes />} />}
              <Route path="/theme-diagnostics" element={<ThemeDiagnostics />} />

              {analiseRoutes()}

              {contabilRoutes()}

              {financeiroRoutes()}

              {geralRoutes()}

              {fiscalRoutes()}

              {adminRoutes()}

              {reformaTributariaRoutes()}

              {tributarioRoutes()}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </UnsavedGuardProvider>
        </Suspense>
      </DataPrefetcher>
    </KeyboardShortcutsProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <StartupDiagnostic>
                <BrowserRouter>
                  <TransitionProvider>
                    <MotionConfig reducedMotion="user">
                      <AppRoutes />
                    </MotionConfig>
                  </TransitionProvider>
                </BrowserRouter>
              </StartupDiagnostic>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
