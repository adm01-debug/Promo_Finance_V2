import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ConviteUsuarioDialog } from '../ConviteUsuarioDialog';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke } },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ConviteUsuarioDialog', () => {
  beforeEach(() => {
    invoke.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('envia o convite ao backend protegido, sem registrar um falso sucesso local', async () => {
    invoke.mockResolvedValue({
      data: { email_status: 'solicitado_ao_auth' },
      error: null,
    });
    const onOpenChange = vi.fn();
    render(<ConviteUsuarioDialog open onOpenChange={onOpenChange} />);

    fireEvent.change(screen.getByPlaceholderText('nome@empresa.com'), {
      target: { value: 'novo.usuario@empresa.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Convite' }));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('convidar-usuario', {
        body: { email: 'novo.usuario@empresa.test', role: 'visualizador' },
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Convite criado', expect.objectContaining({
      description: expect.stringContaining('serviço de autenticação'),
    }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('não anuncia convite quando a Edge Function falha', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('indisponível') });
    render(<ConviteUsuarioDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('nome@empresa.com'), {
      target: { value: 'novo.usuario@empresa.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Convite' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao enviar convite'));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
