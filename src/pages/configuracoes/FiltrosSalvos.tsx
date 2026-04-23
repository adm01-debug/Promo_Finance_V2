import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  CloudOff,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

/**
 * Catálogo central de filtros gerenciados.
 * Mantém em sincronia com instâncias de useManagedFilters em todo o app.
 */
interface FilterCatalogEntry {
  entityType: string;
  label: string;
  area: string;
  route: string;
  localStorageKey?: string;
  defaultsKeys: string[];
}

const CATALOG: FilterCatalogEntry[] = [
  {
    entityType: 'clientes',
    label: 'Clientes',
    area: 'Cadastros',
    route: '/clientes',
    localStorageKey: 'clientes-filters',
    defaultsKeys: ['search', 'status', 'estado', 'score'],
  },
  {
    entityType: 'fornecedores',
    label: 'Fornecedores',
    area: 'Cadastros',
    route: '/fornecedores',
    localStorageKey: 'fornecedores-filters',
    defaultsKeys: ['search', 'status', 'estado'],
  },
  {
    entityType: 'audit-logs',
    label: 'Logs de Auditoria',
    area: 'Administração',
    route: '/audit-logs',
    localStorageKey: 'audit-logs-filters',
    defaultsKeys: ['search', 'action', 'table', 'user'],
  },
  {
    entityType: 'lancamentos-contabeis',
    label: 'Lançamentos Contábeis',
    area: 'Contabilidade',
    route: '/contabilidade',
    localStorageKey: 'app-lancamentos-filters',
    defaultsKeys: ['busca', 'preset', 'dataInicio', 'dataFim'],
  },
  {
    entityType: 'razao-diario',
    label: 'Razão & Diário',
    area: 'Contabilidade',
    route: '/contabilidade',
    localStorageKey: 'app-razao-diario-filters',
    defaultsKeys: ['modo', 'preset', 'dataInicio', 'dataFim', 'contaId', 'busca'],
  },
  {
    entityType: 'auditoria-ia',
    label: 'Auditoria IA',
    area: 'Administração',
    route: '/admin/auditoria-ia',
    localStorageKey: 'app-auditoria-ia-filters',
    defaultsKeys: ['userFilter', 'cnpjFilter', 'transacaoFilter', 'acaoFilter'],
  },
  {
    entityType: 'sso-jit-events',
    label: 'SSO JIT Events',
    area: 'Administração',
    route: '/admin/sso-jit',
    localStorageKey: 'app-sso-jit-filters',
    defaultsKeys: ['dateRange', 'search', 'providerFilter', 'roleFilter', 'viaFilter', 'originFilter'],
  },
  {
    entityType: 'dashboard-receber',
    label: 'Dashboard Receber',
    area: 'Financeiro',
    route: '/dashboard-receber',
    localStorageKey: 'app-dashboard-receber-filters',
    defaultsKeys: ['empresaId', 'vendedorId', 'ramoAtividade', 'statusFilter', 'clienteId', 'periodo', 'dataInicio', 'dataFim'],
  },
  {
    entityType: 'expert-history',
    label: 'Histórico do Expert',
    area: 'IA',
    route: '/expert',
    localStorageKey: 'app-expert-history-filters',
    defaultsKeys: ['searchQuery', 'dateFilter'],
  },
];

interface DiagnosticState {
  entityType: string;
  remote: 'ok' | 'empty' | 'error' | 'loading';
  remoteUpdatedAt: string | null;
  remoteUpdatedAtIso: string | null;
  remoteKeys: string[];
  local: 'ok' | 'empty' | 'error';
  localKeys: string[];
  localUpdatedAt: string | null;
  localUpdatedAtIso: string | null;
  syncing: boolean;
}

type DivergenceDirection = 'in-sync' | 'remote-newer' | 'local-newer' | 'remote-only' | 'local-only' | 'none' | 'unknown';

interface Divergence {
  direction: DivergenceDirection;
  reason: string;
}

