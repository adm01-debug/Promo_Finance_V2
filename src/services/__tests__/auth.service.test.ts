import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../auth.service';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('signIn', () => {
    it('signs in with email and password', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('throws error on invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(authService.signIn('wrong@example.com', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });

    it('handles network errors', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      await expect(authService.signIn('test@example.com', 'password'))
        .rejects.toThrow('Network error');
    });
  });

  describe('signUp', () => {
    it('creates new user account', async () => {
      const mockUser = { id: '1', email: 'new@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp('new@example.com', 'password123', {
        name: 'New User',
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { name: 'New User' },
        },
      });
      expect(result.user).toEqual(mockUser);
    });

    it('throws error when email already exists', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      await expect(authService.signUp('existing@example.com', 'password'))
        .rejects.toThrow('User already registered');
    });

    it('validates password requirements', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      await expect(authService.signUp('test@example.com', '123'))
        .rejects.toThrow('Password should be at least 6 characters');
    });
  });

  describe('signOut', () => {
    it('signs out current user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('clears local storage on sign out', async () => {
      localStorage.setItem('auth_token', 'token123');
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await authService.signOut();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('handles sign out errors gracefully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('sends password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      await authService.resetPassword('test@example.com');

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object)
      );
    });

    it('throws error for non-existent email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(authService.resetPassword('nonexistent@example.com'))
        .rejects.toThrow('User not found');
    });
  });

  describe('updatePassword', () => {
    it('updates user password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });

      await authService.updatePassword('newPassword123');

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('throws error on invalid password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: { message: 'Password too weak' },
      });

      await expect(authService.updatePassword('weak'))
        .rejects.toThrow('Password too weak');
    });
  });

  describe('getSession', () => {
    it('returns current session', async () => {
      const mockSession = {
        access_token: 'token123',
        user: { id: '1', email: 'test@example.com' },
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
    });

    it('returns null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes to auth state changes', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unsubscribe } = authService.onAuthStateChange(callback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('calls callback on state change', () => {
      const callback = vi.fn();
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
        cb('SIGNED_IN', { user: { id: '1' } });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object));
    });
  });

  describe('updateProfile', () => {
    it('updates user profile data', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: '1', user_metadata: { name: 'Updated Name' } } },
        error: null,
      });

      await authService.updateProfile({ name: 'Updated Name' });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
