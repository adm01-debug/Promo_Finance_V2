import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export async function logAudit(params: {
  filterId: string;
  details: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  try {
    await supabase.rpc('log_audit', {
      p_action: 'UPDATE',
      p_table_name: 'saved_filters',
      p_record_id: params.filterId,
      p_old_data: params.oldData ? (JSON.parse(JSON.stringify(params.oldData)) as never) : null,
      p_new_data: params.newData ? (JSON.parse(JSON.stringify(params.newData)) as never) : null,
      p_details: params.details,
    });
  } catch (e) {
    logger.warn('[shared-filters-admin] audit log falhou', e);
  }
}
