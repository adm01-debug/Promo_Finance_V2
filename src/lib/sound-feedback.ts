// Sistema de feedback sonoro para eventos importantes
// Sons são opcionais e podem ser desabilitados pelo usuário

type SoundType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'notification'
  | 'payment'
  | 'goal'
  | 'message'
  | 'click';

interface SoundConfig {
  enabled: boolean;
  volume: number; // 0-1
}

// Configuração padrão
const DEFAULT_CONFIG: SoundConfig = {
  enabled: true,
  volume: 0.5,
};

// Storage key
const SOUND_CONFIG_KEY = 'promo-financeiro-sound-config';

// Obter configuração do localStorage
function getConfig(): SoundConfig {
  try {
    const stored = localStorage.getItem(SOUND_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_CONFIG;
}

// Salvar configuração
export function setSoundConfig(config: Partial<SoundConfig>) {
  const current = getConfig();
  const newConfig = { ...current, ...config };
  localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(newConfig));
  return newConfig;
}

// Obter configuração atual
export function getSoundConfig(): SoundConfig {
  return getConfig();
}

// Toggle sons
export function toggleSounds(enabled?: boolean) {
  const current = getConfig();
  const newEnabled = enabled !== undefined ? enabled : !current.enabled;
  setSoundConfig({ enabled: newEnabled });
  return newEnabled;
}

// Ajustar volume
export function setVolume(volume: number) {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  setSoundConfig({ volume: clampedVolume });
  return clampedVolume;
}

// Frequências base para cada tipo de som (Web Audio API)
const SOUND_FREQUENCIES: Record<SoundType, number[]> = {
  success: [523.25, 659.25, 783.99], // C5, E5, G5 - Major chord
  error: [311.13, 293.66], // Eb4, D4 - Dissonant
  warning: [440, 493.88], // A4, B4 - Rising
  notification: [587.33, 659.25], // D5, E5 - Ding dong
  payment: [523.25, 659.25, 783.99, 1046.50], // C major arpeggio
  goal: [523.25, 587.33, 659.25, 783.99, 1046.50], // Celebration arpeggio
  message: [880], // A5 - Single ping
  click: [1200], // High tick
};

// Durações para cada tipo
const SOUND_DURATIONS: Record<SoundType, number> = {
  success: 0.15,
  error: 0.2,
  warning: 0.15,
  notification: 0.12,
  payment: 0.12,
  goal: 0.1,
  message: 0.08,
  click: 0.03,
};

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  
  // Resume if suspended (autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
}

// Tocar um som
export function playSound(type: SoundType) {
  const config = getConfig();
  
  if (!config.enabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const frequencies = SOUND_FREQUENCIES[type];
  const duration = SOUND_DURATIONS[type];
  const now = ctx.currentTime;
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Tipo de onda baseado no som
    oscillator.type = type === 'click' ? 'square' : 'sine';
    oscillator.frequency.value = freq;
    
    // Envelope de volume
    const startTime = now + (index * duration);
    const endTime = startTime + duration;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(config.volume * 0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
    
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.1);
  });
}

// Helpers pré-configurados
export const sounds = {
  success: () => playSound('success'),
  error: () => playSound('error'),
  warning: () => playSound('warning'),
  notification: () => playSound('notification'),
  payment: () => playSound('payment'),
  goal: () => playSound('goal'),
  message: () => playSound('message'),
  click: () => playSound('click'),
};

// Hook para usar sons em componentes React
import { useCallback, useState, useEffect } from 'react';

export function useSoundFeedback() {
  const [config, setConfig] = useState<SoundConfig>(DEFAULT_CONFIG);
  
  useEffect(() => {
    setConfig(getConfig());
  }, []);
  
  const toggle = useCallback((enabled?: boolean) => {
    const newEnabled = toggleSounds(enabled);
    setConfig(prev => ({ ...prev, enabled: newEnabled }));
    return newEnabled;
  }, []);
  
  const changeVolume = useCallback((volume: number) => {
    const newVolume = setVolume(volume);
    setConfig(prev => ({ ...prev, volume: newVolume }));
    return newVolume;
  }, []);
  
  return {
    config,
    toggle,
    setVolume: changeVolume,
    play: playSound,
    sounds,
  };
}
