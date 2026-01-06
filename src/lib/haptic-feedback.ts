/**
 * Haptic Feedback - Touch feedback for mobile devices
 * 
 * Provides haptic/vibration feedback for touch interactions
 */

// Check if vibration API is supported
const supportsVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 20, 30],
  error: [50, 30, 50, 30, 50],
  selection: 5,
};

/**
 * Trigger haptic feedback
 * @param pattern - The pattern to use for vibration
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!supportsVibration) return;
  
  try {
    navigator.vibrate(patterns[pattern]);
  } catch (e) {
    // Silently fail if vibration is not available
    console.debug('Haptic feedback not available:', e);
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if (!supportsVibration) return;
  
  try {
    navigator.vibrate(0);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Check if haptic feedback is available
 */
export function isHapticAvailable(): boolean {
  return supportsVibration;
}

/**
 * Create a haptic-enabled click handler
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  pattern: HapticPattern = 'light'
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    haptic(pattern);
    return handler(...args);
  };
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  return {
    trigger: haptic,
    stop: stopHaptic,
    isAvailable: isHapticAvailable(),
    withHaptic,
  };
}
