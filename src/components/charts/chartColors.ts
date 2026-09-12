// Paleta CVD-safe compartilhada pelos gráficos do produto.
export const chartColors = ['var(--ch1)', 'var(--ch2)', 'var(--ch3)', 'var(--ch4)', 'var(--ch5)'];

export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}