function readLocalState(key?: string): { keys: string[]; ts: string | null; tsIso: string | null; status: 'ok' | 'empty' | 'error' } {
  if (!key || typeof window === 'undefined') return { keys: [], ts: null, tsIso: null, status: 'empty' };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { keys: [], ts: null, tsIso: null, status: 'empty' };
    const parsed = JSON.parse(raw);
    const filters = (parsed?.filters ?? parsed) as Record<string, unknown>;
    const tsIso = parsed?.ts ? new Date(parsed.ts).toISOString() : null;
    const ts = parsed?.ts ? new Date(parsed.ts).toLocaleString('pt-BR') : null;
    return { keys: Object.keys(filters || {}), ts, tsIso, status: 'ok' };
  } catch (e) {
    logger.warn('[FiltrosSalvos] failed reading local', { key, e });
    return { keys: [], ts: null, tsIso: null, status: 'error' };
  }
}

/**
 * Calcula a divergência entre o estado remoto (Supabase/conta) e local
 * (localStorage/dispositivo). Direção indica para onde o sync deve fluir
 * para reconciliar — quem está mais novo "vence" a próxima hidratação.
 */
function computeDivergence(d?: DiagnosticState): Divergence {
  if (!d || d.remote === 'loading' || d.syncing) return { direction: 'unknown', reason: 'Carregando…' };
  if (d.remote === 'error') return { direction: 'unknown', reason: 'Erro ao ler conta' };

  const hasRemote = d.remote === 'ok';
  const hasLocal = d.local === 'ok';

  if (!hasRemote && !hasLocal) return { direction: 'none', reason: 'Sem filtros salvos' };
  if (hasRemote && !hasLocal) return { direction: 'remote-only', reason: 'Existe na conta, ausente neste dispositivo' };
  if (!hasRemote && hasLocal) return { direction: 'local-only', reason: 'Existe no dispositivo, ausente na conta' };

  // Ambos presentes — compara chaves e timestamps
  const remoteSet = new Set(d.remoteKeys);
  const localSet = new Set(d.localKeys);
  const sameKeys =
    remoteSet.size === localSet.size && [...remoteSet].every((k) => localSet.has(k));

  const rT = d.remoteUpdatedAtIso ? Date.parse(d.remoteUpdatedAtIso) : NaN;
  const lT = d.localUpdatedAtIso ? Date.parse(d.localUpdatedAtIso) : NaN;

  if (Number.isFinite(rT) && Number.isFinite(lT)) {
    const diff = rT - lT;
    // Tolerância de 2s para pequenos clock skews
    if (Math.abs(diff) < 2000 && sameKeys) return { direction: 'in-sync', reason: 'Conta e dispositivo idênticos' };
    if (diff > 0) return { direction: 'remote-newer', reason: 'Conta mais recente que dispositivo' };
    if (diff < 0) return { direction: 'local-newer', reason: 'Dispositivo mais recente que conta' };
  }

  if (sameKeys) return { direction: 'in-sync', reason: 'Mesmas chaves em ambos' };
  return { direction: 'unknown', reason: 'Chaves divergentes sem timestamp confiável' };
}

