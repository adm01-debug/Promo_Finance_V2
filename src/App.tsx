import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { KeyboardShortcutsProvider } from "@/components/layout/KeyboardShortcutsProvider";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { SkipLinks } from "@/components/ui/skip-link";
import { DataPrefetcher } from "@/components/providers/DataPrefetcher";
import { PageTransition } from "@/components/layout/PageTransition";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ContasReceber = lazy(() => import("./pages/ContasReceber"));
const ContasPagar = lazy(() => import("./pages/ContasPagar"));
const CentroCustos = lazy(() => import("./pages/CentroCustos"));
const FluxoCaixa = lazy(() => import("./pages/FluxoCaixa"));
const Cobrancas = lazy(() => import("./pages/Cobrancas"));
const Conciliacao = lazy(() => import("./pages/Conciliacao"));
const Alertas = lazy(() => import("./pages/Alertas"));
const ContasBancarias = lazy(() => import("./pages/ContasBancarias"));
const Empresas = lazy(() => import("./pages/Empresas"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Bitrix24 = lazy(() => import("./pages/Bitrix24"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Boletos = lazy(() => import("./pages/Boletos"));
const NotasFiscais = lazy(() => import("./pages/NotasFiscais"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Demonstrativos = lazy(() => import("./pages/Demonstrativos"));
const Aprovacoes = lazy(() => import("./pages/Aprovacoes"));
const Expert = lazy(() => import("./pages/Expert"));
const DashboardEmpresa = lazy(() => import("./pages/DashboardEmpresa"));
const BI = lazy(() => import("./pages/BI"));
const PagamentosRecorrentes = lazy(() => import("./pages/PagamentosRecorrentes"));
const DashboardReceber = lazy(() => import("./pages/DashboardReceber"));
const Seguranca = lazy(() => import("./pages/Seguranca"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="promo-financeiro-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <KeyboardShortcutsProvider>
                <DataPrefetcher>
                  <SkipLinks />
                  <Toaster />
                  <Sonner />
                  <GuidedTour />
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary>
                    <PageTransition>
                      <Routes>
                        {/* Public route */}
                        <Route path="/auth" element={<Auth />} />
                        
                        {/* Protected routes - All authenticated users */}
                        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        <Route path="/expert" element={<ProtectedRoute><Expert /></ProtectedRoute>} />
                        <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
                        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                        
                        {/* Protected routes - Operacional+ */}
                        <Route path="/contas-receber" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><ContasReceber /></ProtectedRoute>} />
                        <Route path="/contas-pagar" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><ContasPagar /></ProtectedRoute>} />
                        <Route path="/pagamentos-recorrentes" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><PagamentosRecorrentes /></ProtectedRoute>} />
                        <Route path="/cobrancas" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><Cobrancas /></ProtectedRoute>} />
                        <Route path="/boletos" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><Boletos /></ProtectedRoute>} />
                        <Route path="/notas-fiscais" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><NotasFiscais /></ProtectedRoute>} />
                        <Route path="/clientes" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><Clientes /></ProtectedRoute>} />
                        <Route path="/fornecedores" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><Fornecedores /></ProtectedRoute>} />
                        
                        {/* Protected routes - Financeiro+ */}
                        <Route path="/centro-custos" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><CentroCustos /></ProtectedRoute>} />
                        <Route path="/fluxo-caixa" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><FluxoCaixa /></ProtectedRoute>} />
                        <Route path="/conciliacao" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><Conciliacao /></ProtectedRoute>} />
                        <Route path="/contas-bancarias" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><ContasBancarias /></ProtectedRoute>} />
                        <Route path="/demonstrativos" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><Demonstrativos /></ProtectedRoute>} />
                        <Route path="/aprovacoes" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><Aprovacoes /></ProtectedRoute>} />
                        <Route path="/dashboard-empresa" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><DashboardEmpresa /></ProtectedRoute>} />
                        <Route path="/bi" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><BI /></ProtectedRoute>} />
                        <Route path="/dashboard-receber" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><DashboardReceber /></ProtectedRoute>} />
                        
                        {/* Protected routes - Admin only */}
                        <Route path="/empresas" element={<ProtectedRoute requiredRoles={['admin']}><Empresas /></ProtectedRoute>} />
                        <Route path="/configuracoes" element={<ProtectedRoute requiredRoles={['admin']}><Configuracoes /></ProtectedRoute>} />
                        <Route path="/bitrix24" element={<ProtectedRoute requiredRoles={['admin']}><Bitrix24 /></ProtectedRoute>} />
                        <Route path="/usuarios" element={<ProtectedRoute requiredRoles={['admin']}><Usuarios /></ProtectedRoute>} />
                        <Route path="/audit-logs" element={<ProtectedRoute requiredRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
                        <Route path="/seguranca" element={<ProtectedRoute><Seguranca /></ProtectedRoute>} />
                        {/* Catch-all */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </PageTransition>
                  </ErrorBoundary>
                </Suspense>
                </DataPrefetcher>
              </KeyboardShortcutsProvider>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
