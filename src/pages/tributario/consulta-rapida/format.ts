/** Formata número como percentual. Aceita fração (0.18) ou pontos (18). */
export function pct(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  const base = Math.abs(valor) <= 1 ? valor * 100 : valor;
  return `${base.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}
