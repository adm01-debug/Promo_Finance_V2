import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  nome?: string;
  empresa?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  empresa?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const authService = {
  async signIn(email: string, password: string): Promise<{ user: User; session: Session }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Login failed');

    return { user: data.user, session: data.session };
  },

  async signUp(data: SignUpData): Promise<{ user: User; session: Session | null }> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome,
          empresa: data.empresa,
        },
      },
    });

    if (error) throw error;
    if (!authData.user) throw new Error('Registration failed');

    return { user: authData.user, session: authData.session };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('supabase.auth.token');
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<User> {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Update failed');

    return data.user;
  },

  async getProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email!,
      nome: user.user_metadata?.nome,
      empresa: user.user_metadata?.empresa,
      avatar_url: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };
  },

  async updateAvatar(file: File): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    await this.updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  },

  async deleteAccount(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Delete user data first
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Sign out
    await this.signOut();
  },

  async verifyEmail(token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) throw error;
  },

  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
  },

  getAccessToken(): string | null {
    const session = supabase.auth.getSession();
    return null; // Will be async in real implementation
  },

  async refreshToken(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  },
};

export default authService;
