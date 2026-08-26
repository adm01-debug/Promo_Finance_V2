import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ResolvedSsoProvider {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  preset: string | null;
  force_sso_for_domains: boolean;
  ordem: number;
}

interface ResolverState {
  providers: ResolvedSsoProvider[];
  autoRedirectProvider: ResolvedSsoProvider | null;
  loading: boolean;
  domain: string | null;
}

/**
 * Debounced resolver: dado um e-mail, retorna SSO providers ativos para o domínio
 * e identifica se há provider com force_sso_for_domains (auto-redirect).
 */
export function useSsoDomainResolver(email: string, debounceMs = 400): ResolverState {
  const [state, setState] = useState<ResolverState>({
    providers: [],
    autoRedirectProvider: null,
    loading: false,
    domain: null,
  });

  useEffect(() => {
    const dom = email.split('@')[1]?.toLowerCase().trim();
    if (!dom || dom.length < 3 || !dom.includes('.')) {
      setState({ providers: [], autoRedirectProvider: null, loading: false, domain: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, domain: dom }));
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('resolve_sso_providers_for_domain', {
          p_domain: dom,
        });
        if (cancelled) return;
        if (error) {
          logger.warn('[useSsoDomainResolver] falha ao resolver domínio SSO', {
            domain: dom,
            error: error.message,
          });
          setState({ providers: [], autoRedirectProvider: null, loading: false, domain: dom });
          return;
        }

        const providers = (data ?? []) as ResolvedSsoProvider[];
        const autoRedirectProvider = providers.find((p) => p.force_sso_for_domains) ?? null;
        setState({ providers, autoRedirectProvider, loading: false, domain: dom });
      } catch (error) {
        if (cancelled) return;
        logger.warn('[useSsoDomainResolver] exceção ao resolver domínio SSO', {
          domain: dom,
          error: error instanceof Error ? error.message : String(error),
        });
        setState({ providers: [], autoRedirectProvider: null, loading: false, domain: dom });
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [email, debounceMs]);

  return state;
}
