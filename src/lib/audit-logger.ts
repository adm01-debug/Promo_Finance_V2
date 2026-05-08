import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type AuditActionType = 'preference_change' | 'filter_change' | 'preset_saved' | 'preset_loaded' | 'filters_reset';

interface AuditParams {
  userId: string;
  actionType: AuditActionType;
  entityType?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
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
  metadata
}: AuditParams) {
  try {
    const { error } = await supabase
      .from('user_action_audit')
      .insert([{
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        old_value: oldValue,
        new_value: newValue,
        metadata: metadata || {}
      }]);

    if (error) throw error;
  } catch (e) {
    logger.error('[logUserAction] failed to log action', { actionType, e });
  }
}
