import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPIComparativo } from '../KPIComparativo';

describe('KPIComparativo', () => {
  describe('Cálculo de variação', () => {
    it('exibe variação positiva com ↑', () => {
      render(<KPIComparativo valorAtual={110} valorAnterior={100} />);
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('exibe variação negativa com ↓', () => {
      render(<KPIComparativo valorAtual={90} valorAnterior={100} />);
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('exibe Estável quando variação < 0.5%', () => {
      render(<KPIComparativo valorAtual={100.3} valorAnterior={100} />);
      expect(screen.getByText('Estável')).toBeInTheDocument();
    });

    it('exibe Estável para variação zero', () => {
      render(<KPIComparativo valorAtual={100} valorAnterior={100} />);
      expect(screen.getByText('Estável')).toBeInTheDocument();
    });
  });

  describe('Cores semânticas', () => {
    it('variação positiva tem classe text-success', () => {
      render(<KPIComparativo valorAtual={150} valorAnterior={100} />);
      expect(screen.getByText('50.0%').closest('span')).toHaveClass('text-success');
    });

    it('variação negativa tem classe text-destructive', () => {
      render(<KPIComparativo valorAtual={50} valorAnterior={100} />);
      expect(screen.getByText('50.0%').closest('span')).toHaveClass('text-destructive');
    });
  });

  describe('Modo invertido', () => {
    it('variação negativa fica verde (success) quando invertido', () => {
      render(<KPIComparativo valorAtual={80} valorAnterior={100} invertido />);
      expect(screen.getByText('20.0%').closest('span')).toHaveClass('text-success');
    });

    it('variação positiva fica vermelha quando invertido', () => {
      render(<KPIComparativo valorAtual={120} valorAnterior={100} invertido />);
      expect(screen.getByText('20.0%').closest('span')).toHaveClass('text-destructive');
    });
  });

  describe('Edge cases', () => {
    it('retorna null quando valorAnterior é 0', () => {
      const { container } = render(<KPIComparativo valorAtual={100} valorAnterior={0} />);
      expect(container.innerHTML).toBe('');
    });

    it('retorna null quando valorAnterior é undefined/falsy', () => {
      const { container } = render(<KPIComparativo valorAtual={100} valorAnterior={0} />);
      expect(container.innerHTML).toBe('');
    });

    it('variação de 100% (dobrou)', () => {
      render(<KPIComparativo valorAtual={200} valorAnterior={100} />);
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('variação com decimais precisos', () => {
      render(<KPIComparativo valorAtual={133} valorAnterior={100} />);
      expect(screen.getByText('33.0%')).toBeInTheDocument();
    });

    it('valores muito pequenos', () => {
      render(<KPIComparativo valorAtual={0.02} valorAnterior={0.01} />);
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('aplica className adicional', () => {
      render(<KPIComparativo valorAtual={120} valorAnterior={100} className="ml-2" />);
      expect(screen.getByText('20.0%').closest('span')).toHaveClass('ml-2');
    });
  });
});
