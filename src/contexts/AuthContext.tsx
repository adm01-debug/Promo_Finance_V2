import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { authService, UserProfile } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome?: string, empresa?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);
        
        if (currentSession) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          
          const userProfile = await authService.getProfile();
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        
        if (newSession) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          
          const userProfile = await authService.getProfile();
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: authUser, session: authSession } = await authService.signIn(email, password);
      setUser(authUser);
      setSession(authSession);
      
      const userProfile = await authService.getProfile();
      setProfile(userProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nome?: string, empresa?: string) => {
    setIsLoading(true);
    try {
      const { user: authUser, session: authSession } = await authService.signUp({
        email,
        password,
        nome,
        empresa,
      });
      setUser(authUser);
      setSession(authSession);
      
      if (authSession) {
        const userProfile = await authService.getProfile();
        setProfile(userProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    try {
      await authService.updatePassword(password);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Erro ao atualizar senha') };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updatedUser = await authService.updateProfile(updates);
    setUser(updatedUser);
    
    const userProfile = await authService.getProfile();
    setProfile(userProfile);
  };

  const refreshProfile = async () => {
    const userProfile = await authService.getProfile();
    setProfile(userProfile);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
