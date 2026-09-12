import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

import {
  WEBAUTHN_INDISPONIVEL,
  WEBAUTHN_SERVER_VERIFICATION_DISPONIVEL,
  useWebAuthn,
} from './useWebAuthn';

describe('WebAuthn sem verificação no servidor', () => {
  it('não registra credencial e não aceita login local', async () => {
    const { result } = renderHook(() => useWebAuthn());

    await act(async () => {
      expect(await result.current.registerCredential('Notebook')).toBe(false);
      expect(await result.current.authenticate('user@example.test')).toEqual({ success: false });
    });

    expect(WEBAUTHN_SERVER_VERIFICATION_DISPONIVEL).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith(WEBAUTHN_INDISPONIVEL);
  });
});
