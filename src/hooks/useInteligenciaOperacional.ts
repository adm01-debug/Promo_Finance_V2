import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanoAcao {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  prazo: string | null;
  responsavel: string | null;
  progresso: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface KPIOperacional {
  id: string;
  user_id: string;
  nome: string;
  valor_atual: number;
  meta: number;
  unidade: string | null;
  tendencia: 'subindo' | 'descendo' | 'estavel' | null;
  categoria: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlanosAcao() {
  return useQuery({
    queryKey: ['planos-acao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos_acao')
        .select('*')
        .order('prioridade', { ascending: false })
        .order('prazo', { ascending: true });
      if (error) throw error;
      return data as PlanoAcao[];
    },
  });
}

export function useCreatePlanoAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plano: Partial<PlanoAcao>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const insertData: any = { ...plano, user_id: userData.user.id };
      
      const { data, error } = await supabase
        .from('planos_acao')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },


    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos-acao'] });
      toast.success('Plano de ação criado com sucesso!');
    },
  });
}

export function useUpdatePlanoAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PlanoAcao>) => {
      const { data, error } = await supabase
        .from('planos_acao')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos-acao'] });
      toast.success('Plano de ação atualizado!');
    },
  });
}

export function useKPIsOperacionais() {
  return useQuery({
    queryKey: ['kpis-operacionais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis_operacionais')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as KPIOperacional[];
    },
  });
}
