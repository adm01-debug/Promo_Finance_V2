export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function formatPct(v: number, digits = 2): string {
  return `${(v * 100).toFixed(digits)}%`;
}
