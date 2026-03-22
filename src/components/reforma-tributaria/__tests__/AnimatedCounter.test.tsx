import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Renderização inicial', () => {
    it('renderiza com classe tabular-nums', () => {
      render(<AnimatedCounter value={100} />);
      const el = document.querySelector('.tabular-nums');
      expect(el).toBeTruthy();
    });

    it('renderiza prefix', () => {
      render(<AnimatedCounter value={100} prefix="R$ " />);
      expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });

    it('renderiza suffix', () => {
      render(<AnimatedCounter value={100} suffix="%" />);
      expect(screen.getByText(/%/)).toBeInTheDocument();
    });
  });

  describe('Formatação customizada', () => {
    it('usa formatFn quando fornecida', () => {
      const formatFn = (v: number) => Math.round(v).toString();
      render(<AnimatedCounter value={0} formatFn={formatFn} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('usa toFixed(2) por padrão', () => {
      render(<AnimatedCounter value={0} />);
      expect(screen.getByText(/0\.00/)).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('aplica className customizada', () => {
      render(<AnimatedCounter value={100} className="text-2xl" />);
      expect(document.querySelector('.text-2xl')).toBeTruthy();
    });

    it('mantém tabular-nums com className adicional', () => {
      render(<AnimatedCounter value={100} className="font-bold" />);
      const el = document.querySelector('.tabular-nums');
      expect(el).toHaveClass('font-bold');
    });
  });

  describe('Props combinadas', () => {
    it('renderiza prefix + suffix juntos', () => {
      render(<AnimatedCounter value={50} prefix="R$ " suffix=" mil" />);
      const el = document.querySelector('.tabular-nums');
      expect(el?.textContent).toContain('R$');
      expect(el?.textContent).toContain('mil');
    });
  });
});
