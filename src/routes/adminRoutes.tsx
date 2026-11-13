// Rotas do domínio "admin" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Configuracoes,
  Usuarios,
  AuditLogs,
  Seguranca,
  Integracoes,
  AdminTelemetria,
  AdminEdgeHealth,
  AdminSystemHealth,
  SRECommandCenter,
  AdminBloatMonitor,
  SSOAdmin,
  SSOJitEvents,
  ScimAudit,
  AuditSsoProfileSync,
  SsoEvents,
  InsightsIA,
  AnomaliaDetalhe,
  ComplianceAuditoria,
  AuditoriaIA,
  FiltrosSalvos,
  MinhasPreferencias,
  HistoricoNotificacoes,
  SinoNotificacoesFiltros,
  SharedFiltersAdmin,
  ApiManagement,
  CustomFieldsAdmin,
  AdminErrosFrontend,
} from './adminPages';

export function adminRoutes() {
  return (
    <>
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Configuracoes />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seguranca"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Seguranca />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes"
        element={
          <ProtectedRoute>
            <Integracoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/erros-frontend"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminErrosFrontend />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/telemetria"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminTelemetria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/edge-health"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <MainLayout>
              <AdminEdgeHealth />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system-health"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <MainLayout>
              <AdminSystemHealth />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sre"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <SRECommandCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bloat-monitor"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminBloatMonitor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sso"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <SSOAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sso-jit-events"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <SSOJitEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scim-audit"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <ScimAudit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-sso-profile-sync"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AuditSsoProfileSync />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sso-events"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <SsoEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/insights-ia"
        element={
          <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
            <InsightsIA />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/insights-ia/anomalia/:id"
        element={
          <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
            <AnomaliaDetalhe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/compliance"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <ComplianceAuditoria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/auditoria-ia"
        element={
          <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
            <AuditoriaIA />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/filtros-salvos"
        element={
          <ProtectedRoute>
            <FiltrosSalvos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/preferencias"
        element={
          <ProtectedRoute>
            <MinhasPreferencias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/notificacoes/historico"
        element={
          <ProtectedRoute>
            <HistoricoNotificacoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/notificacoes/sino"
        element={
          <ProtectedRoute>
            <SinoNotificacoesFiltros />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/filtros-compartilhados"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <SharedFiltersAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/api"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <ApiManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campos-customizados"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <CustomFieldsAdmin />
          </ProtectedRoute>
        }
      />
    </>
  );
}
