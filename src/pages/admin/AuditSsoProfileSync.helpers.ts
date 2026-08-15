// Tipos, constantes e mappers da página AuditSsoProfileSync — extraídos para zerar max-lines.
import type { SsoSyncFieldKey } from '@/hooks/useLastSsoProfileSync';
import type { SsoProfileSyncEvent } from '@/hooks/useSsoProfileSyncEvents';
import type { JitAuditEvent } from '@/hooks/useSSOJitEvents';

export type EventKind = 'jit' | 'profile_sync';
export type EventKindFilter = 'all' | EventKind;

export interface UnifiedEvent {
  id: string;
  kind: EventKind;
  created_at: string;
  user_email: string | null;
  provider_nome: string | null;
  provider_tipo: string | null;
  /** Para profile_sync: campos alterados. Para jit: vazio. */
  fields_changed: SsoSyncFieldKey[];
  /** Para jit: role atribuída. Para profile_sync: null. */
  role: string | null;
  /** Para jit: grupo que casou. Para profile_sync: null. */
  matched_group: string | null;
}

export const FIELD_OPTIONS: { value: SsoSyncFieldKey | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os campos' },
  { value: 'full_name', label: 'Nome completo' },
  { value: 'avatar_url', label: 'Foto de perfil' },
  { value: 'telefone', label: 'Telefone' },
];

export const KIND_OPTIONS: { value: EventKindFilter; label: string }[] = [
  { value: 'all', label: 'Todos os eventos' },
  { value: 'jit', label: 'JIT (provisionamento)' },
  { value: 'profile_sync', label: 'Sincronização de perfil' },
];

export const PRESETS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
];

export function mapProfileSync(e: SsoProfileSyncEvent): UnifiedEvent {
  return {
    id: `ps-${e.id}`,
    kind: 'profile_sync',
    created_at: e.created_at,
    user_email: e.user_email,
    provider_nome: e.provider_nome,
    provider_tipo: e.provider_tipo,
    fields_changed: e.fields_changed,
    role: null,
    matched_group: null,
  };
}

export function mapJit(e: JitAuditEvent): UnifiedEvent {
  return {
    id: `jit-${e.id}`,
    kind: 'jit',
    created_at: e.created_at,
    user_email: e.user_email,
    provider_nome: e.new_data?.provider_nome ?? null,
    provider_tipo: e.new_data?.provider_tipo ?? null,
    fields_changed: [],
    role: e.new_data?.role ?? null,
    matched_group: e.new_data?.matched_group ?? null,
  };
}
