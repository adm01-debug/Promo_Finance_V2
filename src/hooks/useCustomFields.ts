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
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('active', true);

      if (error) throw error;

      let filtered = data ?? [];
      if (entityType) {
        filtered = filtered.filter((f) => f.entity_type === entityType);
      }

      return filtered.map((f) => ({
        ...f,
        entity_type: f.entity_type as EntityType,
        field_type: f.field_type as FieldType,
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        required: !!f.required,
      })) as CustomFieldDefinition[];
    },
    enabled: !!empresaId,
  });
}

export function useSaveCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<CustomFieldDefinition> & { entity_type: EntityType; name: string; label: string; empresa_id: string },
    ) => {
      const { id, ...rest } = payload;
      const dbPayload = {
        ...rest,
        required: payload.required ?? false,
      };

      if (id) {
        const { data, error } = await supabase
          .from('custom_field_definitions')
          .update(dbPayload as never)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert(dbPayload as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Campo customizado salvo');
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update({ active: false } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Campo removido');
    },
  });
}
