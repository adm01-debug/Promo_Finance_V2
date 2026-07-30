export function formatPct(done: number, total: number): string {
  if (total <= 0) return '0';
  return ((done / total) * 100).toFixed(done >= total ? 0 : 1);
}

export function formatRate(itemsPerSecond: number): string {
  if (!isFinite(itemsPerSecond) || itemsPerSecond <= 0) return '—';
  if (itemsPerSecond >= 1) return `${itemsPerSecond.toFixed(1)} itens/s`;
  const perMin = itemsPerSecond * 60;
  if (perMin >= 1) return `${perMin.toFixed(1)} itens/min`;
  return `${(perMin * 60).toFixed(1)} itens/h`;
}

export function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '0s';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s === 0 ? `${m}min` : `${m}min ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}min`;
}

export interface ImportProgress {
  done: number;
  total: number;
  chunkSize?: number;
  rate: number;
  etaMs: number;
  elapsedMs: number;
}
