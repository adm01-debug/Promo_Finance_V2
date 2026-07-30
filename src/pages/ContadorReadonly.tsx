import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ValidacaoResp {
  success?: boolean;
  error?: string;
  empresa?: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string | null;
    regime_tributario: string | null;
  };
  convite?: { email: string; expires_at: string };
}

export default function ContadorReadonly() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<{ loading: boolean; data?: ValidacaoResp; error?: string }>({
    loading: true,
  });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, error: 'Token ausente' });
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('validar-token-contador', {
        body: { token },
      });
      if (error) {
        setState({ loading: false, error: error.message });
        return;
      }
      if (!data?.success) {
        setState({ loading: false, error: data?.error || 'Token inválido' });
        return;
      }
      setState({ loading: false, data });
    })();
  }, [token]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Acesso negado
            </CardTitle>
            <CardDescription>{state.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const empresa = state.data?.empresa;
  const convite = state.data?.convite;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-10 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <ShieldCheck className="h-3 w-3 mr-1" /> Acesso somente leitura
            </Badge>
            <h1 className="text-2xl font-bold">Painel do Contador</h1>
            <p className="text-sm text-muted-foreground">
              Convite para {convite?.email} · expira em{' '}
              {convite ? new Date(convite.expires_at).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {empresa?.razao_social}
            </CardTitle>
            <CardDescription>
              {empresa?.nome_fantasia ? `${empresa.nome_fantasia} · ` : ''}CNPJ {empresa?.cnpj || '—'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Regime tributário" value={empresa?.regime_tributario || '—'} />
            <Info label="ID da empresa" value={empresa?.id || '—'} mono />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas evoluções</CardTitle>
            <CardDescription>
              Próximas versões trarão obrigações acessórias, vencimentos e DARFs prontos para download.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</p>
    </div>
  );
}
