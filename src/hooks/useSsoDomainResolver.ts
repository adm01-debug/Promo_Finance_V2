import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResolvedSsoProvider {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  preset: string | null;
  allowed_domains: string[];
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

    setState((s) => ({ ...s, loading: true, domain: dom }));
    const t = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from('sso_providers')
        .select('id,nome,tipo,preset,allowed_domains,force_sso_for_domains,ordem')
        .eq('ativo', true)
        .contains('allowed_domains', [dom])
        .order('ordem', { ascending: true });

      const providers = (data ?? []) as ResolvedSsoProvider[];
      const autoRedirectProvider = providers.find((p) => p.force_sso_for_domains) ?? null;
      setState({ providers, autoRedirectProvider, loading: false, domain: dom });
    }, debounceMs);

    return () => clearTimeout(t);
  }, [email, debounceMs]);

  return state;
}
