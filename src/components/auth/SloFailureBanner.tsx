import { useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldOff, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { runAuthCleanup } from '@/lib/auth-cleanup';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import {
  clearSloFailure,
  SLO_REASON_COPY,
  type SloFailureSnapshot,
} from '@/lib/sso-slo-state';

interface Props {
  failure: SloFailureSnapshot;
  onDismiss: () => void;
}

/**
 * Banner exibido em /auth quando o SSO Single Logout falhou.
 * Oferece duas ações de recuperação determinísticas em PT-BR.
 */
export function SloFailureBanner({ failure, onDismiss }: Props) {
  const [retryingProvider, setRetryingProvider] = useState(false);
  const [retryingLocal, setRetryingLocal] = useState(false);

  const copy = SLO_REASON_COPY[failure.reason] ?? SLO_REASON_COPY.unknown;
  const providerLabel = failure.providerNome ?? 'provedor SSO';

  const handleRetryProvider = async () => {
    if (!failure.providerId) {
      toast.error('Não há provedor SSO associado para tentar novamente.');
      return;
    }
    setRetryingProvider(true);
    try {
      const { data, error } = await supabase.functions.invoke('sso-logout', {
        body: {
          provider_id: failure.providerId,
          return_origin: window.location.origin,
        },
      });
      if (error) throw error;
      const logoutUrl = (data as { logout_url?: string } | null)?.logout_url;
      if (logoutUrl) {
        toast.loading(`Redirecionando para ${providerLabel}…`, { id: 'sso-slo-retry' });
        clearSloFailure();
        window.location.replace(logoutUrl);
        return;
      }
      // Provedor sem end_session_endpoint — apenas confirmamos sucesso local.
      toast.success(`Sessão encerrada no ${providerLabel}.`, { id: 'sso-slo-retry' });
      clearSloFailure();
      onDismiss();
    } catch (e) {
      logger.warn('[SloFailureBanner] Retry de provider logout falhou', e);
      toast.error(`Não foi possível encerrar a sessão no ${providerLabel}. Tente novamente em instantes.`);
    } finally {
      setRetryingProvider(false);
    }
  };

  const handleRetryLocal = async () => {
    setRetryingLocal(true);
    try {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        logger.warn('[SloFailureBanner] supabase.auth.signOut local falhou', e);
      }
      await runAuthCleanup();
      toast.success('Revogação local concluída.', { id: 'sso-slo-local' });
      clearSloFailure();
      onDismiss();
    } catch (e) {
      logger.error('[SloFailureBanner] runAuthCleanup falhou', e);
      toast.error('Falha ao limpar dados locais. Atualize a página e tente novamente.');
    } finally {
      setRetryingLocal(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-4 border-destructive/40 bg-destructive/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between gap-2 pr-6">
        <span>{copy.title}</span>
        <button
          type="button"
          aria-label="Dispensar aviso"
          onClick={() => {
            clearSloFailure();
            onDismiss();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm leading-relaxed">{copy.description}</p>

        {failure.message && (
          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
            {failure.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetryProvider}
            disabled={retryingProvider || !failure.providerId}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${retryingProvider ? 'animate-spin' : ''}`} />
            {retryingProvider ? 'Tentando…' : `Tentar logout no ${providerLabel}`}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRetryLocal}
            disabled={retryingLocal}
            className="gap-2"
          >
            <ShieldOff className={`h-3.5 w-3.5 ${retryingLocal ? 'animate-pulse' : ''}`} />
            {retryingLocal ? 'Limpando…' : 'Reiniciar revogação local'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
