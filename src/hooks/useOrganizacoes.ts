/**
 * Camada de dados de organizações (multi-tenancy).
 *
 * Toda a autorização real vive nas policies de RLS; aqui só orquestramos
 * leitura/escrita e aplicamos as guardas de negócio do motor puro
 * `@/lib/organizacoes/convites` antes de enviar qualquer mutação.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  calcularExpiracao,
  emailValido,
  gerarTokenConvite,
  normalizarEmail,
  permiteRebaixarOuRemover,
  type MembroResumo,
  type OrgPapel,
} from '@/lib/organizacoes/convites';

export interface Organizacao {
  id: string;
  nome: string;
  cnpj: string | null;
  tipo: string;
  responsavel_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembroOrganizacao {
  id: string;
  organizacao_id: string;
  usuario_id: string;
  papel_na_org: OrgPapel;
  ativo: boolean;
  aceito_em: string | null;
  created_at: string;
  nome?: string | null;
  email?: string | null;
}

export interface ConviteOrganizacao {
  id: string;
  organizacao_id: string;
  email_convidado: string;
  papel_proposto: OrgPapel;
  token: string;
  expira_em: string;
  utilizado_em: string | null;
  created_at: string;
}

const CHAVE = {
  organizacoes: ['organizacoes'] as const,
  membros: (orgId: string) => ['organizacoes', orgId, 'membros'] as const,
  convites: (orgId: string) => ['organizacoes', orgId, 'convites'] as const,
};

export function useOrganizacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: CHAVE.organizacoes,
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Organizacao[]> => {
      const { data, error } = await supabase
        .from('organizacoes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Organizacao[];
    },
  });
}

export function useMembrosOrganizacao(organizacaoId: string | null) {
  return useQuery({
    queryKey: CHAVE.membros(organizacaoId ?? 'none'),
    enabled: Boolean(organizacaoId),
    queryFn: async (): Promise<MembroOrganizacao[]> => {
      const { data, error } = await supabase
        .from('organizacao_membros')
        .select('*')
        .eq('organizacao_id', organizacaoId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const membros = (data ?? []) as MembroOrganizacao[];
      if (membros.length === 0) return membros;

      // Enriquecimento best-effort: perfis podem estar fora do alcance do RLS.
      const { data: perfis } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', membros.map((m) => m.usuario_id));

      const indice = new Map(
        (perfis ?? []).map((p) => [p.id as string, p as { full_name: string | null; email: string | null }]),
      );

      return membros.map((membro) => ({
        ...membro,
        nome: indice.get(membro.usuario_id)?.full_name ?? null,
        email: indice.get(membro.usuario_id)?.email ?? null,
      }));
    },
  });
}

export function useConvitesOrganizacao(organizacaoId: string | null) {
  return useQuery({
    queryKey: CHAVE.convites(organizacaoId ?? 'none'),
    enabled: Boolean(organizacaoId),
    queryFn: async (): Promise<ConviteOrganizacao[]> => {
      const { data, error } = await supabase
        .from('convites')
        .select('*')
        .eq('organizacao_id', organizacaoId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConviteOrganizacao[];
    },
  });
}

export function useCriarOrganizacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { nome: string; cnpj?: string | null; tipo?: string }) => {
      if (!user?.id) throw new Error('Sessão expirada. Entre novamente.');
      const nome = input.nome.trim();
      if (nome.length < 2) throw new Error('Informe um nome válido para a organização.');

      const { data, error } = await supabase
        .from('organizacoes')
        .insert({
          nome,
          cnpj: input.cnpj?.replace(/\D/g, '') || null,
          tipo: input.tipo ?? 'EMPRESA',
          responsavel_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // O responsável entra automaticamente como membro ativo.
      const { error: erroMembro } = await supabase.from('organizacao_membros').insert({
        organizacao_id: data.id,
        usuario_id: user.id,
        papel_na_org: 'RESPONSAVEL',
        ativo: true,
        aceito_em: new Date().toISOString(),
      });
      if (erroMembro) throw erroMembro;

      return data as Organizacao;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAVE.organizacoes });
    },
  });
}

export function useCriarConvite(organizacaoId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { email: string; papel: OrgPapel }) => {
      if (!organizacaoId) throw new Error('Selecione uma organização.');
      if (!user?.id) throw new Error('Sessão expirada. Entre novamente.');
      if (!emailValido(input.email)) throw new Error('E-mail inválido.');
      if (input.papel === 'RESPONSAVEL') {
        throw new Error('O papel de responsável não pode ser concedido por convite.');
      }

      const { data, error } = await supabase
        .from('convites')
        .insert({
          organizacao_id: organizacaoId,
          email_convidado: normalizarEmail(input.email),
          papel_proposto: input.papel,
          token: gerarTokenConvite(),
          expira_em: calcularExpiracao(new Date()).toISOString(),
          convidado_por: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const convite = data as ConviteOrganizacao;

      // Envio do e-mail é best-effort: falha de provedor não invalida o convite,
      // que continua acessível pelo link copiável na UI.
      let emailEnviado = false;
      try {
        const { data: envio } = await supabase.functions.invoke<{ enviado?: boolean }>(
          'enviar-convite-organizacao',
          { body: { convite_id: convite.id, origin: window.location.origin } },
        );
        emailEnviado = envio?.enviado === true;
      } catch {
        emailEnviado = false;
      }

      return { ...convite, emailEnviado };
    },

    onSuccess: () => {
      if (organizacaoId) {
        void queryClient.invalidateQueries({ queryKey: CHAVE.convites(organizacaoId) });
      }
    },
  });
}

export function useRevogarConvite(organizacaoId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conviteId: string) => {
      const { error } = await supabase.from('convites').delete().eq('id', conviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (organizacaoId) {
        void queryClient.invalidateQueries({ queryKey: CHAVE.convites(organizacaoId) });
      }
    },
  });
}

export function useAtualizarMembro(organizacaoId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      membro: MembroOrganizacao;
      membros: readonly MembroResumo[];
      papel?: OrgPapel;
      ativo?: boolean;
    }) => {
      const novoPapel = input.ativo === false ? null : (input.papel ?? input.membro.papel_na_org);

      if (!permiteRebaixarOuRemover(input.membros, input.membro, novoPapel)) {
        throw new Error('A organização precisa manter ao menos um gestor ativo.');
      }

      const patch: Record<string, unknown> = {};
      if (input.papel) patch.papel_na_org = input.papel;
      if (typeof input.ativo === 'boolean') patch.ativo = input.ativo;

      const { error } = await supabase
        .from('organizacao_membros')
        .update(patch)
        .eq('id', input.membro.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (organizacaoId) {
        void queryClient.invalidateQueries({ queryKey: CHAVE.membros(organizacaoId) });
      }
    },
  });
}

export interface RespostaAceite {
  organizacao_id: string;
  organizacao_nome: string;
  papel: OrgPapel;
}

export function useAceitarConvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string): Promise<RespostaAceite> => {
      const { data, error } = await supabase.functions.invoke('aceitar-convite', {
        body: { token },
      });
      if (error) throw error;
      const payload = data as { error?: string } & Partial<RespostaAceite>;
      if (payload?.error) throw new Error(payload.error);
      if (!payload?.organizacao_id) throw new Error('Não foi possível aceitar o convite.');
      return payload as RespostaAceite;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAVE.organizacoes });
    },
  });
}
