import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';
export type RawAppRole = Database['public']['Enums']['app_role'];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** Role global em `user_roles` (fallback) */
  role: AppRole | null;
  /** Role do vínculo `user_empresas` para a empresa atualmente selecionada */
  roleAtual: AppRole | null;
  /** Empresa atualmente ativa (sincronizada com getCurrentEmpresaId) */
  currentEmpresaId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isFinanceiro: boolean;
  isOperacional: boolean;
  hasRole: (roles: AppRole[]) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
