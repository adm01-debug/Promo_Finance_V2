/**
 * Audit Log Priority Classification
 *
 * Classifica a criticidade de um registro de auditoria com base na
 * `action` e em padrões encontrados em `details` / `table_name`.
 *
 * Uso típico:
 *   const p = classifyAuditPriority({ action, details, table_name });
 *   toastFor(p)(`${log.action}`, { description: log.details });
 */

import { toast } from 'sonner';

export type AuditPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AuditActionLike =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT'
  | string;

export interface AuditPriorityInput {
  action: AuditActionLike;
  details?: string | null;
  table_name?: string | null;
}

/**
 * Tabelas consideradas sensíveis — qualquer mutação eleva a prioridade.
 */
const SENSITIVE_TABLES = new Set<string>([
  'user_roles',
  'profiles',
  'allowed_ips',
  'allowed_countries',
  'blocked_ips',
  'account_lockouts',
  'bling_tokens',
  'bitrix_oauth_tokens',
  'security_alerts',
  'audit_logs',
]);

/**
 * Padrões em `details` que indicam eventos críticos de segurança.
 */
const CRITICAL_PATTERNS: RegExp[] = [
  /\b(role|perfil)\s*(escal|elev|alter|chang)/i,
  /privilege\s*escalation/i,
  /unauthorized|forbidden|permission\s*denied/i,
  /senha\s*(alter|reset|recuper)/i,
  /password\s*(chang|reset)/i,
  /2fa|mfa|multi[-\s]?factor/i,
  /chave\s*api|api[-\s]?key|secret/i,
  /backup|restore|dump/i,
  /bloque(io|ado)|lockout|blocked/i,
];

/**
 * Padrões que indicam eventos de alta atenção (não críticos).
 */
const HIGH_PATTERNS: RegExp[] = [
  /falha|failed|erro\s+ao/i,
  /tentativa\s+suspeita|suspicious/i,
  /aprovaç(ão|ao)\s*(rejeit|negad)/i,
  /cancelamento|cancelad/i,
  /exportaç(ão|ao)\s*massiv|bulk\s*export/i,
];

/** Mapeia a action base para uma prioridade default. */
function basePriorityForAction(action: AuditActionLike): AuditPriority {
  switch (action) {
    case 'DELETE':
      return 'high';
    case 'REJECT':
      return 'high';
    case 'APPROVE':
      return 'medium';
    case 'EXPORT':
      return 'medium';
    case 'UPDATE':
      return 'medium';
    case 'INSERT':
      return 'low';
    case 'LOGIN':
    case 'LOGOUT':
      return 'info';
    default:
      return 'low';
  }
}

const PRIORITY_RANK: Record<AuditPriority, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function escalate(current: AuditPriority, candidate: AuditPriority): AuditPriority {
  return PRIORITY_RANK[candidate] > PRIORITY_RANK[current] ? candidate : current;
}

/**
 * Classifica a prioridade de um log de auditoria.
 */
export function classifyAuditPriority(input: AuditPriorityInput): AuditPriority {
  let priority = basePriorityForAction(input.action);
  const details = input.details ?? '';
  const table = input.table_name ?? '';

  // Tabelas sensíveis elevam para pelo menos `high`.
  if (table && SENSITIVE_TABLES.has(table)) {
    priority = escalate(priority, 'high');
    // DELETE em tabela sensível é crítico.
    if (input.action === 'DELETE') {
      priority = escalate(priority, 'critical');
    }
  }

  // Padrões críticos sobrepõem tudo.
  if (CRITICAL_PATTERNS.some((re) => re.test(details))) {
    priority = escalate(priority, 'critical');
  } else if (HIGH_PATTERNS.some((re) => re.test(details))) {
    priority = escalate(priority, 'high');
  }

  return priority;
}

/**
 * Mapeamento de prioridade → variante visual / label.
 */
export const PRIORITY_META: Record<
  AuditPriority,
  { label: string; tone: 'destructive' | 'warning' | 'accent' | 'muted' | 'info' }
> = {
  critical: { label: 'Crítico', tone: 'destructive' },
  high: { label: 'Alto', tone: 'warning' },
  medium: { label: 'Médio', tone: 'accent' },
  low: { label: 'Baixo', tone: 'muted' },
  info: { label: 'Informativo', tone: 'info' },
};

/**
 * Helper: dispara um toast (sonner) com nível alinhado à prioridade.
 */
export function toastForPriority(
  priority: AuditPriority,
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
    id?: string | number;
  }
) {
  const opts = { duration: priority === 'critical' ? 15000 : 6000, ...options };
  switch (priority) {
    case 'critical':
    case 'high':
      return toast.error(message, opts);
    case 'medium':
      return toast.warning(message, opts);
    case 'low':
      return toast(message, opts);
    case 'info':
    default:
      return toast.info(message, opts);
  }
}
