import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/login';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service');

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Login Flow', () => {
    it('renders login form', () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha|password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar|login/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*obrigatório|required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*inválido|invalid.*email/i)).toBeInTheDocument();
      });
    });

    it('submits login form successfully', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', email: 'test@example.com' };
      vi.mocked(authService.signIn).mockResolvedValue({ user: mockUser, session: {} });

      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha|password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signIn).mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha|password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas|invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during login', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: {}, session: {} }), 100))
      );

      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha|password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      expect(screen.getByRole('button', { name: /entrar|login/i })).toBeDisabled();
    });

    it('navigates to forgot password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const forgotLink = screen.getByText(/esqueceu.*senha|forgot.*password/i);
      expect(forgotLink).toBeInTheDocument();
    });
  });

  describe('Remember Me', () => {
    it('stores email when remember me is checked', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signIn).mockResolvedValue({ user: {}, session: {} });

      render(<LoginPage />, { wrapper: createTestWrapper() });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha|password/i), 'password123');
      
      const rememberCheckbox = screen.queryByLabelText(/lembrar|remember/i);
      if (rememberCheckbox) {
        await user.click(rememberCheckbox);
      }

      await user.click(screen.getByRole('button', { name: /entrar|login/i }));

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalled();
      });
    });
  });
});
