export function scoreColor(score: number) {
  if (score >= 95)
    return {
      tone: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
      label: 'Excelente',
      shadow: 'shadow-success/20',
    };
  if (score >= 80)
    return {
      tone: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      label: 'Bom',
      shadow: 'shadow-primary/20',
    };
  if (score >= 60)
    return {
      tone: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      label: 'Atenção',
      shadow: 'shadow-warning/20',
    };
  return {
    tone: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    label: 'Crítico',
    shadow: 'shadow-destructive/20',
  };
}
