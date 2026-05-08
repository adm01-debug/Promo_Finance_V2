import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface UserEmpresaLink {
  id: string;
  empresa_id: string;
  role: 'admin' | 'financeiro' | 'operacional' | 'visualizador';
  is_default: boolean;
  provisioned_via: 'manual' | 'sso' | 'scim';
  ativo: boolean;
  empresa: { id: string; razao_social: string; nome_fantasia: string | null; cnpj: string };
}

export function useUserEmpresas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-empresas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('user_empresas')
        .select('id, empresa_id, role, is_default, provisioned_via, ativo, empresa:empresas(id,razao_social,nome_fantasia,cnpj)')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('is_default', { ascending: false });
      if (error) throw error;
      const links = (data ?? []) as UserEmpresaLink[];

      // Fallback: sistema exclusivo Grupo Promo Brindes — usuário autenticado
      // sem vínculos específicos recebe acesso automático a todas as empresas ativas do grupo.
      if (links.length === 0) {
        const { data: empresasData } = await (supabase as any)
          .from('empresas')
          .select('id, razao_social, nome_fantasia, cnpj')
          .eq('ativo', true)
          .order('nome_fantasia', { ascending: true });

        const empresas = (empresasData ?? []) as Array<{ id: string; razao_social: string; nome_fantasia: string | null; cnpj: string }>;
        const defaultId = localStorage.getItem(STORAGE_KEY);
        return empresas.map((e, idx) => ({
          id: `auto-${e.id}`,
          empresa_id: e.id,
          role: 'admin' as const,
          is_default: defaultId ? e.id === defaultId : idx === 0,
          provisioned_via: 'manual' as const,
          ativo: true,
          empresa: e,
        })) as UserEmpresaLink[];
      }

      return links;
    },
    enabled: !!user,
  });
}

const STORAGE_KEY = 'pf:current-empresa-id';

export function getCurrentEmpresaId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
export function setCurrentEmpresaId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('current-empresa-changed', { detail: id }));
}

export function useDefinirEmpresaPadrao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      // Zera o flag para todos os vínculos do usuário
      const { error: e1 } = await (supabase as any)
        .from('user_empresas')
        .update({ is_default: false })
        .eq('user_id', user.id);
      if (e1) throw e1;
      // Marca o vínculo selecionado
      const { error: e2 } = await (supabase as any)
        .from('user_empresas')
        .update({ is_default: true })
        .eq('id', linkId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-empresas'] });
    },
    onError: (err: Error) => {
      toast.error('Não foi possível definir a empresa padrão: ' + err.message);
    },
  });
}
