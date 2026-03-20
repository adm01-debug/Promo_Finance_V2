import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface PixTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  empresa_id: string | null;
  centro_custo_id: string | null;
  favorecido_nome: string;
  favorecido_cpf_cnpj: string | null;
  chave_pix: string;
  tipo_chave_pix: string;
  valor_padrao: number;
  valor_fixo: boolean;
  categoria: string | null;
  tags: string[];
  uso_count: number;
  ultimo_uso: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const usePixTemplates = () => {
  return useQuery({
    queryKey: ['pix-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pix_templates')
        .select('*')
        .eq('ativo', true)
        .order('uso_count', { ascending: false });
      if (error) throw error;
      return data as PixTemplate[];
    },
  });
};

export const useCreatePixTemplate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<PixTemplate, 'id' | 'created_at' | 'updated_at' | 'uso_count' | 'ultimo_uso' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('pix_templates')
        .insert({ ...template, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pix-templates'] });
      toast.success('Template PIX criado com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro ao criar template: ${e.message}`),
  });
};

export const useIncrementTemplateUso = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.rpc('increment_pix_template_uso' as any, { p_template_id: templateId });
      // Fallback if RPC doesn't exist - direct update
      if (error) {
        const { data: current } = await supabase.from('pix_templates').select('uso_count').eq('id', templateId).maybeSingle();
        const currentCount = (current?.uso_count as number) ?? 0;
        const { error: updateError } = await supabase
          .from('pix_templates')
          .update({ 
            uso_count: currentCount + 1,
            ultimo_uso: new Date().toISOString()
          })
          .eq('id', templateId);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pix-templates'] }),
  });
};

export const useDeletePixTemplate = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pix_templates')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pix-templates'] });
      toast.success('Template removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
