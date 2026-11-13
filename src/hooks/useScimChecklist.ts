import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ScimChecklistItem {
  item_key: string;
  confirmed: boolean;
  confirmed_at: string | null;
}

export function useScimChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<Record<string, ScimChecklistItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('scim_setup_checklist')
      .select('item_key, confirmed, confirmed_at')
      .eq('user_id', user.id);
    if (!error && data) {
      const map: Record<string, ScimChecklistItem> = {};
      for (const row of data) map[row.item_key] = row as ScimChecklistItem;
      setItems(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggle = useCallback(
    async (itemKey: string, confirmed: boolean) => {
      if (!user) return;
      setSaving(itemKey);
      // Atualização otimista
      setItems((prev) => ({
        ...prev,
        [itemKey]: {
          item_key: itemKey,
          confirmed,
          confirmed_at: confirmed ? new Date().toISOString() : null,
        },
      }));
      const confirmedAt = confirmed ? new Date().toISOString() : null;
      // scim_setup_checklist não tem índice único em (user_id, item_key): upsert com
      // onConflict falha com 42P10. Atualiza a linha existente ou insere uma nova.
      const { data: existente, error: selectError } = await supabase
        .from('scim_setup_checklist')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_key', itemKey)
        .maybeSingle();
      let error = selectError;
      if (!error) {
        const res = existente
          ? await supabase
              .from('scim_setup_checklist')
              .update({ confirmed, confirmed_at: confirmedAt })
              .eq('id', existente.id)
          : await supabase.from('scim_setup_checklist').insert({
              user_id: user.id,
              item_key: itemKey,
              etapa: itemKey,
              confirmed,
              confirmed_at: confirmedAt,
            });
        error = res.error;
      }
      if (error) {
        // Reverte em caso de erro
        await fetchItems();
      }
      setSaving(null);
    },
    [user, fetchItems]
  );

  const isConfirmed = useCallback((key: string) => !!items[key]?.confirmed, [items]);

  return { items, isConfirmed, toggle, loading, saving, refetch: fetchItems };
}
