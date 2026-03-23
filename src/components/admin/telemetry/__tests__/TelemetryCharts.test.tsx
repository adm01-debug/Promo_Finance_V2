import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryCharts } from '../TelemetryCharts';

function makeRow(overrides: Partial<{
  id: string; operation: string; table_name: string | null;
  rpc_name: string | null; duration_ms: number; severity: string; created_at: string;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    operation: overrides.operation ?? 'SELECT',
    table_name: 'table_name' in overrides ? (overrides.table_name ?? null) : 'companies',
    rpc_name: 'rpc_name' in overrides ? (overrides.rpc_name ?? null) : null,
    duration_ms: overrides.duration_ms ?? 5000,
    severity: overrides.severity ?? 'slow',
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function makeRows(count: number, overrides: Parameters<typeof makeRow>[0] = {}) {
  return Array.from({ length: count }, (_, i) => makeRow({ ...overrides, id: `row-${i}` }));
}

describe('TelemetryCharts', () => {
  it('renders nothing when rows is empty', () => {
    const { container } = render(<TelemetryCharts rows={[]} timeFilter="24h" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders two chart cards when rows have data', () => {
    render(<TelemetryCharts rows={makeRows(5)} timeFilter="24h" />);
    expect(screen.getByText('Queries por Período')).toBeInTheDocument();
    expect(screen.getByText('Distribuição por Severidade')).toBeInTheDocument();
  });

  it.each(['1h', '6h', '24h', '7d'] as const)('renders without error for timeFilter=%s', (tf) => {
    const { container } = render(<TelemetryCharts rows={makeRows(4)} timeFilter={tf} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders charts for a single row', () => {
    render(<TelemetryCharts rows={[makeRow()]} timeFilter="24h" />);
    expect(screen.getByText('Queries por Período')).toBeInTheDocument();
  });

  it('handles 200 rows without crashing', () => {
    const { container } = render(<TelemetryCharts rows={makeRows(200)} timeFilter="7d" />);
    expect(container.innerHTML).not.toBe('');
  });

  it('handles rows with rpc_name', () => {
    const { container } = render(
      <TelemetryCharts rows={makeRows(3, { rpc_name: 'fn', table_name: null })} timeFilter="24h" />
    );
    expect(container.innerHTML).not.toBe('');
  });

  it('handles zero duration_ms', () => {
    const { container } = render(<TelemetryCharts rows={makeRows(3, { duration_ms: 0 })} timeFilter="24h" />);
    expect(container.innerHTML).not.toBe('');
  });

  it('handles rows spanning midnight', () => {
    const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(23, 55);
    const t = new Date(); t.setHours(0, 5);
    const rows = [makeRow({ created_at: y.toISOString() }), makeRow({ created_at: t.toISOString() })];
    const { container } = render(<TelemetryCharts rows={rows} timeFilter="6h" />);
    expect(container.innerHTML).not.toBe('');
  });
});
