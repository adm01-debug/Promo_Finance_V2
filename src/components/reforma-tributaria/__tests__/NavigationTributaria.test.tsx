import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationTributaria } from '../NavigationTributaria';

describe('NavigationTributaria', () => {
  const defaultProps = {
    activeTab: 'visao-geral',
    onTabChange: vi.fn(),
    alertasCriticos: 0,
  };

  describe('Renderização de grupos', () => {
    it('renderiza todos os 6 grupos na versão mobile', () => {
      render(<NavigationTributaria {...defaultProps} />);
      expect(screen.getAllByText('Visão Geral').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Operacional').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Compliance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Simuladores').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Exportação').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Configurações').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Badge de alertas dinâmico', () => {
    it('não mostra badge quando alertas = 0', () => {
      render(<NavigationTributaria {...defaultProps} alertasCriticos={0} />);
      const badges = document.querySelectorAll('.bg-destructive');
      expect(badges.length).toBe(0);
    });

    it('mostra badge com contagem quando alertas > 0', () => {
      render(<NavigationTributaria {...defaultProps} alertasCriticos={7} />);
      expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Expansão de grupos (mobile)', () => {
    it('expande grupo ativo por padrão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="apuracao" />);
      // Operacional group should be expanded showing Apuração IBS/CBS
      expect(screen.getAllByText('Apuração IBS/CBS').length).toBeGreaterThanOrEqual(1);
    });

    it('clica em grupo para expandir/colapsar', () => {
      render(<NavigationTributaria {...defaultProps} />);
      const simuladores = screen.getAllByText('Simuladores');
      fireEvent.click(simuladores[simuladores.length - 1]);
      // Should now show sub-items
      expect(screen.getAllByText('Calculadora').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navegação por item', () => {
    it('chama onTabChange ao clicar em item', () => {
      const onTabChange = vi.fn();
      render(<NavigationTributaria {...defaultProps} onTabChange={onTabChange} />);
      // Expand Operacional first (mobile)
      const operacional = screen.getAllByText('Operacional');
      fireEvent.click(operacional[operacional.length - 1]);
      // Click sub-item
      const apuracao = screen.getAllByText('Apuração IBS/CBS');
      fireEvent.click(apuracao[apuracao.length - 1]);
      expect(onTabChange).toHaveBeenCalledWith('apuracao');
    });
  });

  describe('Itens do grupo Visão Geral', () => {
    it('contém Dashboard, Métricas e Cronograma', () => {
      render(<NavigationTributaria {...defaultProps} />);
      // Group is expanded by default for activeTab visao-geral
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Métricas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cronograma').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Itens do grupo Operacional', () => {
    it('contém itens corretos após expansão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="apuracao" />);
      expect(screen.getAllByText('Apuração IBS/CBS').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Operações').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Créditos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Retenções').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('IRPJ/CSLL').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Itens do grupo Compliance', () => {
    it('contém itens corretos após expansão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="obrigacoes" />);
      expect(screen.getAllByText('Obrigações').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Auditoria').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Conciliação').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Alertas').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Itens do grupo Exportação', () => {
    it('contém itens corretos após expansão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="exportacao" />);
      expect(screen.getAllByText('SPED').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('PER/DCOMP').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Split Payment').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Relatórios').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Itens do grupo Configurações', () => {
    it('contém itens corretos após expansão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="incentivos" />);
      expect(screen.getAllByText('Incentivos Fiscais').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Importar XML').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Destacar aba ativa', () => {
    it('aba ativa tem fundo primário', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="visao-geral" />);
      const dashboard = screen.getAllByText('Dashboard');
      const activeButton = dashboard.find(el => 
        el.closest('button')?.className.includes('bg-primary')
      );
      expect(activeButton).toBeTruthy();
    });
  });
});
