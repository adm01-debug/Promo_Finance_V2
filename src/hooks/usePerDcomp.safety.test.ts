import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('date-fns', () => ({ format: vi.fn() }));

import {
  TRANSMISSAO_PER_DCOMP_INDISPONIVEL,
  transmitirPerDcompNaoConfigurado,
} from './usePerDcomp';

describe('transmissão PER/DCOMP', () => {
  it('falha fechada sem gerar recibo ou alterar créditos', () => {
    expect(transmitirPerDcompNaoConfigurado).toThrow(TRANSMISSAO_PER_DCOMP_INDISPONIVEL);
  });
});
