/**
 * Etapa R — Preferências de envio do digest de conformidade fiscal.
 *
 * A linha é por usuário (`user_id` único) e protegida por RLS: cada pessoa lê
 * e grava apenas a própria. O hook faz upsert por `user_id`, o que torna a
 * primeira gravação e as atualizações seguintes idempotentes.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  FrequenciaDigest,
  SeveridadeDigest,
} from '@/lib/tributario/obrigacoes/preferencias-digest';

export interface DigestPreferenceRow {
  id: string;
  user_id: string;
  ativo: boolean;
  frequencia: FrequenciaDigest;
  dia_semana: number;
  dia_mes: number;
  hora_envio: number;
  severidade_minima: SeveridadeDigest;
  tipos_ignorados: string[];
  empresas_filtro: string[];
  email_alternativo: string | null;
  max_alertas: number;
  ultimo_envio_em: string | null;
  ultimo_hash: string | null;
}

const COLUNAS =
  'id,user_id,ativo,frequencia,dia_semana,dia_mes,hora_envio,severidade_minima,tipos_ignorados,empresas_filtro,email_alternativo,max_alertas,ultimo_envio_em,ultimo_hash';

/** Valores exibidos enquanto o usuário nunca salvou preferências. */
export const PREFERENCIA_DIGEST_PADRAO = {
  ativo: true,
  frequencia: 'diaria' as FrequenciaDigest,
  dia_semana: 1,
  dia_mes: 1,
  hora_envio: 8,
  severidade_minima: 'media' as SeveridadeDigest,
  tipos_ignorados: [] as string[],
  empresas_filtro: [] as string[],
  email_alternativo: null as string | null,
  max_alertas: 50,
};

export type DigestPreferenceInput = typeof PREFERENCIA_DIGEST_PADRAO;

export function useDigestPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['digest-preferences'],
    staleTime: 60_000,
    queryFn: async (): Promise<DigestPreferenceRow | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_digest_preferences')
        .select(COLUNAS)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return (data as DigestPreferenceRow | null) ?? null;
    },
  });

  const salvar = useMutation({
    mutationFn: async (input: DigestPreferenceInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Sessão expirada. Entre novamente para salvar.');

      const payload = {
        user_id: userId,
        ...input,
        email_alternativo: input.email_alternativo?.trim() || null,
      };

      const { error } = await supabase
        .from('user_digest_preferences')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest-preferences'] });
      toast.success('Preferências do resumo salvas');
    },
    onError: (erro: unknown) => {
      const mensagem = erro instanceof Error ? erro.message : 'Falha ao salvar preferências';
      toast.error(mensagem);
    },
  });

  return {
    preferencia: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    salvar: salvar.mutate,
    isSaving: salvar.isPending,
  };
}
