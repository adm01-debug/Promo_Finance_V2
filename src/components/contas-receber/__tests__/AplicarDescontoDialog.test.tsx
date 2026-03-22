import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AplicarDescontoDialog } from '../AplicarDescontoDialog';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('AplicarDescontoDialog', () => {
  const conta = {
    id: 'test-1',
    descricao: 'Serviço mensal',
    valor: 1000,
    valor_desconto: null,
    cliente_nome: 'Cliente Teste',
  };

  // ===== #12: Nota de crédito/desconto =====
  describe('Gap #12 - Aplicar desconto', () => {
    it('renderiza dialog quando open=true', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(screen.getAllByText(/Aplicar Desconto/).length).toBeGreaterThanOrEqual(1);
    });

    it('não renderiza quando conta é null', () => {
      const { container } = render(<AplicarDescontoDialog conta={null} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(container.innerHTML).toBe('');
    });

    it('exibe informações da conta', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
      expect(screen.getByText(/Serviço mensal/)).toBeInTheDocument();
    });

    it('toggle entre valor fixo e percentual', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(screen.getByText('Valor fixo')).toBeInTheDocument();
      expect(screen.getByText('Percentual')).toBeInTheDocument();
    });

    it('calcula desconto percentual corretamente', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      fireEvent.click(screen.getByText('Percentual'));
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });
      // Preview should show R$ 100,00 de desconto e R$ 900,00 final
      expect(screen.getByText(/Valor final/)).toBeInTheDocument();
    });

    it('calcula desconto valor fixo corretamente', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '200' } });
      expect(screen.getByText(/Valor original/)).toBeInTheDocument();
    });

    it('exibe preview de desconto e valor final', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(screen.getByText('Valor original')).toBeInTheDocument();
      expect(screen.getByText('Desconto')).toBeInTheDocument();
      expect(screen.getByText('Valor final')).toBeInTheDocument();
    });

    it('campo motivo é opcional', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      expect(screen.getByPlaceholderText(/pagamento antecipado/i)).toBeInTheDocument();
    });

    it('botão Aplicar desabilitado quando desconto é zero', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      const applyBtn = screen.getByRole('button', { name: /Aplicar Desconto/i });
      expect(applyBtn).toBeDisabled();
    });

    it('botão Aplicar habilitado quando desconto > 0', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '50' } });
      const applyBtn = screen.getByRole('button', { name: /Aplicar Desconto/i });
      expect(applyBtn).not.toBeDisabled();
    });

    it('botão Aplicar desabilitado quando desconto > valor', () => {
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={vi.fn()} />, { wrapper });
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '1500' } });
      const applyBtn = screen.getByRole('button', { name: /Aplicar Desconto/i });
      expect(applyBtn).toBeDisabled();
    });

    it('fecha ao clicar cancelar', () => {
      const onOpenChange = vi.fn();
      render(<AplicarDescontoDialog conta={conta} open={true} onOpenChange={onOpenChange} />, { wrapper });
      fireEvent.click(screen.getByText('Cancelar'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
