import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { useSsoDomainResolver } from '@/hooks/useSsoDomainResolver';

describe('useSsoDomainResolver', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('normaliza o domínio e aceita o retorno canônico sem allowed_domains', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'prov-1',
          nome: 'SSO Corp',
          tipo: 'oidc',
          preset: 'entra',
          force_sso_for_domains: true,
          ordem: 1,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useSsoDomainResolver('Pessoa@Empresa.COM ', 0));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith('resolve_sso_providers_for_domain', {
        p_domain: 'empresa.com',
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.providers[0]?.nome).toBe('SSO Corp');
      expect(result.current.autoRedirectProvider?.id).toBe('prov-1');
    });
  });

  it('falha fechando o loading quando a RPC retorna erro', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'rpc failed' },
    });

    const { result } = renderHook(() => useSsoDomainResolver('pessoa@empresa.com', 0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.providers).toEqual([]);
      expect(result.current.autoRedirectProvider).toBeNull();
      expect(result.current.domain).toBe('empresa.com');
    });
  });

  it('encerra loading e limpa providers quando a RPC falha', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'rpc down' },
    });

    const { result } = renderHook(() => useSsoDomainResolver('ops@empresa.com', 0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.domain).toBe('empresa.com');
      expect(result.current.providers).toEqual([]);
      expect(result.current.autoRedirectProvider).toBeNull();
    });
  });
});
