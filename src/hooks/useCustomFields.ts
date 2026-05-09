import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EntityType = 'contas_pagar' | 'contas_receber' | 'clientes' | 'fornecedores' | 'empresas';
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface CustomFieldDefinition {
  id: string;
  entity_type: EntityType;
  name: string;
  field_type: FieldType;
  label: string;
  placeholder: string | null;
  options: string[] | null;
  required: boolean;
  active: boolean;
  empresa_id: string;
  created_at: string;
}

export function useCustomFieldDefinitions(entityType?: EntityType, empresaId?: string) {
  return useQuery({
    queryKey: ['custom-field-definitions', entityType, empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      let query = supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('active', true);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as any) as CustomFieldDefinition[];
    },
    enabled: !!empresaId,
  });
}

export function useSaveCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CustomFieldDefinition> & { entity_type: EntityType; name: string; label: string; empresa_id: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from('custom_field_definitions').update(rest).eq('id', id).select().maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('custom_field_definitions').insert(rest).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Campo customizado salvo');
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_field_definitions').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Campo removido');
    },
  });
}
