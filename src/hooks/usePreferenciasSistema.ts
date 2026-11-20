import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

export interface PreferenciasSistema {
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
  alertasVencimento: number;
  alertasFluxoCaixa: boolean;
  temaEscuro: boolean;
  formatoData: string;
  formatoMoeda: string;
  fusoHorario: string;
  backupAutomatico: boolean;
  frequenciaBackup: string;
}

export const PREFERENCIAS_DEFAULT: PreferenciasSistema = {
  notificacoesEmail: true,
  notificacoesPush: true,
  alertasVencimento: 3,
  alertasFluxoCaixa: true,
  temaEscuro: false,
  formatoData: 'dd/MM/yyyy',
  formatoMoeda: 'BRL',
  fusoHorario: 'America/Sao_Paulo',
  backupAutomatico: true,
  frequenciaBackup: 'diario',
};

const KEY = 'configuracoes.sistema';

/**
 * Preferências do painel "Configurações > Sistema" persistidas por usuário na
 * tabela user_preferences (key/value JSONB). Achado #3 do inventário: antes a
 * tela só exibia toast de sucesso e nada era gravado — no reload tudo voltava
 * ao default. Com a tabela restaurada (migration 20261121000000), o load lê a
 * chave do usuário e o save faz upsert; sem registro ainda, usa o default.
 */
export function usePreferenciasSistema() {
  const { user } = useAuth();

  // Leitura via TanStack Query (convenção do repo, AGENTS.md): retry com
  // backoff + refetchOnReconnect do queryClient global fazem a falha
  // transitória (ex.: rede) recuperar sozinha quando a conexão volta,
  // sem exigir remontagem do formulário.
  const query = useQuery({
    queryKey: ['user_preferences', user?.id ?? 'anon', KEY],
    queryFn: async (): Promise<PreferenciasSistema> => {
      if (!user) return PREFERENCIAS_DEFAULT;
      // Tabela fora do typemap gerado (foi dropada em prod e está sendo
      // restaurada pela migration 20261121000000) — cast any no builder.
      const prefsTable = supabase.from('user_preferences' as any);
      const { data, error } = await (prefsTable.select('payload') as any)
        .eq('user_id', user.id)
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.payload && typeof data.payload === 'object') {
        return {
          ...PREFERENCIAS_DEFAULT,
          ...(data.payload as Partial<PreferenciasSistema>),
        };
      }
      return PREFERENCIAS_DEFAULT;
    },
    enabled: !!user,
  });

  const preferencias = query.data ?? PREFERENCIAS_DEFAULT;
  // erro real de leitura: carregado continua false (salvar bloqueado) mas a
  // query continua ativa — retry/refetchOnReconnect recuperam sozinho.
  const falhaLeitura = !!query.error;
  const carregado = query.isSuccess;

  // Mantém o formulário editável durante a consulta (o usuário pode editar
  // antes da leitura concluir), sem sobrescrever o que ele editar: o merge
  // do payload só acontece no primeiro resultado de sucesso.
  const [formulario, setFormulario] = useState<PreferenciasSistema | null>(null);
  // Campos que o usuário tocou antes da leitura concluir (ou em qualquer
  // momento): só eles são preservados no merge com o resultado do banco.
  // Sem isso, uma edição durante a consulta criaria o formulário a partir dos
  // defaults e o save sobrescreveria valores persistidos nos demais campos
  // (achado Devin/Codex no review da PR #484).
  const [camposEditados, setCamposEditados] = useState<Set<keyof PreferenciasSistema>>(
    () => new Set()
  );
  useEffect(() => {
    // usuário trocou → recomeça do zero
    setFormulario(null);
    setCamposEditados(() => new Set());
  }, [user?.id]);
  useEffect(() => {
    if (!query.isSuccess) return;
    setFormulario((anterior) => {
      if (anterior !== null) {
        // leitura chegou (ou refetch pós-falha) após edição do usuário:
        // base = dados autoritativos do banco + só os campos que ele tocou.
        const mesclado: PreferenciasSistema = {
          ...PREFERENCIAS_DEFAULT,
          ...(query.data ?? {}),
        };
        const editados: Record<string, unknown> = {};
        for (const chave of camposEditados) {
          editados[chave] = anterior[chave];
        }
        Object.assign(mesclado, editados);
        return mesclado;
      }
      return {
        ...PREFERENCIAS_DEFAULT,
        ...(query.data ?? {}),
      };
    });
  }, [query.isSuccess, query.data, camposEditados]);

  const preferenciasVisiveis = formulario ?? preferencias;

  // Preserva o contrato do useState original (valor direto ou updater fn),
  // mantendo a base não-nula para os consumidores (SistemaTab/Notificacoes).
  const setPreferencias = useCallback(
    (acao: PreferenciasSistema | ((p: PreferenciasSistema) => PreferenciasSistema)) => {
      setFormulario((anterior) => {
        const base = anterior ?? PREFERENCIAS_DEFAULT;
        const proximo = typeof acao === 'function' ? acao(base) : acao;
        // marca apenas os campos realmente alterados (para o merge pós-leitura)
        const alterados = (Object.keys(proximo) as (keyof PreferenciasSistema)[]).filter(
          (chave) => proximo[chave] !== base[chave]
        );
        if (alterados.length > 0) {
          setCamposEditados((prev) => {
            const novo = new Set(prev);
            alterados.forEach((chave) => novo.add(chave));
            return novo;
          });
        }
        return proximo;
      });
    },
    []
  );

  const salvar = useCallback(
    async (novas: PreferenciasSistema): Promise<{ ok: boolean; erro?: string }> => {
      if (!user) return { ok: false, erro: 'Usuário não autenticado.' };
      if (!carregado)
        return {
          ok: false,
          erro: falhaLeitura
            ? 'A leitura falhou e as preferências não puderam ser carregadas.'
            : 'Preferências ainda carregando. Tente novamente em instantes.',
        };
      const { error } = await supabase.from('user_preferences' as any).upsert(
        {
          user_id: user.id,
          key: KEY,
          payload: novas as unknown as Json,
        },
        { onConflict: 'user_id,key' }
      );
      if (error) {
        return { ok: false, erro: error.message };
      }
      return { ok: true };
    },
    [user, carregado, falhaLeitura]
  );

  return {
    preferencias: preferenciasVisiveis,
    setPreferencias,
    salvar,
    carregado,
    falhaLeitura,
  };
}
