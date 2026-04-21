import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Loader2, Mail, ArrowRight, KeyRound, X, AlertTriangle, RotateCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSsoDomainResolver, type ResolvedSsoProvider } from '@/hooks/useSsoDomainResolver';
import { IDP_PRESETS } from '@/components/admin/sso/IdpPresets';

const COUNTDOWN_SECONDS = 3;

export default function CorporateOnboarding() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { providers, autoRedirectProvider, loading, domain } = useSsoDomainResolver(submittedEmail);
  const [redirecting, setRedirecting] = useState<ResolvedSsoProvider | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [ssoError, setSsoError] = useState<{ provider: ResolvedSsoProvider; message: string } | null>(null);
  const [userCancelled, setUserCancelled] = useState(false);
  const cancelRef = useRef(false);

  // Reset cancelamento quando o e-mail/domínio muda — novo domínio merece novo auto-redirect
  useEffect(() => {
    setUserCancelled(false);
  }, [submittedEmail]);

  // Quando descobrimos provider com force, inicia contagem regressiva e dispara
  useEffect(() => {
    if (!autoRedirectProvider || redirecting || ssoError || userCancelled) return;
    cancelRef.current = false;
    setRedirecting(autoRedirectProvider);
    setCountdown(COUNTDOWN_SECONDS);
  }, [autoRedirectProvider, redirecting, ssoError, userCancelled]);

  useEffect(() => {
    if (!redirecting) return;
    if (countdown <= 0) {
      if (cancelRef.current) return;
      void triggerSso(redirecting);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [redirecting, countdown]);

  const triggerSso = async (p: ResolvedSsoProvider) => {
    try {
      const { data, error } = await supabase.functions.invoke('sso-initiate', {
        body: { provider_id: p.id, redirect_to: window.location.origin },
      });
      // Aborta se o usuário cancelou enquanto a chamada estava em flight
      if (cancelRef.current) return;
      if (error) throw error;
      if (!data?.redirect_url) throw new Error('Resposta inválida do provedor (sem redirect_url)');
      if (data?.verifier && data?.state) {
        sessionStorage.setItem(`pkce:${data.state}`, data.verifier);
      }
      // Última verificação antes de sair da página
      if (cancelRef.current) return;
      window.location.href = data.redirect_url;
    } catch (e) {
      if (cancelRef.current) return;
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Falha ao iniciar SSO', { description: message });
      setRedirecting(null);
      setSsoError({ provider: p, message });
    }
  };

  const handleManualSso = async (p: ResolvedSsoProvider) => {
    setSsoError(null);
    setUserCancelled(false);
    cancelRef.current = false;
    setRedirecting(p);
    setCountdown(0);
    await triggerSso(p);
  };

  const handleCancelRedirect = () => {
    cancelRef.current = true;
    setUserCancelled(true);
    setRedirecting(null);
    setCountdown(COUNTDOWN_SECONDS);
    toast.info('Redirecionamento cancelado', {
      description: 'Escolha um método de login manualmente.',
    });
  };

  const handleResetEmail = () => {
    setSsoError(null);
    setSubmittedEmail('');
    setEmail('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Informe um e-mail válido');
      return;
    }
    setSubmittedEmail(trimmed);
  };

  const handleUsePassword = () => {
    navigate(`/auth?email=${encodeURIComponent(submittedEmail || email)}`);
  };

  // Estado: erro no SSO — fallback com retry, providers alternativos e senha
  if (ssoError) {
    const failedPreset = IDP_PRESETS.find((x) => x.id === ssoError.provider.preset);
    const otherProviders = providers.filter((p) => p.id !== ssoError.provider.id);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Não foi possível iniciar o login SSO</CardTitle>
              <CardDescription>
                Houve uma falha ao redirecionar para <strong>{ssoError.provider.nome}</strong>.
                Você pode tentar novamente ou continuar com outro método.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="error">
                <AlertDescription className="text-sm">
                  <span className="flex items-center gap-2 font-medium mb-1">
                    <span aria-hidden>{failedPreset?.logo ?? <KeyRound className="h-4 w-4" />}</span>
                    {ssoError.provider.nome}
                  </span>
                  <span className="text-xs opacity-90 break-words">{ssoError.message}</span>
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                className="w-full gap-2"
                size="lg"
                onClick={() => handleManualSso(ssoError.provider)}
              >
                <RotateCw className="h-4 w-4" />
                Tentar novamente
              </Button>

              {otherProviders.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
                    Outros provedores disponíveis
                  </p>
                  {otherProviders.map((p) => {
                    const preset = IDP_PRESETS.find((x) => x.id === p.preset);
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleManualSso(p)}
                        aria-label={`Entrar com ${p.nome}`}
                      >
                        <span className="text-base" aria-hidden>
                          {preset?.logo ?? <KeyRound className="h-4 w-4" />}
                        </span>
                        Entrar com {p.nome}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={handleUsePassword}
                >
                  <LogIn className="h-4 w-4" />
                  Continuar com senha
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleResetEmail}
                >
                  Usar outro e-mail
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Estado: redirecionando
  if (redirecting) {
    const preset = IDP_PRESETS.find((x) => x.id === redirecting.preset);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 text-4xl" aria-hidden>
                {preset?.logo ?? <KeyRound className="mx-auto h-10 w-10 text-primary" />}
              </div>
              <CardTitle>Redirecionando para {redirecting.nome}</CardTitle>
              <CardDescription>
                Você será autenticado pelo seu provedor corporativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-center gap-3 py-4 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {countdown > 0
                  ? `Iniciando em ${countdown}s…`
                  : `Conectando ao ${redirecting.nome}…`}
              </div>
              {countdown > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleCancelRedirect}
                >
                  <X className="h-4 w-4" />
                  Cancelar redirecionamento
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Acesso corporativo</CardTitle>
            <CardDescription>
              Use seu e-mail da empresa. Identificamos seu provedor SSO automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="corp-email">E-mail corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="corp-email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim().toLowerCase();
                      if (v.includes('@') && v !== submittedEmail) setSubmittedEmail(v);
                    }}
                    className="pl-10"
                    aria-describedby="corp-email-help"
                  />
                </div>
                <p id="corp-email-help" className="text-xs text-muted-foreground">
                  Se sua organização tem SSO configurado, redirecionamos automaticamente.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Continuar
              </Button>
            </form>

            {submittedEmail && !loading && providers.length === 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  Nenhum provedor SSO encontrado para <strong>{domain}</strong>.{' '}
                  <button
                    type="button"
                    onClick={handleUsePassword}
                    className="text-primary underline hover:no-underline"
                  >
                    Continuar com senha
                  </button>
                  .
                </AlertDescription>
              </Alert>
            )}

            {providers.length > 0 && !autoRedirectProvider && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
                  Provedores disponíveis
                </p>
                {providers.map((p) => {
                  const preset = IDP_PRESETS.find((x) => x.id === p.preset);
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleManualSso(p)}
                      aria-label={`Entrar com ${p.nome}`}
                    >
                      <span className="text-base" aria-hidden>
                        {preset?.logo ?? <KeyRound className="h-4 w-4" />}
                      </span>
                      Entrar com {p.nome}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  size="sm"
                  onClick={handleUsePassword}
                >
                  Continuar com senha
                </Button>
              </div>
            )}

            <div className="text-center pt-2 border-t">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Voltar ao login padrão
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
