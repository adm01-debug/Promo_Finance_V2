export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color: string): number {
  // Simplified - production should use proper color parsing
  return 0.5;
}

export function checkContrast(fg: string, bg: string): boolean {
  const ratio = getContrastRatio(fg, bg);
  return ratio >= 4.5; // WCAG AA
}
