import AuditSsoProfileSync from './AuditSsoProfileSync';

/**
 * /admin/sso-events
 * Tela unificada de eventos SSO (JIT + Profile Sync).
 * Reaproveita o componente já implementado em AuditSsoProfileSync,
 * que possui filtro por tipo de evento, KPIs e linhas condicionais.
 */
export default function SsoEvents() {
  return <AuditSsoProfileSync />;
}
