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
      const { error } = await supabase
        .from('scim_setup_checklist')
        .upsert(
          {
            user_id: user.id,
            item_key: itemKey,
            confirmed,
            confirmed_at: confirmed ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,item_key' },
        );
      if (error) {
        // Reverte em caso de erro
        await fetchItems();
      }
      setSaving(null);
    },
    [user, fetchItems],
  );

  const isConfirmed = useCallback((key: string) => !!items[key]?.confirmed, [items]);

  return { items, isConfirmed, toggle, loading, saving, refetch: fetchItems };
}
