import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FilterPreset {
  id: string;
  name: string;
  entity_type: string;
  filters: any;
  empresa_id?: string;
  is_default: boolean;
  created_at: string;
}

export function useFilterPresets(entityType: string, empresaId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['filter-presets', entityType, empresaId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('user_filter_presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FilterPreset[];
    },
    enabled: !!user,
  });

  const savePreset = useMutation({
    mutationFn: async ({ name, filters, isDefault }: { name: string; filters: any; isDefault?: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_filter_presets')
        .insert([{
          user_id: user.id,
          entity_type: entityType,
          name,
          filters,
          empresa_id: empresaId === 'todas' ? null : empresaId,
          is_default: !!isDefault
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', entityType] });
      toast.success('Preset de filtros salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar preset: ' + error.message);
    }
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_filter_presets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', entityType] });
      toast.success('Preset removido.');
    }
  });

  return {
    presets,
    isLoading,
    savePreset,
    deletePreset
  };
}
