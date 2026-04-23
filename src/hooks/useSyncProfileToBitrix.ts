import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncPayload {
  avatar_url?: string | null;
  telefone?: string | null;
}

interface SyncResult {
  ok: boolean;
  bitrix_contact_id?: string;
  synced_fields?: string[];
  skipped?: boolean;
  reason?: string;
  error?: string;
  details?: string;
}

/**
 * Dispara a edge function `sync-profile-to-bitrix` para enviar avatar/telefone
 * do perfil de volta ao Bitrix24. Use após salvar o perfil no painel.
 */
export function useSyncProfileToBitrix() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(async (payload: SyncPayload): Promise<SyncResult> => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-profile-to-bitrix', {
        body: payload,
      });
      const result: SyncResult = error
        ? { ok: false, error: error.message }
        : (data as SyncResult);
      setLastResult(result);
      return result;
    } catch (e) {
      const result: SyncResult = {
        ok: false,
        error: e instanceof Error ? e.message : 'unknown_error',
      };
      setLastResult(result);
      return result;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { sync, syncing, lastResult };
}
