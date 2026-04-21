import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { KeyboardShortcutsProvider } from '@/components/layout/KeyboardShortcutsProvider';
import { DataPrefetcher } from '@/components/providers/DataPrefetcher';
import { NavigationTracker } from '@/components/providers/NavigationTracker';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { PageLoading } from '@/components/ui/loading-skeleton';
import { SkipLinks } from '@/components/accessibility/SkipLinks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CommandPalette } from '@/components/command-palette/CommandPalette';


// Lazy load pages for better performance
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const CorporateOnboarding = lazy(() => import('./pages/auth/CorporateOnboarding'));
const ContasPagar = lazy(() => import('./pages/ContasPagar'));
const ContasReceber = lazy(() => import('./pages/ContasReceber'));
const DashboardReceber = lazy(() => import('./pages/DashboardReceber'));
const DashboardEmpresa = lazy(() => import('./pages/DashboardEmpresa'));
const BI = lazy(() => import('./pages/BI'));
const NotasFiscais = lazy(() => import('./pages/NotasFiscais'));
const FluxoCaixa = lazy(() => import('./pages/FluxoCaixa'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Expert = lazy(() => import('./pages/Expert'));
const Conciliacao = lazy(() => import('./pages/Conciliacao'));
const Cobrancas = lazy(() => import('./pages/Cobrancas'));
const Boletos = lazy(() => import('./pages/Boletos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Fornecedores = lazy(() => import('./pages/Fornecedores'));
const Empresas = lazy(() => import('./pages/Empresas'));
const ContasBancarias = lazy(() => import('./pages/ContasBancarias'));
const CentroCustos = lazy(() => import('./pages/CentroCustos'));
const Aprovacoes = lazy(() => import('./pages/Aprovacoes'));
const Alertas = lazy(() => import('./pages/Alertas'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Seguranca = lazy(() => import('./pages/Seguranca'));
const Demonstrativos = lazy(() => import('./pages/Demonstrativos'));
const PagamentosRecorrentes = lazy(() => import('./pages/PagamentosRecorrentes'));
const Bitrix24 = lazy(() => import('./pages/Bitrix24'));
const ReformaTributaria = lazy(() => import('./pages/ReformaTributaria'));
const SimulacaoRegimes = lazy(() => import('./pages/tributario/SimulacaoRegimes'));
const HistoricoFinanceiroTributario = lazy(() => import('./pages/tributario/HistoricoFinanceiro'));
const OportunidadesElisao = lazy(() => import('./pages/tributario/OportunidadesElisao'));
const ProjecaoReformaPage = lazy(() => import('./pages/tributario/ProjecaoReforma'));
const DashboardTributario = lazy(() => import('./pages/tributario/DashboardTributario'));
const RecomendacaoExecutiva = lazy(() => import('./pages/tributario/RecomendacaoExecutiva'));
const PfVinculada = lazy(() => import('./pages/tributario/PfVinculada'));
const OnboardingTributario = lazy(() => import('./pages/tributario/OnboardingTributario'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Asaas = lazy(() => import('./pages/Asaas'));
const BlingPage = lazy(() => import('./pages/Bling'));
const Vendedores = lazy(() => import('./pages/Vendedores'));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil'));
const Contratos = lazy(() => import('./pages/Contratos'));
const SimuladorAntecipacaoPage = lazy(() => import('./pages/SimuladorAntecipacao'));
const AssinaturaDigitalPage = lazy(() => import('./pages/AssinaturaDigital'));
const ComprovanteOCRPage = lazy(() => import('./pages/ComprovanteOCR'));
const Movimentacoes = lazy(() => import('./pages/Movimentacoes'));
const Tesouraria = lazy(() => import('./pages/Tesouraria'));
const PixHub = lazy(() => import('./pages/PixHub'));
const OrcamentoEvento = lazy(() => import('./pages/OrcamentoEvento'));
const BenchmarkingSetorial = lazy(() => import('./pages/BenchmarkingSetorial'));
const AdminTelemetria = lazy(() => import('./pages/AdminTelemetria'));
const AdminEdgeHealth = lazy(() => import('./pages/AdminEdgeHealth'));
const AdminSystemHealth = lazy(() => import('./pages/AdminSystemHealth'));
const CentroPrivacidadeLGPD = lazy(() => import('./pages/CentroPrivacidadeLGPD'));
const ContadorReadonly = lazy(() => import('./pages/ContadorReadonly'));
const SSOAdmin = lazy(() => import('./pages/admin/SSOAdmin'));
const SSOJitEvents = lazy(() => import('./pages/admin/SSOJitEvents'));
const InsightsIA = lazy(() => import('./pages/admin/InsightsIA'));
const AnomaliaDetalhe = lazy(() => import('./pages/admin/AnomaliaDetalhe'));
const ComplianceAuditoria = lazy(() => import('./pages/admin/ComplianceAuditoria'));
const Contabilidade = lazy(() => import('./pages/Contabilidade'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Inner app component that can use routing hooks
function AppRoutes() {
  return (
    <KeyboardShortcutsProvider>
      <DataPrefetcher>
        <NavigationTracker />
        <SkipLinks />
        <CommandPalette />
        <Toaster richColors closeButton position="top-right" />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/corporate" element={<CorporateOnboarding />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contador/:token" element={<ContadorReadonly />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard-receber" element={<ProtectedRoute><DashboardReceber /></ProtectedRoute>} />
            <Route path="/dashboard-empresa" element={<ProtectedRoute><DashboardEmpresa /></ProtectedRoute>} />
            <Route path="/bi" element={<ProtectedRoute><BI /></ProtectedRoute>} />
            <Route path="/contas-pagar" element={<ProtectedRoute><ContasPagar /></ProtectedRoute>} />
            <Route path="/contas-receber" element={<ProtectedRoute><ContasReceber /></ProtectedRoute>} />
            <Route path="/notas-fiscais" element={<ProtectedRoute><NotasFiscais /></ProtectedRoute>} />
            <Route path="/fluxo-caixa" element={<ProtectedRoute><FluxoCaixa /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/expert" element={<ProtectedRoute><Expert /></ProtectedRoute>} />
            <Route path="/conciliacao" element={<ProtectedRoute><Conciliacao /></ProtectedRoute>} />
            <Route path="/cobrancas" element={<ProtectedRoute><Cobrancas /></ProtectedRoute>} />
            <Route path="/boletos" element={<ProtectedRoute><Boletos /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
            <Route path="/empresas" element={<ProtectedRoute><Empresas /></ProtectedRoute>} />
            <Route path="/contas-bancarias" element={<ProtectedRoute><ContasBancarias /></ProtectedRoute>} />
            <Route path="/centro-custos" element={<ProtectedRoute><CentroCustos /></ProtectedRoute>} />
            <Route path="/aprovacoes" element={<ProtectedRoute><Aprovacoes /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            <Route path="/seguranca" element={<ProtectedRoute><Seguranca /></ProtectedRoute>} />
            <Route path="/demonstrativos" element={<ProtectedRoute><Demonstrativos /></ProtectedRoute>} />
            <Route path="/contabilidade" element={<ProtectedRoute requiredRoles={['admin', 'financeiro']}><Contabilidade /></ProtectedRoute>} />
            <Route path="/pagamentos-recorrentes" element={<ProtectedRoute><PagamentosRecorrentes /></ProtectedRoute>} />
            <Route path="/bitrix24" element={<ProtectedRoute><Bitrix24 /></ProtectedRoute>} />
            <Route path="/reforma-tributaria" element={<ProtectedRoute><ReformaTributaria /></ProtectedRoute>} />
            <Route path="/tributario/simulacao-regimes" element={<ProtectedRoute><SimulacaoRegimes /></ProtectedRoute>} />
            <Route path="/tributario/historico-financeiro" element={<ProtectedRoute><HistoricoFinanceiroTributario /></ProtectedRoute>} />
            <Route path="/tributario/oportunidades-elisao" element={<ProtectedRoute><OportunidadesElisao /></ProtectedRoute>} />
            <Route path="/tributario/projecao-reforma" element={<ProtectedRoute><ProjecaoReformaPage /></ProtectedRoute>} />
            <Route path="/tributario" element={<ProtectedRoute><DashboardTributario /></ProtectedRoute>} />
            <Route path="/tributario/dashboard" element={<ProtectedRoute><DashboardTributario /></ProtectedRoute>} />
            <Route path="/tributario/recomendacao" element={<ProtectedRoute><RecomendacaoExecutiva /></ProtectedRoute>} />
            <Route path="/tributario/pf-vinculada" element={<ProtectedRoute><PfVinculada /></ProtectedRoute>} />
            <Route path="/tributario/onboarding" element={<ProtectedRoute><OnboardingTributario /></ProtectedRoute>} />
            <Route path="/asaas" element={<ProtectedRoute><Asaas /></ProtectedRoute>} />
            <Route path="/bling" element={<ProtectedRoute><BlingPage /></ProtectedRoute>} />
            <Route path="/vendedores" element={<ProtectedRoute><Vendedores /></ProtectedRoute>} />
            <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
            <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
            <Route path="/simulador-antecipacao" element={<ProtectedRoute><SimuladorAntecipacaoPage /></ProtectedRoute>} />
            <Route path="/assinatura-digital" element={<ProtectedRoute><AssinaturaDigitalPage /></ProtectedRoute>} />
            <Route path="/comprovante-ocr" element={<ProtectedRoute><ComprovanteOCRPage /></ProtectedRoute>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><Movimentacoes /></ProtectedRoute>} />
            <Route path="/tesouraria" element={<ProtectedRoute><Tesouraria /></ProtectedRoute>} />
            <Route path="/pix-hub" element={<ProtectedRoute><PixHub /></ProtectedRoute>} />
            <Route path="/orcamento-evento" element={<ProtectedRoute><OrcamentoEvento /></ProtectedRoute>} />
            <Route path="/benchmarking" element={<ProtectedRoute><BenchmarkingSetorial /></ProtectedRoute>} />
            <Route path="/admin/telemetria" element={<ProtectedRoute><AdminTelemetria /></ProtectedRoute>} />
            <Route path="/admin/edge-health" element={<ProtectedRoute><AdminEdgeHealth /></ProtectedRoute>} />
            <Route path="/admin/system-health" element={<ProtectedRoute><AdminSystemHealth /></ProtectedRoute>} />
            <Route path="/admin/sso" element={<ProtectedRoute><SSOAdmin /></ProtectedRoute>} />
            <Route path="/admin/sso-jit-events" element={<ProtectedRoute requiredRoles={['admin']}><SSOJitEvents /></ProtectedRoute>} />
            <Route path="/admin/insights-ia" element={<ProtectedRoute><InsightsIA /></ProtectedRoute>} />
            <Route path="/admin/insights-ia/anomalia/:id" element={<ProtectedRoute><AnomaliaDetalhe /></ProtectedRoute>} />
            <Route path="/admin/compliance" element={<ProtectedRoute><ComplianceAuditoria /></ProtectedRoute>} />
            <Route path="/configuracoes/privacidade" element={<ProtectedRoute><CentroPrivacidadeLGPD /></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
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
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;