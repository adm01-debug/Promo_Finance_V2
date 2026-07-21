import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export async function logAudit(params: {
  filterId: string;
  details: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  try {
    // @ts-expect-error rpc name may not be in generated types
    await supabase.rpc('log_audit', {
      _action: 'UPDATE',
      _table_name: 'saved_filters',
      _record_id: params.filterId,
      _old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      _new_data: params.newData ? JSON.stringify(params.newData) : null,
      _details: params.details,
    });
  } catch (e) {
    logger.warn('[shared-filters-admin] audit log falhou', e);
  }
}
