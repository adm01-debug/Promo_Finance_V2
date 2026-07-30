import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPIComparativo } from '../KPIComparativo';

describe('KPIComparativo', () => {
  describe('Cálculo de variação', () => {
    it('exibe variação positiva', () => {
      render(<KPIComparativo valorAtual={110} valorAnterior={100} />);
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('exibe variação negativa', () => {
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
    it('variação positiva tem cor success', () => {
      const { container } = render(<KPIComparativo valorAtual={150} valorAnterior={100} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-success');
    });

    it('variação negativa tem cor destructive', () => {
      const { container } = render(<KPIComparativo valorAtual={50} valorAnterior={100} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-destructive');
    });
  });

  describe('Modo invertido', () => {
    it('variação negativa fica verde quando invertido', () => {
      const { container } = render(<KPIComparativo valorAtual={80} valorAnterior={100} invertido />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-success');
    });

    it('variação positiva fica vermelha quando invertido', () => {
      const { container } = render(<KPIComparativo valorAtual={120} valorAnterior={100} invertido />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-destructive');
    });
  });

  describe('Edge cases', () => {
    it('retorna null quando valorAnterior é 0', () => {
      const { container } = render(<KPIComparativo valorAtual={100} valorAnterior={0} />);
      expect(container.innerHTML).toBe('');
    });

    it('variação de 100% (dobrou)', () => {
      render(<KPIComparativo valorAtual={200} valorAnterior={100} />);
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('valores muito pequenos', () => {
      render(<KPIComparativo valorAtual={0.02} valorAnterior={0.01} />);
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('aplica className adicional', () => {
      const { container } = render(<KPIComparativo valorAtual={120} valorAnterior={100} className="ml-2" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('ml-2');
    });
  });
});
