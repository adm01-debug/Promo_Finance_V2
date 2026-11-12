// Páginas (lazy chunks) do domínio "admin" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const Configuracoes = lazy(() => import('../pages/Configuracoes'));
export const Usuarios = lazy(() => import('../pages/Usuarios'));
export const AuditLogs = lazy(() => import('../pages/AuditLogs'));
export const Seguranca = lazy(() => import('../pages/Seguranca'));
export const Integracoes = lazy(() => import('../pages/Integracoes'));
export const AdminTelemetria = lazy(() => import('../pages/AdminTelemetria'));
export const AdminEdgeHealth = lazy(() => import('../pages/AdminEdgeHealth'));
export const AdminSystemHealth = lazy(() => import('../pages/AdminSystemHealth'));
export const SRECommandCenter = lazy(() => import('../pages/admin/SRECommandCenter'));
export const AdminBloatMonitor = lazy(() => import('../pages/admin/AdminBloatMonitor'));
export const SSOAdmin = lazy(() => import('../pages/admin/SSOAdmin'));
export const SSOJitEvents = lazy(() => import('../pages/admin/SSOJitEvents'));
export const ScimAudit = lazy(() => import('../pages/admin/ScimAudit'));
export const AuditSsoProfileSync = lazy(() => import('../pages/admin/AuditSsoProfileSync'));
export const SsoEvents = lazy(() => import('../pages/admin/SsoEvents'));
export const InsightsIA = lazy(() => import('../pages/admin/InsightsIA'));
export const AnomaliaDetalhe = lazy(() => import('../pages/admin/AnomaliaDetalhe'));
export const ComplianceAuditoria = lazy(() => import('../pages/admin/ComplianceAuditoria'));
export const AuditoriaIA = lazy(() => import('../pages/admin/AuditoriaIA'));
export const FiltrosSalvos = lazy(() => import('../pages/configuracoes/FiltrosSalvos'));
export const MinhasPreferencias = lazy(() => import('../pages/configuracoes/MinhasPreferencias'));
export const HistoricoNotificacoes = lazy(
  () => import('../pages/configuracoes/HistoricoNotificacoes')
);
export const SinoNotificacoesFiltros = lazy(
  () => import('../pages/configuracoes/SinoNotificacoesFiltros')
);
export const SharedFiltersAdmin = lazy(() => import('../pages/admin/SharedFiltersAdmin'));
export const ApiManagement = lazy(() => import('../pages/admin/ApiManagement'));
export const CustomFieldsAdmin = lazy(() => import('../pages/admin/CustomFieldsAdmin'));
