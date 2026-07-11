import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export type AuditActionType =
  | 'preference_change'
  | 'filter_change'
  | 'preset_saved'
  | 'preset_loaded'
  | 'filters_reset';

/**
 * Valor livre serializável em JSON, aceito nos campos de auditoria.
 * Aceita records amplos (Record<string, unknown>) para não travar callers
 * legados, mas é coagido para `Json` no ponto de inserção.
 */
export type AuditValue = unknown;

interface AuditParams {
  userId: string;
  actionType: AuditActionType;
  entityType?: string;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  metadata?: AuditValue;
}

/**
 * Registra uma ação no histórico de auditoria.
 */
export async function logUserAction({
  userId,
  actionType,
  entityType,
  oldValue,
  newValue,
  metadata,
}: AuditParams): Promise<void> {
  try {
    const { error } = await supabase.from('user_action_audit').insert([
      {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        old_value: oldValue as Json,
        new_value: newValue as Json,
        metadata: (metadata ?? {}) as Json,
      },
    ]);

    if (error) throw error;
  } catch (e) {
    logger.error('[logUserAction] failed to log action', { actionType, e });
  }
}

