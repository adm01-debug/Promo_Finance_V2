import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlossarioTooltip } from '../GlossarioTooltip';

describe('GlossarioTooltip', () => {
  describe('Termos conhecidos', () => {
    it('renderiza termo CBS com dashed underline', () => {
      render(<GlossarioTooltip termo="CBS" />);
      const el = screen.getByText('CBS');
      expect(el).toBeInTheDocument();
      expect(el.closest('span')).toHaveClass('border-dashed');
    });

    it('renderiza termo IBS', () => {
      render(<GlossarioTooltip termo="IBS" />);
      expect(screen.getByText('IBS')).toBeInTheDocument();
    });

    it('renderiza termo IS', () => {
      render(<GlossarioTooltip termo="IS" />);
      expect(screen.getByText('IS')).toBeInTheDocument();
    });

    it('renderiza termo Split Payment', () => {
      render(<GlossarioTooltip termo="Split Payment" />);
      expect(screen.getByText('Split Payment')).toBeInTheDocument();
    });

    it('renderiza termo PER/DCOMP', () => {
      render(<GlossarioTooltip termo="PER/DCOMP" />);
      expect(screen.getByText('PER/DCOMP')).toBeInTheDocument();
    });

    it('renderiza termo CFOP', () => {
      render(<GlossarioTooltip termo="CFOP" />);
      expect(screen.getByText('CFOP')).toBeInTheDocument();
    });

    it('renderiza termo NCM', () => {
      render(<GlossarioTooltip termo="NCM" />);
      expect(screen.getByText('NCM')).toBeInTheDocument();
    });

    it('renderiza termo SPED', () => {
      render(<GlossarioTooltip termo="SPED" />);
      expect(screen.getByText('SPED')).toBeInTheDocument();
    });

    it('renderiza termo DARF', () => {
      render(<GlossarioTooltip termo="DARF" />);
      expect(screen.getByText('DARF')).toBeInTheDocument();
    });

    it('renderiza termo Não-Cumulatividade', () => {
      render(<GlossarioTooltip termo="Não-Cumulatividade" />);
      expect(screen.getByText('Não-Cumulatividade')).toBeInTheDocument();
    });

    it('renderiza termo Cashback', () => {
      render(<GlossarioTooltip termo="Cashback" />);
      expect(screen.getByText('Cashback')).toBeInTheDocument();
    });
  });

  describe('Termo desconhecido', () => {
    it('renderiza texto simples sem tooltip', () => {
      render(<GlossarioTooltip termo="TermoInexistente" />);
      const el = screen.getByText('TermoInexistente');
      expect(el).toBeInTheDocument();
      expect(el.closest('span')).not.toHaveClass('border-dashed');
    });
  });

  describe('Children customizado', () => {
    it('renderiza children ao invés do termo', () => {
      render(<GlossarioTooltip termo="CBS">Contribuição</GlossarioTooltip>);
      expect(screen.getByText('Contribuição')).toBeInTheDocument();
    });
  });

  describe('Ícone Info', () => {
    it('exibe ícone por padrão', () => {
      render(<GlossarioTooltip termo="CBS" />);
      const svg = document.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('oculta ícone quando showIcon=false', () => {
      render(<GlossarioTooltip termo="CBS" showIcon={false} />);
      const container = screen.getByText('CBS').closest('span');
      const svg = container?.querySelector('svg');
      expect(svg).toBeNull();
    });
  });

  describe('className customizado', () => {
    it('aplica className ao wrapper', () => {
      render(<GlossarioTooltip termo="CBS" className="font-bold" />);
      expect(screen.getByText('CBS').closest('span')).toHaveClass('font-bold');
    });

    it('aplica className em termo desconhecido', () => {
      render(<GlossarioTooltip termo="XYZ" className="text-red-500" />);
      expect(screen.getByText('XYZ')).toHaveClass('text-red-500');
    });
  });
});
