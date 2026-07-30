import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Tabela real: user_onboarding_progress
// Colunas: user_id, steps_completed (jsonb), is_completed (bool), last_step (text)
export interface OnboardingProgress {
  user_id: string;
  steps_completed: string[];
  is_completed: boolean;
  last_step: string | null;
  updated_at?: string;
}

const EMPTY: OnboardingProgress = {
  user_id: '',
  steps_completed: [],
  is_completed: false,
  last_step: null,
};

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_onboarding_progress' as never)
      .select('user_id, steps_completed, is_completed, last_step, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      const row = data as unknown as OnboardingProgress;
      setProgress({
        ...EMPTY,
        ...row,
        steps_completed: Array.isArray(row.steps_completed) ? row.steps_completed : [],
      });
    } else {
      setProgress(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const upsert = useCallback(
    async (patch: Partial<OnboardingProgress>) => {
      if (!user) return;
      const payload = {
        user_id: user.id,
        ...patch,
      };
      const { error } = await supabase
        .from('user_onboarding_progress' as never)
        .upsert(payload as never, { onConflict: 'user_id' });
      if (error) {
        console.error('[useOnboardingProgress] upsert error', error);
      }
      await fetchProgress();
    },
    [user, fetchProgress],
  );

  const iniciarTour = useCallback(async () => {
    if (!user) return;
    await upsert({
      steps_completed: [],
      is_completed: false,
      last_step: 'welcome',
    });
  }, [user, upsert]);

  const completarEtapa = useCallback(
    async (etapa: string) => {
      if (!user || !progress) return;
      const novas = Array.from(new Set([...(progress.steps_completed ?? []), etapa]));
      setProgress({ ...progress, steps_completed: novas, last_step: etapa });
      await supabase
        .from('user_onboarding_progress' as never)
        .update({ steps_completed: novas, last_step: etapa } as never)
        .eq('user_id', user.id);
    },
    [user, progress],
  );

  const finalizar = useCallback(
    async (_pulado = false) => {
      if (!user) return;
      await upsert({
        is_completed: true,
        last_step: progress?.last_step ?? 'done',
        steps_completed: progress?.steps_completed ?? [],
      });
    },
    [user, upsert, progress],
  );

  const reiniciar = useCallback(async () => {
    if (!user) return;
    await upsert({
      steps_completed: [],
      is_completed: false,
      last_step: 'welcome',
    });
  }, [user, upsert]);

  return { progress, loading, iniciarTour, completarEtapa, finalizar, reiniciar };
}