import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OnboardingProgress {
  user_id: string;
  etapas_completas: string[];
  iniciado_em: string;
  finalizado_em: string | null;
  pulado: boolean;
}

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_onboarding_progress' as never)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProgress((data as unknown as OnboardingProgress) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const iniciarTour = useCallback(async () => {
    if (!user) return;
    await supabase.from('user_onboarding_progress' as never).upsert({
      user_id: user.id,
      etapas_completas: [],
      iniciado_em: new Date().toISOString(),
      finalizado_em: null,
      pulado: false,
    } as never);
    await fetchProgress();
  }, [user, fetchProgress]);

  const completarEtapa = useCallback(async (etapa: string) => {
    if (!user || !progress) return;
    const novas = Array.from(new Set([...(progress.etapas_completas ?? []), etapa]));
    await supabase.from('user_onboarding_progress' as never).update({ etapas_completas: novas } as never).eq('user_id', user.id);
    setProgress({ ...progress, etapas_completas: novas });
  }, [user, progress]);

  const finalizar = useCallback(async (pulado = false) => {
    if (!user) return;
    await supabase.from('user_onboarding_progress' as never).upsert({
      user_id: user.id,
      etapas_completas: progress?.etapas_completas ?? [],
      iniciado_em: progress?.iniciado_em ?? new Date().toISOString(),
      finalizado_em: new Date().toISOString(),
      pulado,
    } as never);
    await fetchProgress();
  }, [user, progress, fetchProgress]);

  const reiniciar = useCallback(async () => {
    if (!user) return;
    await supabase.from('user_onboarding_progress' as never).upsert({
      user_id: user.id,
      etapas_completas: [],
      iniciado_em: new Date().toISOString(),
      finalizado_em: null,
      pulado: false,
    } as never);
    await fetchProgress();
  }, [user, fetchProgress]);

  return { progress, loading, iniciarTour, completarEtapa, finalizar, reiniciar };
}
