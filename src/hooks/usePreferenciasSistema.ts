import { useCallback, useEffect, useState } from 'react';
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
  const [preferencias, setPreferencias] = useState<PreferenciasSistema>(PREFERENCIAS_DEFAULT);
  const [carregado, setCarregado] = useState(false);
  const [falhaLeitura, setFalhaLeitura] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregado(false);
    setFalhaLeitura(false);
    if (!user) {
      setPreferencias(PREFERENCIAS_DEFAULT);
      setCarregado(true);
      return;
    }
    // Tabela fora do typemap gerado (foi dropada em prod e está sendo
    // restaurada pela migration 20261121000000) — cast any no builder.
    const prefsTable = supabase.from('user_preferences' as any);
    (prefsTable.select('payload') as any)
      .eq('user_id', user.id)
      .eq('key', KEY)
      .maybeSingle()
      .then(
        ({
          data,
          error,
        }: {
          data: { payload?: unknown } | null;
          error: { message: string } | null;
        }) => {
          if (!ativo) return;
          if (error) {
            console.warn('[usePreferenciasSistema] load falhou', error.message);
            setFalhaLeitura(true);
            // não marca carregado: salvar/editar permanecem bloqueados
            return;
          }
          if (data?.payload && typeof data.payload === 'object') {
            setPreferencias({
              ...PREFERENCIAS_DEFAULT,
              ...(data.payload as Partial<PreferenciasSistema>),
            });
          } else {
            setPreferencias(PREFERENCIAS_DEFAULT);
          }
          setCarregado(true);
        }
      );
    return () => {
      ativo = false;
    };
  }, [user?.id]);

  const salvar = useCallback(
    async (novas: PreferenciasSistema): Promise<{ ok: boolean; erro?: string }> => {
      if (!user) return { ok: false, erro: 'Usuário não autenticado.' };
      if (!carregado)
        return { ok: false, erro: 'Preferências ainda carregando. Tente novamente em instantes.' };
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
    [user, carregado]
  );

  return { preferencias, setPreferencias, salvar, carregado, falhaLeitura };
}
