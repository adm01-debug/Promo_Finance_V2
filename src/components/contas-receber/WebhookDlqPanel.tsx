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
 * O botao de reprocessar entrou depois, quando o banco deixou de bloquear os
 * dois lados: `reprocess_dlq` ganhou EXECUTE para `authenticated` (verificado:
 * `has_function_privilege('authenticated', ..., 'EXECUTE')` = true) e a funcao
 * em si foi corrigida -- antes ela estourava violacao de unicidade em qualquer
 * evento com `external_id`, porque inseria um segundo registro em vez de
 * reagendar o original (PR #409).
 */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { cn } from '@/lib/utils';
import { WebhookDlqItem, type DlqRow } from './WebhookDlqItem';

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

const PAGINA_DLQ = 20;

export function WebhookDlqPanel() {
  // Sem papel admin a politica de SELECT NAO da erro: ela filtra as linhas e
  // devolve sucesso com `data: []` (o GRANT SELECT para `authenticated` esta em
  // supabase/migrations/20260711153447_...sql:36 e a politica admin em
  // 20260825230000_initplan_rls_e67.sql:886). Como /contas-receber e
  // ProtectedRoute sem restricao de papel, um usuario comum veria
  // "nenhum webhook em falha" com a fila cheia -- exatamente o silencio que
  // este painel vem acabar (achado P2 do Codex na PR #406). Entao a autorizacao
  // e verificada ANTES da consulta.
  // `isAdmin` do AuthProvider e `roleAtual ?? role` -- o papel da EMPRESA tem
  // prioridade. A politica da fila usa `has_role(auth.uid(),'admin')`, que le
  // `user_roles`, ou seja o papel GLOBAL. Usar isAdmin errava nos dois sentidos
  // (achado 🔴 do Devin na PR #406): admin so da empresa passava pelo gate e
  // recebia lista vazia da RLS -- "nenhuma falha" com a fila cheia --, e admin
  // global com papel local menor era bloqueado sem precisar.
  const { role } = useAuth();
  const podeLerDlq = role === 'admin';

  // Paginacao por `range`, nao por `limit` crescente: o PostgREST corta a
  // resposta em 1.000 linhas, entao aumentar o limite nunca traria a falha
  // 1.001 -- "Carregar mais" repetiria as mesmas para sempre (achado do Devin).
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['webhook-dlq-abertos'],
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        const de = pageParam as number;
        // `count: 'exact'` para o contador nao mentir: o tamanho da pagina era
        // apresentado como total em aberto.
        const { data, error, count } = await supabase
          .from('webhook_dlq')
          .select(
            'id, source, event_type, external_id, error_message, attempts, first_failed_at, last_attempt_at, created_at',
            { count: 'exact' }
          )
          .is('resolved_at', null)
          .order('created_at', { ascending: false })
          // `id` como desempate: sem ordem unica, janelas diferentes repetem e
          // omitem linhas de mesmo `created_at`.
          .order('id')
          .range(de, de + PAGINA_DLQ - 1);
        if (error) throw error;
        return { linhas: (data ?? []) as DlqRow[], total: count ?? 0, de };
      },
      getNextPageParam: (ultima) => {
        const lidas = ultima.de + ultima.linhas.length;
        if (ultima.linhas.length === 0 || lidas >= ultima.total) return undefined;
        return lidas;
      },
      enabled: podeLerDlq,
      staleTime: 60_000,
    });

  const linhas = (data?.pages ?? []).flatMap((p) => p.linhas);
  const total = data?.pages?.[0]?.total ?? 0;

  // Reprocessar reentrega um evento real (cobranca, baixa, estorno), entao
  // passa por confirmacao em vez de disparar no clique.
  const [aConfirmar, setAConfirmar] = useState<DlqRow | null>(null);
  const queryClient = useQueryClient();

  const reprocessar = useMutation({
    mutationFn: async (row: DlqRow) => {
      // `reprocess_dlq` nao esta nos tipos gerados -- supabaseDyn e o ponto
      // unico de cast do repo. Ela NAO rejeita: devolve `{ data, error }`.
      const { data: logId, error: erroRpc } = await supabaseDyn.rpc<string>('reprocess_dlq', {
        p_dlq_id: row.id,
      });
      if (erroRpc) throw erroRpc;
      return logId;
    },
    onSuccess: () => {
      toast.success('Evento reenfileirado. O worker tenta de novo na próxima rodada.');
      void queryClient.invalidateQueries({ queryKey: ['webhook-dlq-abertos'] });
    },
    // Falha de reprocessamento nao pode sumir: alem do toast, o motivo fica na
    // tela -- e o mesmo princípio do erro de leitura logo abaixo.
    onError: (erro: unknown) => {
      toast.error(`Não foi possível reprocessar: ${mensagemDeErro(erro)}`);
    },
    onSettled: () => setAConfirmar(null),
  });

  // Estavel: a linha e `memo`, entao um callback novo a cada render anularia a
  // memoizacao justamente quando a lista cresce.
  const pedirConfirmacao = useCallback((row: DlqRow) => setAConfirmar(row), []);

  if (!podeLerDlq) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium">Fila de webhooks em falha: acesso restrito</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          A leitura depende do papel global de administrador (o mesmo que a política do banco
          exige), não do papel na empresa. Esta tela não mostra &quot;nenhuma falha&quot; para quem
          não pode ler: peça a um administrador global.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Webhooks que falharam
            {total > 0 ? (
              <Badge variant="destructive" className="text-[10px]">
                {total} em aberto
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
          <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
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
      ) : linhas.length === 0 ? (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5" />
          Nenhum webhook em falha no momento.
        </p>
      ) : (
        <div className="space-y-2">
          {linhas.map((row) => (
            <WebhookDlqItem
              key={row.id}
              row={row}
              reprocessando={reprocessar.isPending}
              onReprocessar={pedirConfirmacao}
            />
          ))}
          {hasNextPage ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">
                {`Mostrando ${linhas.length} de ${total} falhas em aberto.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => fetchNextPage()}
              >
                Carregar mais
              </Button>
            </div>
          ) : null}
          {reprocessar.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <p className="text-xs font-medium">O reprocessamento não foi aceito.</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                O evento continua na fila. {mensagemDeErro(reprocessar.error)}
              </p>
            </div>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            Reprocessar devolve o evento à fila do worker. Evento que já foi concluído por outro
            caminho não é reexecutado: a fila apenas marca o item como resolvido.
          </p>
        </div>
      )}

      <AlertDialog
        open={aConfirmar !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setAConfirmar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprocessar este webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento volta para a fila e será entregue de novo ao sistema — pode alterar títulos,
              cobranças e baixas. Origem {aConfirmar?.source ?? 'desconhecida'}
              {aConfirmar?.external_id ? `, id externo ${aConfirmar.external_id}` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aConfirmar) reprocessar.mutate(aConfirmar);
              }}
            >
              Reprocessar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
