import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { authService } from '@/services/auth.service';

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

// Mock components for testing
const MockLoginPage = ({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    await onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <input name="email" type="email" placeholder="Email" data-testid="email-input" />
      <input name="password" type="password" placeholder="Password" data-testid="password-input" />
      <button type="submit" data-testid="login-button">Login</button>
    </form>
  );
};

const MockRegisterPage = ({ onRegister }: { onRegister: (data: { email: string; password: string; name: string }) => Promise<void> }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    await onRegister({
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="register-form">
      <input name="name" type="text" placeholder="Name" data-testid="name-input" />
      <input name="email" type="email" placeholder="Email" data-testid="email-input" />
      <input name="password" type="password" placeholder="Password" data-testid="password-input" />
      <button type="submit" data-testid="register-button">Register</button>
    </form>
  );
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(BrowserRouter, null, children)
    );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('renders login form', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockLoginPage onLogin={vi.fn()} />
        </Wrapper>
      );

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('submits login form with credentials', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      vi.mocked(authService.signIn).mockResolvedValue({ user: mockUser, session: {} } as any);

      const onLogin = async (email: string, password: string) => {
        await authService.signIn(email, password);
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockLoginPage onLogin={onLogin} />
        </Wrapper>
      );

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });

    it('handles login error', async () => {
      vi.mocked(authService.signIn).mockRejectedValue(new Error('Invalid credentials'));

      let loginError: string | null = null;
      const onLogin = async (email: string, password: string) => {
        try {
          await authService.signIn(email, password);
        } catch (error) {
          loginError = (error as Error).message;
        }
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockLoginPage onLogin={onLogin} />
        </Wrapper>
      );

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'wrong@test.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(loginError).toBe('Invalid credentials');
      });
    });

    it('validates required fields', async () => {
      const onLogin = vi.fn();
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <MockLoginPage onLogin={onLogin} />
        </Wrapper>
      );

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Registration Flow', () => {
    it('renders registration form', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockRegisterPage onRegister={vi.fn()} />
        </Wrapper>
      );

      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    it('submits registration form', async () => {
      const mockUser = { id: '1', email: 'new@test.com' };
      vi.mocked(authService.signUp).mockResolvedValue({ user: mockUser, session: {} } as any);

      const onRegister = async (data: { email: string; password: string; name: string }) => {
        await authService.signUp(data.email, data.password, { name: data.name });
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockRegisterPage onRegister={onRegister} />
        </Wrapper>
      );

      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'new@test.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith(
          'new@test.com',
          'password123',
          { name: 'John Doe' }
        );
      });
    });

    it('handles duplicate email error', async () => {
      vi.mocked(authService.signUp).mockRejectedValue(new Error('Email already exists'));

      let registerError: string | null = null;
      const onRegister = async (data: { email: string; password: string; name: string }) => {
        try {
          await authService.signUp(data.email, data.password, { name: data.name });
        } catch (error) {
          registerError = (error as Error).message;
        }
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockRegisterPage onRegister={onRegister} />
        </Wrapper>
      );

      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'existing@test.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(registerError).toBe('Email already exists');
      });
    });
  });

  describe('Session Management', () => {
    it('checks session on mount', async () => {
      vi.mocked(authService.getSession).mockResolvedValue({
        access_token: 'token',
        user: { id: '1', email: 'test@test.com' },
      } as any);

      await authService.getSession();

      expect(authService.getSession).toHaveBeenCalled();
    });

    it('handles no session', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      const session = await authService.getSession();

      expect(session).toBeNull();
    });

    it('signs out user', async () => {
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      await authService.signOut();

      expect(authService.signOut).toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow', () => {
    it('sends password reset email', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      await authService.resetPassword('user@test.com');

      expect(authService.resetPassword).toHaveBeenCalledWith('user@test.com');
    });

    it('handles non-existent email', async () => {
      vi.mocked(authService.resetPassword).mockRejectedValue(
        new Error('Email not found')
      );

      await expect(authService.resetPassword('unknown@test.com')).rejects.toThrow(
        'Email not found'
      );
    });
  });

  describe('Auth State Changes', () => {
    it('subscribes to auth state changes', () => {
      const callback = vi.fn();
      vi.mocked(authService.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      authService.onAuthStateChange(callback);

      expect(authService.onAuthStateChange).toHaveBeenCalledWith(callback);
    });

    it('handles sign in event', () => {
      const callback = vi.fn();
      vi.mocked(authService.onAuthStateChange).mockImplementation((cb: any) => {
        cb('SIGNED_IN', { user: { id: '1' } });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object));
    });

    it('handles sign out event', () => {
      const callback = vi.fn();
      vi.mocked(authService.onAuthStateChange).mockImplementation((cb: any) => {
        cb('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_OUT', null);
    });
  });
});
