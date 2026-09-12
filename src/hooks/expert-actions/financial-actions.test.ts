import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/formatters', () => ({ formatCurrency: vi.fn(), todayISOLocal: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: mocks.success } }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: vi.fn() }));

import { BOLETO_EXPERT_INDISPONIVEL, gerarBoleto } from './financial-actions';

describe('gerarBoleto', () => {
  it('falha fechada sem consultar conta nem fabricar linha digitável', async () => {
    await expect(gerarBoleto('conta-1')).resolves.toEqual({
      success: false,
      message: BOLETO_EXPERT_INDISPONIVEL,
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
