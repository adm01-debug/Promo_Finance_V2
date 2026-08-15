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
  success: ['#10b981', '#16a34a', '#22c55e', '#4ade80'],
  primary: ['#3b82f6', '#6366f1', '#8b5cf6'],
  warning: ['#fbbf24', '#f59e0b', '#d97706'],
  celebration: ['#ec4899', '#f43f5e', '#a855f7'],
  mixed: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
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
