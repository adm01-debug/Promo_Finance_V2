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
    it('renderiza grupos na versão mobile', () => {
      render(<NavigationTributaria {...defaultProps} />);
      expect(screen.getAllByText('Visão Geral').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Operacional').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Compliance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Simuladores').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Badge de alertas dinâmico', () => {
    it('não mostra badge quando alertas = 0', () => {
      render(<NavigationTributaria {...defaultProps} alertasCriticos={0} />);
      const badges = document.querySelectorAll('.bg-destructive');
      expect(badges.length).toBe(0);
    });

    it('mostra badge com contagem quando alertas > 0', () => {
      const { container } = render(<NavigationTributaria {...defaultProps} alertasCriticos={7} />);
      // Badge is rendered as a small span with the number inside navigation
      const allText = container.textContent;
      expect(allText).toContain('7');
    });
  });

  describe('Expansão de grupos', () => {
    it('expande grupo ativo por padrão', () => {
      render(<NavigationTributaria {...defaultProps} activeTab="apuracao" />);
      expect(screen.getAllByText('Apuração IBS/CBS').length).toBeGreaterThanOrEqual(1);
    });

    it('clica em grupo para expandir', () => {
      render(<NavigationTributaria {...defaultProps} />);
      const simuladores = screen.getAllByText('Simuladores');
      fireEvent.click(simuladores[simuladores.length - 1]);
      expect(screen.getAllByText('Calculadora').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navegação por item', () => {
    it('chama onTabChange ao clicar em item', () => {
      const onTabChange = vi.fn();
      render(<NavigationTributaria {...defaultProps} onTabChange={onTabChange} />);
      const operacional = screen.getAllByText('Operacional');
      fireEvent.click(operacional[operacional.length - 1]);
      const apuracao = screen.getAllByText('Apuração IBS/CBS');
      fireEvent.click(apuracao[apuracao.length - 1]);
      expect(onTabChange).toHaveBeenCalledWith('apuracao');
    });
  });

  describe('Itens do grupo Visão Geral', () => {
    it('contém Dashboard, Métricas e Cronograma', () => {
      render(<NavigationTributaria {...defaultProps} />);
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
