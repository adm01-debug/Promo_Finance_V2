import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Calendar } from '../calendar';

describe('Calendar (react-day-picker v10 mapping)', () => {
  it('renderiza grid, cabecalho de semana e navegacao', () => {
    const { container } = render(
      <Calendar
        mode="single"
        selected={new Date(2026, 0, 15)}
        defaultMonth={new Date(2026, 0, 1)}
      />
    );
    expect(container.querySelector('table')).toBeTruthy();
    expect(container.querySelectorAll('th').length).toBe(7);
    expect(container.querySelector('th')!.className).toContain('w-9');
    const prev = screen.getByRole('button', {
      name: /previous month|go to the previous month|previous/i,
    });
    expect(prev.className).toContain('absolute left-1');
    const next = screen.getByRole('button', { name: /next month|go to the next month|next/i });
    expect(next.className).toContain('absolute right-1');
  });

  it('aplica aria-selected e as classes de estado na celula do dia', () => {
    const { container } = render(
      <Calendar
        mode="single"
        selected={new Date(2026, 0, 15)}
        defaultMonth={new Date(2026, 0, 1)}
      />
    );
    const selectedCell = container.querySelector('[aria-selected="true"]') as HTMLElement;
    expect(selectedCell).toBeTruthy();
    expect(selectedCell.tagName).toBe('TD');
    expect(selectedCell.className).toContain('bg-primary');
    expect(selectedCell.className).toContain('text-primary-foreground');
    const btn = selectedCell.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn!.className).toContain('h-9 w-9');
  });

  it('mantem range middle/end com classes proprias', () => {
    const { container } = render(
      <Calendar
        mode="range"
        selected={{ from: new Date(2026, 0, 12), to: new Date(2026, 0, 15) }}
        defaultMonth={new Date(2026, 0, 1)}
      />
    );
    const end = container.querySelectorAll('[aria-selected="true"]');
    expect(end.length).toBe(4);
    const endCell = container.querySelector('.day-range-end') as HTMLElement;
    expect(endCell).toBeTruthy();
    expect(endCell.className).toContain('rounded-r-md');
  });
});
