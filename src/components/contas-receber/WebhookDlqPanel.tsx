/**
 * Fila de webhooks que FALHARAM (public.webhook_dlq).
 *
 * O back-end dessa fila esta completo em producao e nao tinha tela nenhuma:
 * - `webhook_dlq` existe, com RLS admin para SELECT e UPDATE;
 * - `webhook_mark_failure` grava ali depois de esgotar as tentativas
 *   (supabase/functions/_shared/webhook-idempotency.ts:82);
 * - `reprocess_dlq(p_dlq_id, p_notes)` reenfileira o evento em `webhooks_log`.
 *
 * Nenhum arquivo de `src/` lia a tabela, enquanto WebhookConfigPanel mostrava
 * apenas `webhooks_log` -- os webhooks que CHEGARAM. Resultado: uma cobranca do
 * Asaas que falha por timeout ou assinatura invalida saia de cena sem aviso.
 *
 * O botao de reprocessar NAO entra aqui: `reprocess_dlq` nao tem EXECUTE para o
 * papel `authenticated` (verificado: `has_function_privilege('authenticated',
 * ..., 'EXECUTE')` = false), e conceder isso e DDL em producao -- decisao do
 * dono pelo AGENTS.md 6.6. Esta tela mostra a falha; o reprocessamento vem na
 * PR da migration.
 */
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Inbox, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DlqRow {
  id: string;
  source: string | null;
  event_type: string | null;
  external_id: string | null;
  error_message: string | null;
  attempts: number | null;
  first_failed_at: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

/**
 * `supabase.from(...)` rejeita com PostgrestError -- objeto `{ message }`, nao
 * `Error`. Checar so `instanceof Error` esconderia o motivo real (ex.:
 * "permission denied for table webhook_dlq") atras do texto genérico. Mesmo
 * cuidado de AcessosSuspeitosPanel.tsx, onde o defeito foi apontado na PR #405.
 */
function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message;
  if (erro && typeof erro === 'object' && 'message' in erro) {
    const m = (erro as { message?: unknown }).message;
    if (typeof m === 'string' && m) return m;
  }
  return 'Verifique se o seu usuário tem papel de administrador.';
}

export function WebhookDlqPanel() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<DlqRow[]>({
    queryKey: ['webhook-dlq-abertos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_dlq')
        .select(
          'id, source, event_type, external_id, error_message, attempts, first_failed_at, last_attempt_at, created_at'
        )
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as DlqRow[];
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Webhooks que falharam
            {data && data.length > 0 ? (
              <Badge variant="destructive" className="text-[10px]">
                {data.length} em aberto
              </Badge>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            Eventos que esgotaram as tentativas e não foram processados.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Atualizar fila de falhas"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : isError ? (
        /*
         * Falha de leitura NAO pode virar "nenhuma falha": era justamente esse
         * silencio que deixava a fila invisivel. Sem papel admin a politica de
         * RLS nega o SELECT, e o motivo tem que aparecer.
         */
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium">Não foi possível ler a fila de falhas.</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Nada é exibido para não passar erro de leitura como fila vazia. {mensagemDeErro(error)}
          </p>
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5" />
          Nenhum webhook em falha no momento.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold truncate">
                  {row.source ?? 'origem desconhecida'} · {row.event_type ?? 'evento sem tipo'}
                </p>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {row.attempts ?? 0} tentativa{(row.attempts ?? 0) === 1 ? '' : 's'}
                </Badge>
              </div>
              <p className="text-[11px] text-destructive/90 break-words">
                {row.error_message ?? 'sem mensagem de erro registrada'}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(row.last_attempt_at ?? row.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
                {row.external_id ? ` · id externo ${row.external_id}` : ''}
              </p>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">
            Reprocessar um evento exige liberar a função <code>reprocess_dlq</code> para a aplicação
            — alteração de banco pendente de aprovação.
          </p>
        </div>
      )}
    </div>
  );
}
