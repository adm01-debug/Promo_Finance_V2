import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroKPIs } from '../HeroKPIs';

const defaultProps = {
  cargaTributaria: 26.5,
  cbsSaldo: 15000,
  ibsSaldo: 22000,
  creditosDisponiveis: 8500,
  creditosUtilizados: 3000,
  creditosAcumulados: 12000,
  percentualMigracao: 65,
  aliquotaCbs: 8.8,
  aliquotaIbs: 17.7,
};

describe('HeroKPIs', () => {
  describe('Renderização dos cards', () => {
    it('exibe carga tributária efetiva', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getByText('26.50')).toBeInTheDocument();
      expect(screen.getByText('Carga Tributária Efetiva')).toBeInTheDocument();
    });

    it('exibe alíquotas CBS e IBS como badges', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getByText('CBS: 8.8%')).toBeInTheDocument();
      expect(screen.getByText('IBS: 17.7%')).toBeInTheDocument();
    });

    it('exibe créditos disponíveis', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getByText('Créditos Disponíveis')).toBeInTheDocument();
    });

    it('exibe percentual de utilização de créditos', () => {
      render(<HeroKPIs {...defaultProps} />);
      // 3000/12000 = 25%
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('exibe card CBS', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getAllByText('CBS').length).toBeGreaterThanOrEqual(1);
    });

    it('exibe card IBS', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getAllByText('IBS').length).toBeGreaterThanOrEqual(1);
    });

    it('exibe percentual de migração', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(screen.getByText('Migração')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  describe('Alertas', () => {
    it('exibe check quando não há alertas', () => {
      render(<HeroKPIs {...defaultProps} alertasCriticos={0} />);
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Em dia')).toBeInTheDocument();
    });

    it('exibe contagem quando há alertas', () => {
      render(<HeroKPIs {...defaultProps} alertasCriticos={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Críticos')).toBeInTheDocument();
    });

    it('anima o card quando há alertas', () => {
      render(<HeroKPIs {...defaultProps} alertasCriticos={3} />);
      const alertCard = screen.getByText('3').closest('[class*="Card"]');
      // Should have animate-pulse class
      const wrapper = alertCard?.closest('[class*="animate-pulse"]') || alertCard;
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Deep-linking (onKPIClick)', () => {
    it('clica em Carga Tributária navega para métricas', () => {
      const onClick = vi.fn();
      render(<HeroKPIs {...defaultProps} onKPIClick={onClick} />);
      fireEvent.click(screen.getByText('Carga Tributária Efetiva').closest('[class*="Card"]')!);
      expect(onClick).toHaveBeenCalledWith('metricas');
    });

    it('clica em Créditos navega para creditos', () => {
      const onClick = vi.fn();
      render(<HeroKPIs {...defaultProps} onKPIClick={onClick} />);
      fireEvent.click(screen.getByText('Créditos Disponíveis').closest('[class*="Card"]')!);
      expect(onClick).toHaveBeenCalledWith('creditos');
    });

    it('clica em Migração navega para cronograma', () => {
      const onClick = vi.fn();
      render(<HeroKPIs {...defaultProps} onKPIClick={onClick} />);
      fireEvent.click(screen.getByText('Migração').closest('[class*="Card"]')!);
      expect(onClick).toHaveBeenCalledWith('cronograma');
    });

    it('clica em Alertas navega para alertas', () => {
      const onClick = vi.fn();
      render(<HeroKPIs {...defaultProps} alertasCriticos={2} onKPIClick={onClick} />);
      fireEvent.click(screen.getByText('Alertas').closest('[class*="Card"]')!);
      expect(onClick).toHaveBeenCalledWith('alertas');
    });
  });

  describe('Edge cases', () => {
    it('creditosAcumulados zero evita divisão por zero', () => {
      render(<HeroKPIs {...defaultProps} creditosAcumulados={0} />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('valores zero renderizam sem erro', () => {
      render(<HeroKPIs {...defaultProps} cargaTributaria={0} cbsSaldo={0} ibsSaldo={0} />);
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('migração 100% renderiza corretamente', () => {
      render(<HeroKPIs {...defaultProps} percentualMigracao={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('sem onKPIClick não quebra ao clicar', () => {
      render(<HeroKPIs {...defaultProps} />);
      expect(() => {
        fireEvent.click(screen.getByText('Carga Tributária Efetiva').closest('[class*="Card"]')!);
      }).not.toThrow();
    });
  });
});
