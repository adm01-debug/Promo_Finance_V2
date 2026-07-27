/**
 * Página de aceite de convite (`/convite/:token`).
 * A validação real acontece na Edge Function com service role; aqui apenas
 * orquestramos a experiência e mostramos o motivo exato de qualquer recusa.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, MailCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAceitarConvite } from '@/hooks/useOrganizacoes';
import { ROTULO_ORG_PAPEL } from '@/lib/organizacoes/convites';

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const aceitar = useAceitarConvite();
  const [erro, setErro] = useState<string | null>(null);

  const tokenValido = Boolean(token && /^[a-f0-9]{64}$/.test(token));

  useEffect(() => {
    if (!isLoading && !user && tokenValido) {
      navigate(`/auth?redirect=${encodeURIComponent(`/convite/${token}`)}`, { replace: true });
    }
  }, [isLoading, user, tokenValido, token, navigate]);

  const processar = () => {
    if (!token) return;
    setErro(null);
    aceitar.mutate(token, {
      onSuccess: (resposta) => {
        toast.success(`Você entrou em ${resposta.organizacao_nome}.`);
        navigate('/organizacoes', { replace: true });
      },
      onError: (e) => {
        const mensagem = e instanceof Error ? e.message : 'Não foi possível aceitar o convite.';
        setErro(mensagem);
        toast.error(mensagem);
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="h-5 w-5 text-primary" />
            Convite para organização
          </CardTitle>
          <CardDescription>
            {user?.email
              ? `Você está autenticado como ${user.email}. O convite precisa ter sido emitido para este e-mail.`
              : 'Entre com a conta convidada para prosseguir.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!tokenValido && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>Link de convite inválido ou incompleto.</AlertDescription>
            </Alert>
          )}

          {erro && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {aceitar.isSuccess && aceitar.data && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Vínculo criado em {aceitar.data.organizacao_nome} como{' '}
                {ROTULO_ORG_PAPEL[aceitar.data.papel]}.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={processar}
              disabled={!tokenValido || !user || aceitar.isPending}
            >
              {aceitar.isPending ? 'Validando...' : 'Aceitar convite'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
