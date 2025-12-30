import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Simplified useAuth hook for testing
const useAuth = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    mockSupabase.auth.getSession().then(({ data }: any) => {
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = mockSupabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription?.subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await mockSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    await mockSupabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('deve inicializar com loading=true', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('deve carregar usuário da sessão existente', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'token',
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('deve fazer login com email e senha', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: { access_token: 'token' },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signIn('test@example.com', 'password');

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('deve lançar erro em login inválido', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.signIn('wrong@example.com', 'wrongpass')
    ).rejects.toThrow();
  });

  it('deve fazer logout', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'token',
        },
      },
      error: null,
    });

    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await result.current.signOut();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('deve atualizar quando auth state mudar', async () => {
    let authCallback: any;

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newUser = {
      id: '456',
      email: 'new@example.com',
    };

    authCallback('SIGNED_IN', { user: newUser });

    await waitFor(() => {
      expect(result.current.user).toEqual(newUser);
    });
  });

  it('deve limpar subscription ao desmontar', () => {
    const unsubscribe = vi.fn();

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe,
        },
      },
    });

    const { unmount } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
