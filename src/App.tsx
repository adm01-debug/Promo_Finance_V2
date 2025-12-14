import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ContasReceber from "./pages/ContasReceber";
import ContasPagar from "./pages/ContasPagar";
import CentroCustos from "./pages/CentroCustos";
import FluxoCaixa from "./pages/FluxoCaixa";
import Cobrancas from "./pages/Cobrancas";
import Conciliacao from "./pages/Conciliacao";
import Alertas from "./pages/Alertas";
import ContasBancarias from "./pages/ContasBancarias";
import Empresas from "./pages/Empresas";
import Configuracoes from "./pages/Configuracoes";
import Bitrix24 from "./pages/Bitrix24";
import Relatorios from "./pages/Relatorios";
import Boletos from "./pages/Boletos";
import NotasFiscais from "./pages/NotasFiscais";
import Usuarios from "./pages/Usuarios";
import AuditLogs from "./pages/AuditLogs";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Demonstrativos from "./pages/Demonstrativos";
import Aprovacoes from "./pages/Aprovacoes";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes - All authenticated users */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              
              {/* Protected routes - Operacional+ */}
              <Route path="/contas-receber" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><ContasReceber /></ProtectedRoute>} />
              <Route path="/contas-pagar" element={<ProtectedRoute requiredRoles={['admin', 'financeiro', 'operacional']}><ContasPagar /></ProtectedRoute>} />
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
              
              {/* Protected routes - Admin only */}
              <Route path="/empresas" element={<ProtectedRoute requiredRoles={['admin']}><Empresas /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute requiredRoles={['admin']}><Configuracoes /></ProtectedRoute>} />
              <Route path="/bitrix24" element={<ProtectedRoute requiredRoles={['admin']}><Bitrix24 /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute requiredRoles={['admin']}><Usuarios /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute requiredRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
