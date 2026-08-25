import confetti from 'canvas-confetti';
import { sounds } from '@/lib/sound-feedback';

// HAPTIC FEEDBACK
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 20],
      error: [50, 30, 50],
    };
    navigator.vibrate(patterns[type]);
  }
}

// CONFETTI CELEBRATIONS
interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

// Confetti color palette (hex required by canvas-confetti library)
const CONFETTI_COLORS: Record<string, string[]> = {
  // Valores da paleta Vela (ok/warn/acc/acc-2/bad/info) — hex porque o canvas-confetti não resolve var()
  success: ['#33d493', '#2bb881', '#5ce0ad', '#8aebc9'],
  primary: ['#7c5cff', '#9d86ff', '#b9a3ff'],
  warning: ['#f7b84e', '#e0a43a', '#c78a2f'],
  celebration: ['#f76d7d', '#e05a68', '#9d86ff'],
  mixed: ['#33d493', '#56a8ff', '#7c5cff', '#f7b84e', '#f76d7d'],
};

export function celebrateSuccess(options: ConfettiOptions = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: [...CONFETTI_COLORS.mixed],
  };

  confetti({ ...defaults, ...options });
  sounds.goal();
  triggerHaptic('success');
}

export function celebratePayment() {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = [CONFETTI_COLORS.success[0], CONFETTI_COLORS.primary[0]];

  (function frame() {
    confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  sounds.payment();
  triggerHaptic('success');
}

export function celebrateGoal() {
  confetti({
    particleCount: 150,
    spread: 180,
    origin: { y: 0.2 },
    colors: [...CONFETTI_COLORS.warning],
    shapes: ['star'],
    ticks: 200,
  });

  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.3 },
      colors: CONFETTI_COLORS.success.slice(0, 2),
    });
  }, 300);

  sounds.goal();
  triggerHaptic('heavy');
}
