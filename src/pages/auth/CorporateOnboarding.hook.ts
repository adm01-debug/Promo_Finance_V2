// Estado, efeitos e handlers da página CorporateOnboarding — extraídos para zerar max-lines.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSsoDomainResolver, type ResolvedSsoProvider } from '@/hooks/useSsoDomainResolver';
import { useSsoOnboardingAudit } from '@/hooks/useSsoOnboardingAudit';

export const COUNTDOWN_SECONDS = 3;

export function useCorporateOnboarding() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { providers, autoRedirectProvider, loading, domain } = useSsoDomainResolver(submittedEmail);
  const [redirecting, setRedirecting] = useState<ResolvedSsoProvider | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [ssoError, setSsoError] = useState<{ provider: ResolvedSsoProvider; message: string } | null>(null);
  const [userCancelled, setUserCancelled] = useState(false);
  const cancelRef = useRef(false);
  const { logEvent } = useSsoOnboardingAudit();

  // Reset cancelamento quando o e-mail/domínio muda — novo domínio merece novo auto-redirect
  useEffect(() => {
    setUserCancelled(false);
  }, [submittedEmail]);

  // Auditoria: domínio resolvido (com ou sem providers)
  useEffect(() => {
    if (!submittedEmail || loading || !domain) return;
    logEvent({
      eventType: 'domain_resolved',
      email: submittedEmail,
      context: {
        domain,
        providers_count: providers.length,
        force_sso: !!autoRedirectProvider,
        auto_redirect_provider: autoRedirectProvider?.nome ?? null,
      },
    });
  }, [submittedEmail, loading, domain, providers.length, autoRedirectProvider, logEvent]);

  // Quando descobrimos provider com force, inicia contagem regressiva e dispara
  useEffect(() => {
    if (!autoRedirectProvider || redirecting || ssoError || userCancelled) return;
    cancelRef.current = false;
    setRedirecting(autoRedirectProvider);
    setCountdown(COUNTDOWN_SECONDS);
    logEvent({
      eventType: 'auto_redirect_started',
      email: submittedEmail,
      providerId: autoRedirectProvider.id,
      context: {
        domain,
        provider_nome: autoRedirectProvider.nome,
        provider_tipo: autoRedirectProvider.tipo,
      },
    });
  }, [autoRedirectProvider, redirecting, ssoError, userCancelled, submittedEmail, domain, logEvent]);

  // Dispara o SSO de forma determinística: um ÚNICO timer de prazo
  // (countdown * 1000ms) agendado quando `redirecting` é definido, em vez de
  // re-agendar um setTimeout a cada decremento (cadeia frágil que podia não
  // completar). Um setInterval separado cuida apenas do decremento visual.
  // O efeito depende somente de `redirecting`, capturando o countdown inicial.
  useEffect(() => {
    if (!redirecting) return;
    // Fluxo manual: countdown já em 0 → dispara imediatamente (síncrono).
    if (countdown <= 0) {
      if (!cancelRef.current) void triggerSso(redirecting);
      return;
    }
    const deadline = setTimeout(() => {
      if (!cancelRef.current) void triggerSso(redirecting);
    }, countdown * 1000);
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      clearTimeout(deadline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirecting]);

  const triggerSso = async (p: ResolvedSsoProvider) => {
    try {
      const { data, error } = await supabase.functions.invoke('sso-initiate', {
        body: { provider_id: p.id, redirect_to: window.location.origin },
      });
      if (cancelRef.current) return;
      if (error) throw error;
      if (!data?.redirect_url) throw new Error('Resposta inválida do provedor (sem redirect_url)');
      if (data?.verifier && data?.state) {
        sessionStorage.setItem(`pkce:${data.state}`, data.verifier);
      }
      if (cancelRef.current) return;
      logEvent({
        eventType: 'redirect_dispatched',
        email: submittedEmail,
        providerId: p.id,
        context: { domain, provider_nome: p.nome, provider_tipo: p.tipo },
      });
      window.location.href = data.redirect_url;
    } catch (e) {
      if (cancelRef.current) return;
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Falha ao iniciar SSO', { description: message });
      setRedirecting(null);
      setSsoError({ provider: p, message });
      logEvent({
        eventType: 'redirect_failed',
        email: submittedEmail,
        providerId: p.id,
        success: false,
        errorMessage: message,
        context: { domain, provider_nome: p.nome, provider_tipo: p.tipo },
      });
    }
  };

  const handleManualSso = (p: ResolvedSsoProvider) => {
    setSsoError(null);
    setUserCancelled(false);
    cancelRef.current = false;
    setRedirecting(p);
    // countdown 0 mostra "Conectando…" imediatamente e faz o efeito de
    // countdown disparar o triggerSso uma única vez. Não chamamos triggerSso
    // aqui para evitar dupla invocação do sso-initiate.
    setCountdown(0);
    logEvent({
      eventType: 'manual_provider_selected',
      email: submittedEmail,
      providerId: p.id,
      context: { domain, provider_nome: p.nome, provider_tipo: p.tipo },
    });
  };

  const handleCancelRedirect = () => {
    const phase = countdown > 0 ? 'countdown' : 'connecting';
    const cancelledProvider = redirecting;
    cancelRef.current = true;
    setUserCancelled(true);
    setRedirecting(null);
    setCountdown(COUNTDOWN_SECONDS);
    logEvent({
      eventType: 'auto_redirect_cancelled',
      email: submittedEmail,
      providerId: cancelledProvider?.id ?? null,
      context: {
        domain,
        provider_nome: cancelledProvider?.nome ?? null,
        phase,
      },
    });
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
    const targetEmail = submittedEmail || email;
    logEvent({
      eventType: 'password_fallback_used',
      email: targetEmail,
      providerId: ssoError?.provider.id ?? autoRedirectProvider?.id ?? null,
      context: {
        domain,
        provider_nome: ssoError?.provider.nome ?? autoRedirectProvider?.nome ?? null,
        after_error: !!ssoError,
        after_cancel: userCancelled,
      },
    });
    navigate(`/auth?email=${encodeURIComponent(targetEmail)}`);
  };

  return {
    email,
    setEmail,
    submittedEmail,
    setSubmittedEmail,
    providers,
    autoRedirectProvider,
    loading,
    domain,
    redirecting,
    countdown,
    ssoError,
    userCancelled,
    handleManualSso,
    handleCancelRedirect,
    handleResetEmail,
    handleSubmit,
    handleUsePassword,
  };
}
