import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IDP_PRESETS } from './IdpPresets';

interface Provider {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  preset: string | null;
  allowed_domains: string[];
  force_sso_for_domains: boolean;
}

export function SsoLoginButtons({ email }: { email: string }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const dom = email.split('@')[1]?.toLowerCase().trim();
    if (!dom || dom.length < 3) { setProviders([]); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('sso_providers')
        .select('id,nome,tipo,preset,allowed_domains,force_sso_for_domains')
        .eq('ativo', true)
        .contains('allowed_domains', [dom])
        .order('ordem');
      setProviders((data ?? []) as Provider[]);
    })();
  }, [email]);

  if (!providers.length) return null;

  const handleSSO = async (p: Provider) => {
    setLoading(p.id);
    try {
      const { data, error } = await supabase.functions.invoke('sso-initiate', {
        body: { provider_id: p.id, redirect_to: window.location.origin },
      });
      if (error) throw error;
      if (data.verifier) sessionStorage.setItem(`pkce:${data.state}`, data.verifier);
      window.location.href = data.redirect_url;
    } catch (e) {
      toast.error('Falha ao iniciar SSO', { description: (e as Error).message });
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2 mt-4 pt-4 border-t">
      <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">Login corporativo</p>
      {providers.map(p => {
        const preset = IDP_PRESETS.find(x => x.id === p.preset);
        return (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleSSO(p)}
            disabled={!!loading}
            aria-label={`Entrar com ${p.nome}`}
          >
            {loading === p.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <span className="text-base">{preset?.logo ?? <KeyRound className="h-4 w-4" />}</span>}
            Entrar com {p.nome}
          </Button>
        );
      })}
    </div>
  );
}
