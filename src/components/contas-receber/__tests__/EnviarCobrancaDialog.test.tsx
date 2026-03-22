import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnviarCobrancaDialog } from '../EnviarCobrancaDialog';

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe('EnviarCobrancaDialog', () => {
  const conta = {
    id: 'test-1',
    cliente_nome: 'Cliente Teste',
    descricao: 'Serviço mensal',
    valor: 1500,
    data_vencimento: '2025-03-15',
    status: 'pendente',
  };

  beforeEach(() => {
    mockOpen.mockClear();
  });

  // ===== #2: Enviar Cobrança funcional =====
  describe('Gap #2 - Enviar Cobrança funcional', () => {
    it('renderiza dialog quando open=true', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('Enviar Cobrança')).toBeInTheDocument();
    });

    it('não renderiza quando conta é null', () => {
      const { container } = render(<EnviarCobrancaDialog conta={null} open={true} onOpenChange={vi.fn()} />);
      expect(container.innerHTML).toBe('');
    });

    it('exibe informações da conta no dialog', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
      expect(screen.getByText(/Serviço mensal/)).toBeInTheDocument();
    });

    it('exibe 3 canais: WhatsApp, E-mail, SMS', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('E-mail')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });

    it('WhatsApp é selecionado por padrão', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      const whatsappBtn = screen.getByText('WhatsApp').closest('button');
      expect(whatsappBtn?.className).toContain('success');
    });

    it('abre WhatsApp web ao enviar', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByText(/Enviar via WhatsApp/i));
      expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank');
    });

    it('abre mailto ao enviar por email', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByText('E-mail'));
      fireEvent.click(screen.getByText(/Enviar via E-mail/i));
      expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('mailto:'), '_blank');
    });

    it('exibe mensagem padrão como placeholder', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      const textarea = screen.getByPlaceholderText(/Olá Cliente Teste/i);
      expect(textarea).toBeInTheDocument();
    });

    it('permite customizar mensagem', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Mensagem customizada' } });
      expect(screen.getByDisplayValue('Mensagem customizada')).toBeInTheDocument();
    });

    it('fecha dialog ao clicar cancelar', () => {
      const onOpenChange = vi.fn();
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByText('Cancelar'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('fecha dialog após enviar', () => {
      const onOpenChange = vi.fn();
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByText(/Enviar via/));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('inclui nome do cliente na mensagem WhatsApp', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByText(/Enviar via/));
      const url = mockOpen.mock.calls[0][0] as string;
      expect(url).toContain(encodeURIComponent('Cliente Teste'));
    });

    it('alterna canal ao clicar', () => {
      render(<EnviarCobrancaDialog conta={conta} open={true} onOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByText('SMS'));
      expect(screen.getByText(/Enviar via SMS/)).toBeInTheDocument();
    });
  });
});