export default function FiltrosSalvos() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticState>>({});
  const [globalSyncing, setGlobalSyncing] = useState(false);

  const refreshOne = useCallback(
    async (entry: FilterCatalogEntry) => {
      setDiagnostics((prev) => ({
        ...prev,
        [entry.entityType]: {
          ...(prev[entry.entityType] ?? {
            entityType: entry.entityType,
            remote: 'loading',
            remoteUpdatedAt: null,
            remoteUpdatedAtIso: null,
            remoteKeys: [],
            local: 'empty',
            localKeys: [],
            localUpdatedAt: null,
            localUpdatedAtIso: null,
            syncing: false,
          }),
          syncing: true,
          remote: 'loading',
        },
      }));

      const local = readLocalState(entry.localStorageKey);

      let remoteStatus: DiagnosticState['remote'] = 'empty';
      let remoteKeys: string[] = [];
      let remoteUpdatedAt: string | null = null;
      let remoteUpdatedAtIso: string | null = null;

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_active_filters')
            .select('payload, updated_at')
            .eq('user_id', user.id)
            .eq('entity_type', entry.entityType)
            .maybeSingle();

          if (error) {
            remoteStatus = 'error';
          } else if (data?.payload) {
            const payload = data.payload as { filters?: Record<string, unknown> };
            remoteKeys = Object.keys(payload?.filters ?? {});
            remoteStatus = remoteKeys.length > 0 ? 'ok' : 'empty';
            remoteUpdatedAtIso = data.updated_at ? new Date(data.updated_at).toISOString() : null;
            remoteUpdatedAt = data.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : null;
          } else {
            remoteStatus = 'empty';
          }
        } catch (e) {
          logger.warn('[FiltrosSalvos] remote fetch failed', { entityType: entry.entityType, e });
          remoteStatus = 'error';
        }
      } else {
        remoteStatus = 'empty';
      }

      setDiagnostics((prev) => ({
        ...prev,
        [entry.entityType]: {
          entityType: entry.entityType,
          remote: remoteStatus,
          remoteUpdatedAt,
          remoteUpdatedAtIso,
          remoteKeys,
          local: local.status,
          localKeys: local.keys,
          localUpdatedAt: local.ts,
          localUpdatedAtIso: local.tsIso,
          syncing: false,
        },
      }));
    },
    [user?.id]
  );

  const refreshAll = useCallback(async () => {
    setGlobalSyncing(true);
    try {
      await Promise.all(CATALOG.map((entry) => refreshOne(entry)));
      toast.success('Diagnóstico atualizado', { description: `${CATALOG.length} telas verificadas.` });
    } finally {
      setGlobalSyncing(false);
    }
  }, [refreshOne]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        (e.localStorageKey ?? '').toLowerCase().includes(q)
    );
  }, [search]);

  const totals = useMemo(() => {
    const list = Object.values(diagnostics);
    const divergences = list.map((d) => computeDivergence(d).direction);
    return {
      total: CATALOG.length,
      remoteOk: list.filter((d) => d.remote === 'ok').length,
      localOk: list.filter((d) => d.local === 'ok').length,
      errors: list.filter((d) => d.remote === 'error').length,
      divergent: divergences.filter((dir) =>
        dir === 'remote-newer' || dir === 'remote-only' || dir === 'local-newer' || dir === 'local-only'
      ).length,
    };
  }, [diagnostics]);

  return (
    <MainLayout>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/configuracoes" aria-label="Voltar para Configurações">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-display">
                  Filtros salvos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Diagnóstico de hidratação por tela: Supabase (sua conta) e localStorage (este dispositivo).
                </p>
              </div>
            </div>
            <Button onClick={refreshAll} disabled={globalSyncing} className="gap-2">
              {globalSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Forçar sincronização
            </Button>
          </div>

          {/* Resumo */}
          <div className="grid gap-3 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Telas catalogadas</div>
                <div className="text-2xl font-bold mt-1">{totals.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" /> Sincronizadas (conta)
                </div>
                <div className="text-2xl font-bold mt-1 text-success">{totals.remoteOk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" /> Espelhadas (dispositivo)
                </div>
                <div className="text-2xl font-bold mt-1">{totals.localOk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowLeftRight className="h-3 w-3" /> Divergentes
                </div>
                <div className="text-2xl font-bold mt-1 text-warning">{totals.divergent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CloudOff className="h-3 w-3" /> Erros de leitura
                </div>
                <div className="text-2xl font-bold mt-1 text-destructive">{totals.errors}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Telas com filtros</CardTitle>
              <CardDescription>
                Cada linha mostra a entidade, a chave do localStorage e o status atual da hidratação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por entidade, área ou chave…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2">
                  {filteredCatalog.map((entry) => {
                    const diag = diagnostics[entry.entityType];
                    return (
                      <FilterRow
                        key={entry.entityType}
                        entry={entry}
                        diagnostic={diag}
                        onRefresh={() => refreshOne(entry)}
                      />
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhuma tela encontrada para “{search}”.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipProvider>
    </MainLayout>
  );
}

interface FilterRowProps {
  entry: FilterCatalogEntry;
  diagnostic?: DiagnosticState;
  onRefresh: () => void;
  userId?: string | null;
}

function FilterRow({ entry, diagnostic, onRefresh, userId }: FilterRowProps) {
  const remoteBadge = renderRemoteBadge(diagnostic?.remote);
  const localBadge = renderLocalBadge(diagnostic?.local);
  const divergence = computeDivergence(diagnostic);
  const divergenceBadge = renderDivergenceBadge(divergence);
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
          {
            user_id: userId,
            entity_type: entry.entityType,
            payload: { filters },
            updated_at: new Date().toISOString(),
          },
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
            {remoteBadge}
            {localBadge}
            {divergenceBadge}
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

function renderRemoteBadge(status?: DiagnosticState['remote']) {
  switch (status) {
    case 'ok':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success">
          <CheckCircle2 className="h-3 w-3" /> Conta
        </Badge>
      );
    case 'empty':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <Database className="h-3 w-3" /> Conta vazia
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-destructive/30 text-destructive">
          <XCircle className="h-3 w-3" /> Erro conta
        </Badge>
      );
    case 'loading':
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Conta…
        </Badge>
      );
  }
}

function renderLocalBadge(status?: DiagnosticState['local']) {
  switch (status) {
    case 'ok':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 text-primary">
          <HardDrive className="h-3 w-3" /> Local
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-destructive/30 text-destructive">
          <XCircle className="h-3 w-3" /> Erro local
        </Badge>
      );
    case 'empty':
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <HardDrive className="h-3 w-3" /> Local vazio
        </Badge>
      );
  }
}

/**
 * Renderiza um chip indicando se conta e dispositivo estão sincronizados
 * e, em caso negativo, em que direção a próxima reconciliação fluirá.
 *
 * - in-sync: tudo idêntico.
 * - remote-newer / remote-only: conta → dispositivo (próxima abertura puxa do Supabase).
 * - local-newer / local-only: dispositivo → conta (próximo save sobe pro Supabase).
 * - none: nada salvo em nenhum lugar.
 * - unknown: erro ou comparação inconclusiva.
 */
function renderDivergenceBadge(div: Divergence) {
  switch (div.direction) {
    case 'in-sync':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success">
              <CheckCircle2 className="h-3 w-3" /> Sincronizado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{div.reason}</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'remote-newer':
    case 'remote-only':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-warning/40 text-warning"
              aria-label="Divergente: conta mais recente que dispositivo"
            >
              <Database className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
              <HardDrive className="h-3 w-3" />
              Conta → Dispositivo
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium">Divergente</p>
            <p className="text-xs text-muted-foreground">{div.reason}</p>
            <p className="text-xs mt-1">
              Próxima abertura nesta tela hidratará do Supabase.
            </p>
          </TooltipContent>
        </Tooltip>
      );
    case 'local-newer':
    case 'local-only':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-primary/40 text-primary"
              aria-label="Divergente: dispositivo mais recente que conta"
            >
              <HardDrive className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
              <Database className="h-3 w-3" />
              Dispositivo → Conta
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium">Divergente</p>
            <p className="text-xs text-muted-foreground">{div.reason}</p>
            <p className="text-xs mt-1">
              Próximo salvamento sincronizará com a conta no Supabase.
            </p>
          </TooltipContent>
        </Tooltip>
      );
    case 'none':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <ArrowLeftRight className="h-3 w-3" /> Sem dados
        </Badge>
      );
    case 'unknown':
    default:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <ArrowLeftRight className="h-3 w-3" /> —
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{div.reason}</p>
          </TooltipContent>
        </Tooltip>
      );
  }
}
