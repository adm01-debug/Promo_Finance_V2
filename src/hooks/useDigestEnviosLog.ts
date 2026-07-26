/**
 * Etapa T — Leitura do log de envios do digest (somente admin, via RLS).
 *
 * A tabela é append-only pela Edge Function; aqui só há leitura. O período é
 * calculado no cliente porque o filtro é apenas de exibição — a RLS já garante
 * que usuários não-admin não recebem linha alguma.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  RegistroEnvioDigest,
  SituacaoEnvioDigest,
} from '@/lib/tributario/obrigacoes/observabilidade-digest';

const COLUNAS =
  'id,execucao_id,user_id,email,situacao,motivo,erro,total_alertas,total_empresas,severidade_maxima,multa_total,hash_conteudo,duplicado,simulado,created_at';

interface LinhaBruta {
  id: string;
  execucao_id: string;
  user_id: string | null;
  email: string;
  situacao: string;
  motivo: string | null;
  erro: string | null;
  total_alertas: number | null;
  total_empresas: number | null;
  severidade_maxima: string | null;
  multa_total: number | string | null;
  hash_conteudo: string | null;
  duplicado: boolean | null;
  simulado: boolean | null;
  created_at: string;
}

const SITUACOES: readonly SituacaoEnvioDigest[] = ['enviado', 'ignorado', 'falhou', 'simulado'];

function mapear(l: LinhaBruta): RegistroEnvioDigest {
  const situacao = SITUACOES.includes(l.situacao as SituacaoEnvioDigest)
    ? (l.situacao as SituacaoEnvioDigest)
    : 'ignorado';
  return {
    id: l.id,
    execucaoId: l.execucao_id,
    userId: l.user_id,
    email: l.email,
    situacao,
    motivo: l.motivo,
    erro: l.erro,
    totalAlertas: Number(l.total_alertas ?? 0),
    totalEmpresas: Number(l.total_empresas ?? 0),
    severidadeMaxima: l.severidade_maxima,
    multaTotal: Number(l.multa_total ?? 0),
    hashConteudo: l.hash_conteudo,
    duplicado: Boolean(l.duplicado),
    simulado: Boolean(l.simulado),
    criadoEm: l.created_at,
  };
}

export function useDigestEnviosLog(dias = 30) {
  return useQuery({
    queryKey: ['digest-envios-log', dias],
    staleTime: 60_000,
    queryFn: async (): Promise<RegistroEnvioDigest[]> => {
      const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('digest_envios_log')
        .select(COLUNAS)
        .gte('created_at', desde)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return ((data ?? []) as LinhaBruta[]).map(mapear);
    },
  });
}
