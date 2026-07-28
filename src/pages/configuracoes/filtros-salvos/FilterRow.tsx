// @ts-nocheck — pendente: tabelas/colunas ausentes no schema; remover ao fechar o gap
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, HardDrive, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { FilterCatalogEntry } from '../savedFiltersCatalog';
import type { DiagnosticState } from './types';
import { computeDivergence } from './helpers';
import { DivergenceBadge, LocalBadge, RemoteBadge } from './Badges';

interface FilterRowProps {
  entry: FilterCatalogEntry;
  diagnostic?: DiagnosticState;
  onRefresh: () => void;
  userId?: string | null;
}

export function FilterRow({ entry, diagnostic, onRefresh, userId }: FilterRowProps) {
  const divergence = computeDivergence(diagnostic);
  const [applying, setApplying] = useState<null | 'remote-to-local' | 'local-to-remote'>(null);

  const canPullToDevice =
    !!entry.localStorageKey &&
    diagnostic?.remote === 'ok' &&
    !diagnostic?.syncing &&
    applying === null;

  const canPushToAccount =
    !!userId &&
    !!entry.localStorageKey &&
    diagnostic?.local === 'ok' &&
    !diagnostic?.syncing &&
    applying === null;

  /** Conta → Dispositivo: lê o payload do Supabase e grava no localStorage. */
  const handlePullToDevice = async () => {
    if (!entry.localStorageKey || !userId) return;
    setApplying('remote-to-local');
    try {
      const { data, error } = await supabase
        .from('user_active_filters')
        .select('payload, updated_at')
        .eq('user_id', userId)
        .eq('entity_type', entry.entityType)
        .maybeSingle();
      if (error) throw error;
      const payload = (data?.payload ?? {}) as { filters?: Record<string, unknown> };
      const filters = payload.filters ?? payload;
      const next = { filters, ts: data?.updated_at ?? new Date().toISOString() };
      window.localStorage.setItem(entry.localStorageKey, JSON.stringify(next));
      toast.success('Filtros aplicados neste dispositivo', {
        description: `${entry.label}: a tela usará a versão da conta na próxima abertura.`,
      });
      onRefresh();
    } catch (e) {
      logger.error('[FiltrosSalvos] pull falhou', { entityType: entry.entityType, e });
      toast.error('Não foi possível copiar da conta para o dispositivo');
    } finally {
      setApplying(null);
    }
  };

  /** Dispositivo → Conta: lê o localStorage e faz upsert no Supabase. */
  const handlePushToAccount = async () => {
    if (!entry.localStorageKey || !userId) return;
    setApplying('local-to-remote');
    try {
      const raw = window.localStorage.getItem(entry.localStorageKey);
      if (!raw) throw new Error('localStorage vazio');
      const parsed = JSON.parse(raw);
      const filters = (parsed?.filters ?? parsed) as Record<string, unknown>;
      const { error } = await supabase
        .from('user_active_filters')
        .upsert(
          [
            {
              user_id: userId,
              entity_type: entry.entityType,
              payload: { filters } as never,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'user_id,entity_type' },
        );
      if (error) throw error;
      toast.success('Filtros enviados para a conta', {
        description: `${entry.label}: outros dispositivos receberão na próxima abertura.`,
      });
      onRefresh();
    } catch (e) {
      logger.error('[FiltrosSalvos] push falhou', { entityType: entry.entityType, e });
      toast.error('Não foi possível copiar do dispositivo para a conta');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={entry.route}
              className="font-semibold text-sm hover:underline underline-offset-4"
            >
              {entry.label}
            </Link>
            <Badge variant="outline" className="text-[10px]">
              {entry.area}
            </Badge>
            {entry.auto && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/40 text-primary"
                  >
                    Auto
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Descoberta automaticamente em runtime (Supabase ou localStorage). Adicione ao
                    catálogo central em <code>savedFiltersCatalog.ts</code> para nomear, agrupar
                    e linkar a tela correta.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
            entityType: <span className="text-foreground">{entry.entityType}</span>
          </div>
          {entry.localStorageKey && (
            <div className="text-xs text-muted-foreground font-mono break-all">
              localStorage: <span className="text-foreground">{entry.localStorageKey}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Campos padrão: {entry.defaultsKeys.join(', ')}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <RemoteBadge status={diagnostic?.remote} />
            <LocalBadge status={diagnostic?.local} />
            <DivergenceBadge div={divergence} />
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePullToDevice}
                    disabled={!canPullToDevice}
                    className="gap-1 h-7"
                    aria-label="Aplicar agora: copiar filtros da conta para este dispositivo"
                  >
                    {applying === 'remote-to-local' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Database className="h-3 w-3" />
                        <ArrowRight className="h-3 w-3" />
                        <HardDrive className="h-3 w-3" />
                      </>
                    )}
                    Aplicar agora
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Copia o payload do Supabase para este dispositivo agora, sem esperar a próxima abertura da tela.
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePushToAccount}
                    disabled={!canPushToAccount}
                    className="gap-1 h-7"
                    aria-label="Aplicar agora: copiar filtros do dispositivo para a conta"
                  >
                    {applying === 'local-to-remote' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <HardDrive className="h-3 w-3" />
                        <ArrowRight className="h-3 w-3" />
                        <Database className="h-3 w-3" />
                      </>
                    )}
                    Aplicar agora
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Envia o estado deste dispositivo para a conta no Supabase agora; outros dispositivos receberão na próxima abertura.
                </p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={diagnostic?.syncing || applying !== null}
              className="gap-1 h-7"
            >
              {diagnostic?.syncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Recarregar
            </Button>
          </div>
        </div>
      </div>

      {(diagnostic?.remoteUpdatedAt || diagnostic?.localUpdatedAt) && (
        <>
          <Separator className="my-3" />
          <div className="grid gap-2 md:grid-cols-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Conta:</span>{' '}
              {diagnostic?.remoteUpdatedAt ?? '—'}
              {diagnostic?.remoteKeys.length ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-2 underline decoration-dotted cursor-help">
                      {diagnostic.remoteKeys.length} chave(s)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{diagnostic.remoteKeys.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div>
              <span className="font-medium text-foreground">Dispositivo:</span>{' '}
              {diagnostic?.localUpdatedAt ?? '—'}
              {diagnostic?.localKeys.length ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-2 underline decoration-dotted cursor-help">
                      {diagnostic.localKeys.length} chave(s)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{diagnostic.localKeys.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
