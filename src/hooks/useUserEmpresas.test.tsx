import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryResult = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ order: queryResult }) }) }) }) },
}));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));

import { useUserEmpresas } from './useUserEmpresas';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useUserEmpresas', () => {
  it('mantém erro de consulta distinto de usuário sem vínculo', async () => {
    queryResult.mockResolvedValue({ data: null, error: { message: 'indisponível' } });
    const { result } = renderHook(() => useUserEmpresas(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3_000 });
    expect(result.current.data).toBeUndefined();
  });
});
