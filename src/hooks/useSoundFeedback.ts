/**
 * Hook para gerenciar sons de feedback
 * Integra o sistema de sons existente com React
 */

import { useCallback } from 'react';
import { useSoundFeedback as useBaseSoundFeedback } from '@/lib/sound-feedback';

export type SoundType = 'success' | 'error' | 'notification' | 'click' | 'warning';

export function useSoundFeedback() {
  const { play, config, toggle, setVolume } = useBaseSoundFeedback();

  const playSound = useCallback((type: SoundType) => {
    if (config.enabled) {
      play(type);
    }
  }, [config.enabled, play]);

  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playWarning = useCallback(() => playSound('warning'), [playSound]);

  return {
    playSound,
    playSuccess,
    playError,
    playNotification,
    playClick,
    playWarning,
    isEnabled: config.enabled,
    volume: config.volume,
    toggle,
    setVolume,
  };
}

export default useSoundFeedback;
