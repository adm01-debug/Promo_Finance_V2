import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContasReceberKPIs } from '../ContasReceberKPIs';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ContasReceberKPIs', () => {
  const defaultProps = {
    totalReceber: 50000,
    totalRecebidoMes: 30000,
    totalVencido: 10000,
    taxaInadimplencia: 8.5,
  };

  // ===== #4: KPIs com comparativo temporal =====
  describe('Gap #4 - Comparativo temporal', () => {
    it('exibe variação positiva com seta para cima', () => {
      render(
        <ContasReceberKPIs
          {...defaultProps}
          totalReceberAnterior={40000}
          totalRecebidoMesAnterior={25000}
          totalVencidoAnterior={8000}
        />
      );
      expect(screen.getAllByText(/vs mês anterior/i).length).toBeGreaterThanOrEqual(1);
    });

    it('exibe variação negativa corretamente', () => {
      render(
        <ContasReceberKPIs
          {...defaultProps}
          totalReceber={30000}
          totalReceberAnterior={50000}
        />
      );
      expect(screen.getByText(/vs mês anterior/i)).toBeInTheDocument();
    });

    it('não exibe variação quando não há dados anteriores', () => {
      render(<ContasReceberKPIs {...defaultProps} />);
      expect(screen.queryByText(/vs mês anterior/i)).not.toBeInTheDocument();
    });

    it('não exibe variação quando anterior é zero', () => {
      render(
        <ContasReceberKPIs
          {...defaultProps}
          totalReceberAnterior={0}
        />
      );
      expect(screen.queryByText(/vs mês anterior/i)).not.toBeInTheDocument();
    });

    it('variação do vencido inverte cores (positivo=ruim)', () => {
      const { container } = render(
        <ContasReceberKPIs
          {...defaultProps}
          totalVencidoAnterior={5000}
        />
      );
      // Vencido subiu = ruim = deve ter text-destructive
      const variationElements = container.querySelectorAll('[class*="text-destructive"]');
      expect(variationElements.length).toBeGreaterThan(0);
    });
  });

  // ===== #5: Vence Hoje / Vence Semana =====
  describe('Gap #5 - Indicadores de urgência', () => {
    it('exibe card "Vence Hoje" quando há títulos vencendo hoje', () => {
      render(<ContasReceberKPIs {...defaultProps} venceHoje={3} />);
      expect(screen.getByText('Vence Hoje')).toBeInTheDocument();
      expect(screen.getByText(/3 títulos/)).toBeInTheDocument();
    });

    it('exibe card "Vence esta Semana" quando há títulos vencendo na semana', () => {
      render(<ContasReceberKPIs {...defaultProps} venceSemana={5} />);
      expect(screen.getByText('Vence esta Semana')).toBeInTheDocument();
      expect(screen.getByText(/5 títulos/)).toBeInTheDocument();
    });

    it('exibe singular "título" quando há apenas 1', () => {
      render(<ContasReceberKPIs {...defaultProps} venceHoje={1} />);
      expect(screen.getByText('1 título')).toBeInTheDocument();
    });

    it('não exibe cards de urgência quando zero', () => {
      render(<ContasReceberKPIs {...defaultProps} venceHoje={0} venceSemana={0} />);
      expect(screen.queryByText('Vence Hoje')).not.toBeInTheDocument();
      expect(screen.queryByText('Vence esta Semana')).not.toBeInTheDocument();
    });

    it('exibe ambos cards simultaneamente', () => {
      render(<ContasReceberKPIs {...defaultProps} venceHoje={2} venceSemana={7} />);
      expect(screen.getByText('Vence Hoje')).toBeInTheDocument();
      expect(screen.getByText('Vence esta Semana')).toBeInTheDocument();
    });
  });

  // ===== #28: KPI drill-down =====
  describe('Gap #28 - KPI drill-down', () => {
    it('chama onKpiClick com filtro correto ao clicar em Total a Receber', () => {
      const onKpiClick = vi.fn();
      render(<ContasReceberKPIs {...defaultProps} onKpiClick={onKpiClick} />);
      fireEvent.click(screen.getByText('Total a Receber').closest('[class*="card"]')!);
      expect(onKpiClick).toHaveBeenCalledWith('all');
    });

    it('chama onKpiClick com "pago" ao clicar em Recebido', () => {
      const onKpiClick = vi.fn();
      render(<ContasReceberKPIs {...defaultProps} onKpiClick={onKpiClick} />);
      fireEvent.click(screen.getByText('Recebido no Mês').closest('[class*="card"]')!);
      expect(onKpiClick).toHaveBeenCalledWith('pago');
    });

    it('chama onKpiClick com "vencido" ao clicar em Vencido', () => {
      const onKpiClick = vi.fn();
      render(<ContasReceberKPIs {...defaultProps} onKpiClick={onKpiClick} />);
      fireEvent.click(screen.getByText('Vencido').closest('[class*="card"]')!);
      expect(onKpiClick).toHaveBeenCalledWith('vencido');
    });

    it('chama onKpiClick com "vence_hoje" ao clicar no card Vence Hoje', () => {
      const onKpiClick = vi.fn();
      render(<ContasReceberKPIs {...defaultProps} venceHoje={3} onKpiClick={onKpiClick} />);
      fireEvent.click(screen.getByText('Vence Hoje').closest('[class*="card"]')!);
      expect(onKpiClick).toHaveBeenCalledWith('vence_hoje');
    });

    it('chama onKpiClick com "vence_semana" ao clicar no card Vence Semana', () => {
      const onKpiClick = vi.fn();
      render(<ContasReceberKPIs {...defaultProps} venceSemana={5} onKpiClick={onKpiClick} />);
      fireEvent.click(screen.getByText('Vence esta Semana').closest('[class*="card"]')!);
      expect(onKpiClick).toHaveBeenCalledWith('vence_semana');
    });

    it('KPIs têm cursor-pointer quando onKpiClick é fornecido', () => {
      const { container } = render(<ContasReceberKPIs {...defaultProps} onKpiClick={() => {}} />);
      const cards = container.querySelectorAll('.cursor-pointer');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('KPIs não têm cursor-pointer quando onKpiClick não é fornecido', () => {
      const { container } = render(<ContasReceberKPIs {...defaultProps} />);
      const cards = container.querySelectorAll('.cursor-pointer');
      expect(cards.length).toBe(0);
    });
  });

  // ===== KPIs gerais =====
  describe('Renderização base', () => {
    it('renderiza os 4 KPIs principais', () => {
      render(<ContasReceberKPIs {...defaultProps} />);
      expect(screen.getByText('Total a Receber')).toBeInTheDocument();
      expect(screen.getByText('Recebido no Mês')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
      expect(screen.getByText('Inadimplência')).toBeInTheDocument();
    });

    it('formata valores como moeda brasileira', () => {
      render(<ContasReceberKPIs {...defaultProps} />);
      expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument();
    });

    it('exibe taxa de inadimplência com uma casa decimal', () => {
      render(<ContasReceberKPIs {...defaultProps} />);
      expect(screen.getByText('8.5%')).toBeInTheDocument();
    });

    it('inadimplência > 10% usa cor destructive', () => {
      const { container } = render(<ContasReceberKPIs {...defaultProps} taxaInadimplencia={15} />);
      const inadText = screen.getByText(/15\.0%/);
      expect(inadText.className).toContain('destructive');
    });

    it('inadimplência < 5% usa cor success', () => {
      const { container } = render(<ContasReceberKPIs {...defaultProps} taxaInadimplencia={3} />);
      const inadText = screen.getByText(/3\.0%/);
      expect(inadText.className).toContain('success');
    });

    it('Progress bar renderiza na inadimplência', () => {
      const { container } = render(<ContasReceberKPIs {...defaultProps} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeTruthy();
    });
  });
});
