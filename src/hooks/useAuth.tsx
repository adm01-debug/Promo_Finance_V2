import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import { broadcastSsoSlo, subscribeSsoSlo } from '@/lib/sso-sync';

type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleAtual, setRoleAtual] = useState<AppRole | null>(null);
  const [currentEmpresaId, setCurrentEmpresaIdState] = useState<string | null>(getCurrentEmpresaId());
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('[useAuth] Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        logger.error('[useAuth] Error fetching role:', roleError);
      } else if (roleData) {
        setRole(roleData.role as AppRole);
      }
    } catch {
      // silently fail
    }
  };

  const fetchRoleForEmpresa = async (userId: string, empresaId: string | null) => {
    if (!empresaId) {
      setRoleAtual(null);
      return;
    }
    try {
      const { data, error } = await (supabase as any)
        .from('user_empresas')
        .select('role')
        .eq('user_id', userId)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .maybeSingle();
      if (error) {
        logger.error('[useAuth] Error fetching role per empresa:', error);
        setRoleAtual(null);
        return;
      }
      setRoleAtual((data?.role as AppRole | undefined) ?? null);
    } catch {
      setRoleAtual(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRoleForEmpresa(user.id, currentEmpresaId);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoleForEmpresa(session.user.id, getCurrentEmpresaId());
          }, 0);

          if (event === 'SIGNED_IN') {
            const provider = (session.user.app_metadata as Record<string, unknown> | undefined)?.provider as string | undefined;
            const ssoProviderId = (session.user.user_metadata as Record<string, unknown> | undefined)?.sso_provider_id as string | undefined;
            const isSaml = provider === 'sso:saml' || provider?.startsWith('sso');
            if (isSaml && ssoProviderId) {
              setTimeout(() => {
                supabase.functions.invoke('sso-callback', {
                  body: { kind: 'saml-finalize', provider_id: ssoProviderId },
                }).catch((err) => logger.warn('[useAuth] saml-finalize falhou', err));
              }, 0);
            }
          }
        } else {
          setProfile(null);
          setRole(null);
          setRoleAtual(null);
        }

        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoleForEmpresa(session.user.id, getCurrentEmpresaId());
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sincroniza com mudanças de empresa disparadas pelo EmpresaSwitcher / EmpresaGuard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      const next = typeof detail === 'string' ? detail : getCurrentEmpresaId();
      setCurrentEmpresaIdState(next);
      if (user) fetchRoleForEmpresa(user.id, next);
    };
    window.addEventListener('current-empresa-changed', handler);
    return () => window.removeEventListener('current-empresa-changed', handler);
  }, [user]);

  const signOut = async () => {
    const ssoProviderId = (user?.user_metadata as Record<string, unknown> | undefined)?.sso_provider_id as string | undefined;
    let ssoLogoutUrl: string | null = null;
    let providerNome = 'SSO';

    if (ssoProviderId) {
      try {
        const { data, error } = await supabase.functions.invoke('sso-logout', {
          body: { provider_id: ssoProviderId, return_origin: window.location.origin },
        });
        if (!error && data?.logout_url) ssoLogoutUrl = data.logout_url as string;
        if (!error && data?.provider_nome) providerNome = data.provider_nome as string;
      } catch (e) {
        logger.warn('[useAuth] SSO logout falhou — seguindo com logout local', e);
      }

      // Sincroniza outras abas: cada uma fará signOut local + redirect para /auth.
      try {
        const ts = broadcastSsoSlo(providerNome);
        // Marca esta aba para que ela não reaja ao próprio broadcast.
        sessionStorage.setItem('sso-slo-toast-shown', String(ts));
      } catch { /* noop */ }
      toast.loading(`Encerrando sessão SSO via ${providerNome}…`, { id: 'sso-slo' });
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setRoleAtual(null);

    if (ssoLogoutUrl) {
      window.location.href = ssoLogoutUrl;
    }
  };

  const effectiveRole: AppRole | null = roleAtual ?? role;

  const hasRole = (roles: AppRole[]) => {
    if (!effectiveRole) return false;
    return roles.includes(effectiveRole);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    roleAtual,
    currentEmpresaId,
    isLoading,
    isAdmin: effectiveRole === 'admin',
    isFinanceiro: effectiveRole === 'financeiro' || effectiveRole === 'admin',
    isOperacional: effectiveRole === 'operacional' || effectiveRole === 'financeiro' || effectiveRole === 'admin',
    hasRole,
    signOut,
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
