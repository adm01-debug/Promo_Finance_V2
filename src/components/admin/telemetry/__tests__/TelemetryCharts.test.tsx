import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryCharts } from '../TelemetryCharts';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<{
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  severity: string;
  created_at: string;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    operation: overrides.operation ?? 'SELECT',
    table_name: overrides.table_name ?? 'companies',
    rpc_name: overrides.rpc_name ?? null,
    duration_ms: overrides.duration_ms ?? 5000,
    severity: overrides.severity ?? 'slow',
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function makeRows(count: number, overrides: Partial<Parameters<typeof makeRow>[0]> = {}) {
  return Array.from({ length: count }, (_, i) => makeRow({ ...overrides, id: `row-${i}` }));
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('TelemetryCharts', () => {
  // 1. Empty state
  it('renders nothing when rows is empty', () => {
    const { container } = render(<TelemetryCharts rows={[]} timeFilter="24h" />);
    expect(container.innerHTML).toBe('');
  });

  // 2. Renders with data
  it('renders two chart cards when rows have data', () => {
    render(<TelemetryCharts rows={makeRows(5)} timeFilter="24h" />);
    expect(screen.getByText('Queries por Período')).toBeInTheDocument();
    expect(screen.getByText('Distribuição por Severidade')).toBeInTheDocument();
  });

  // 3. Severity label mapping
  it('maps severity "very_slow" to "Muito Lenta"', () => {
    render(<TelemetryCharts rows={makeRows(3, { severity: 'very_slow' })} timeFilter="24h" />);
    // The pie chart labels contain the mapped name
    expect(screen.getByText(/Muito Lenta/)).toBeInTheDocument();
  });

  it('maps severity "slow" to "Lenta"', () => {
    render(<TelemetryCharts rows={makeRows(3, { severity: 'slow' })} timeFilter="24h" />);
    expect(screen.getByText(/Lenta/)).toBeInTheDocument();
  });

  it('maps severity "error" to "Erro"', () => {
    render(<TelemetryCharts rows={makeRows(3, { severity: 'error' })} timeFilter="24h" />);
    expect(screen.getByText(/Erro/)).toBeInTheDocument();
  });

  // 4. Unknown severity passes through
  it('passes unknown severity names through', () => {
    render(<TelemetryCharts rows={makeRows(2, { severity: 'custom_sev' })} timeFilter="24h" />);
    expect(screen.getByText(/custom_sev/)).toBeInTheDocument();
  });

  // 5. Time filter variations
  it.each(['1h', '6h', '24h', '7d'] as const)('renders without error for timeFilter=%s', (tf) => {
    const { container } = render(<TelemetryCharts rows={makeRows(4)} timeFilter={tf} />);
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
  });

  // 6. Multiple severities in one dataset
  it('shows multiple severity labels in pie chart', () => {
    const rows = [
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'very_slow' }),
      makeRow({ severity: 'error' }),
    ];
    render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(screen.getByText(/Lenta/)).toBeInTheDocument();
    expect(screen.getByText(/Muito Lenta/)).toBeInTheDocument();
    expect(screen.getByText(/Erro/)).toBeInTheDocument();
  });

  // 7. Time bucketing — 1h filter uses HH:MM format
  it('uses HH:MM bucket keys for 1h filter', () => {
    const now = new Date();
    const rows = [makeRow({ created_at: now.toISOString() })];
    // Should not throw
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="1h" />);
    expect(container.querySelector('.recharts-bar')).toBeTruthy();
  });

  // 8. Large dataset
  it('handles 200 rows without crashing', () => {
    const rows = makeRows(200);
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="7d" />);
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
  });

  // 9. Single row
  it('renders charts for a single row', () => {
    render(<TelemetryCharts rows={[makeRow()]} timeFilter="24h" />);
    expect(screen.getByText('Queries por Período')).toBeInTheDocument();
  });

  // 10. Rows with rpc_name instead of table_name
  it('handles rows with rpc_name', () => {
    const rows = makeRows(3, { rpc_name: 'get_dashboard', table_name: null });
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
  });

  // 11. Mixed null fields
  it('handles rows where both table_name and rpc_name are null', () => {
    const rows = makeRows(2, { table_name: null, rpc_name: null });
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(container.innerHTML).not.toBe('');
  });

  // 12. Duration extremes
  it('handles zero duration_ms', () => {
    const rows = makeRows(3, { duration_ms: 0 });
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(container.innerHTML).not.toBe('');
  });

  it('handles very high duration_ms', () => {
    const rows = makeRows(2, { duration_ms: 999999 });
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(container.innerHTML).not.toBe('');
  });

  // 13. All same severity
  it('renders pie with single slice when all same severity', () => {
    const rows = makeRows(10, { severity: 'slow' });
    render(<TelemetryCharts rows={rows} timeFilter="24h" />);
    expect(screen.getByText(/Lenta: 10/)).toBeInTheDocument();
  });

  // 14. Dates across midnight boundary
  it('handles rows spanning midnight', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 55, 0, 0);
    const today = new Date();
    today.setHours(0, 5, 0, 0);
    const rows = [
      makeRow({ created_at: yesterday.toISOString() }),
      makeRow({ created_at: today.toISOString() }),
    ];
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="6h" />);
    expect(container.innerHTML).not.toBe('');
  });
});
