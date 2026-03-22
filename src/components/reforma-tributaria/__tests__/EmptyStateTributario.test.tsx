import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateTributario } from '../EmptyStateTributario';

describe('EmptyStateTributario', () => {
  describe('Tipo: apuracoes', () => {
    it('exibe título correto', () => {
      render(<EmptyStateTributario type="apuracoes" />);
      expect(screen.getByText('Nenhuma apuração encontrada')).toBeInTheDocument();
    });

    it('exibe botão primário Criar Apuração', () => {
      render(<EmptyStateTributario type="apuracoes" />);
      expect(screen.getByText('Criar Apuração')).toBeInTheDocument();
    });

    it('exibe botão secundário Importar Dados', () => {
      render(<EmptyStateTributario type="apuracoes" />);
      expect(screen.getByText('Importar Dados')).toBeInTheDocument();
    });

    it('exibe dicas', () => {
      render(<EmptyStateTributario type="apuracoes" />);
      expect(screen.getByText(/Apurações são mensais/)).toBeInTheDocument();
    });
  });

  describe('Tipo: creditos', () => {
    it('exibe título correto', () => {
      render(<EmptyStateTributario type="creditos" />);
      expect(screen.getByText('Nenhum crédito tributário')).toBeInTheDocument();
    });

    it('exibe botão Importar XML', () => {
      render(<EmptyStateTributario type="creditos" />);
      expect(screen.getByText('Importar XML')).toBeInTheDocument();
    });
  });

  describe('Tipo: operacoes', () => {
    it('exibe título correto', () => {
      render(<EmptyStateTributario type="operacoes" />);
      expect(screen.getByText('Nenhuma operação registrada')).toBeInTheDocument();
    });
  });

  describe('Tipo: alertas', () => {
    it('exibe mensagem positiva', () => {
      render(<EmptyStateTributario type="alertas" />);
      expect(screen.getByText(/Tudo em dia/)).toBeInTheDocument();
    });

    it('exibe botão Ver Cronograma', () => {
      render(<EmptyStateTributario type="alertas" />);
      expect(screen.getByText('Ver Cronograma')).toBeInTheDocument();
    });

    it('não tem botão secundário', () => {
      render(<EmptyStateTributario type="alertas" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });
  });

  describe('Tipo: conciliacao', () => {
    it('exibe título correto', () => {
      render(<EmptyStateTributario type="conciliacao" />);
      expect(screen.getByText('Conciliação não executada')).toBeInTheDocument();
    });
  });

  describe('Tipo: onboarding', () => {
    it('exibe boas-vindas', () => {
      render(<EmptyStateTributario type="onboarding" />);
      expect(screen.getByText(/Bem-vindo à Reforma Tributária/)).toBeInTheDocument();
    });

    it('exibe botão Iniciar Configuração', () => {
      render(<EmptyStateTributario type="onboarding" />);
      expect(screen.getByText('Iniciar Configuração')).toBeInTheDocument();
    });

    it('exibe passos numerados', () => {
      render(<EmptyStateTributario type="onboarding" />);
      expect(screen.getByText(/1\. Cadastre sua empresa/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Importe NF-e/)).toBeInTheDocument();
      expect(screen.getByText(/3\. Crie sua primeira/)).toBeInTheDocument();
    });
  });

  describe('Ações', () => {
    it('chama onPrimaryAction ao clicar no botão principal', () => {
      const fn = vi.fn();
      render(<EmptyStateTributario type="apuracoes" onPrimaryAction={fn} />);
      fireEvent.click(screen.getByText('Criar Apuração'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('chama onSecondaryAction ao clicar no botão secundário', () => {
      const fn = vi.fn();
      render(<EmptyStateTributario type="apuracoes" onSecondaryAction={fn} />);
      fireEvent.click(screen.getByText('Importar Dados'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('não quebra sem callbacks', () => {
      render(<EmptyStateTributario type="apuracoes" />);
      expect(() => fireEvent.click(screen.getByText('Criar Apuração'))).not.toThrow();
    });
  });

  describe('Layout', () => {
    it('tem borda dashed no card', () => {
      render(<EmptyStateTributario type="onboarding" />);
      const card = document.querySelector('.border-dashed');
      expect(card).toBeTruthy();
    });

    it('exibe seção de dicas com ícone lâmpada', () => {
      render(<EmptyStateTributario type="creditos" />);
      expect(screen.getByText('Dicas:')).toBeInTheDocument();
    });
  });
});
