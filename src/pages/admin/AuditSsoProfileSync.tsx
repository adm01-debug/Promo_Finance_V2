import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { subDays } from 'date-fns';
import {
  useSsoProfileSyncEvents,
} from '@/hooks/useSsoProfileSyncEvents';
import { type SsoSyncFieldKey } from '@/hooks/useLastSsoProfileSync';
import { useSSOJitEvents } from '@/hooks/useSSOJitEvents';
import {
  FIELD_OPTIONS,
  KIND_OPTIONS,
  PRESETS,
  mapJit,
  mapProfileSync,
  type EventKindFilter,
  type UnifiedEvent,
} from './AuditSsoProfileSync.helpers';
import { StatsCards, UnifiedRow } from './AuditSsoProfileSync.parts';

export default function AuditSsoProfileSync() {
  const [fromIso, setFromIso] = useState<string>(subDays(new Date(), 30).toISOString());
  const [toIso, setToIso] = useState<string>(new Date().toISOString());
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<SsoSyncFieldKey | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<EventKindFilter>('all');
  const [search, setSearch] = useState('');

  const {
    data: psEvents = [],
    isLoading: psLoading,
    refetch: refetchPs,
    isFetching: psFetching,
  } = useSsoProfileSyncEvents({ fromIso, toIso });

  const fromDate = fromIso ? new Date(fromIso) : undefined;
  const toDate = toIso ? new Date(toIso) : undefined;
  const {
    data: jitEvents = [],
    isLoading: jitLoading,
    refetch: refetchJit,
    isFetching: jitFetching,
  } = useSSOJitEvents({ from: fromDate, to: toDate });

  const isLoading = psLoading || jitLoading;
  const isFetching = psFetching || jitFetching;

  const allUnified = useMemo<UnifiedEvent[]>(() => {
    const merged = [
      ...psEvents.map(mapProfileSync),
      ...jitEvents.map(mapJit),
    ];
    merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return merged;
  }, [psEvents, jitEvents]);

  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    allUnified.forEach((e) => {
      if (e.provider_nome) set.add(e.provider_nome);
    });
    return Array.from(set).sort();
  }, [allUnified]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allUnified.filter((e) => {
      if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
      if (providerFilter !== 'all' && e.provider_nome !== providerFilter) return false;
      // Filtro por campo só faz sentido em profile_sync. Quando ativo, esconde JIT.
      if (fieldFilter !== 'all') {
        if (e.kind !== 'profile_sync') return false;
        if (!e.fields_changed.includes(fieldFilter)) return false;
      }
      if (term) {
        const hay = [e.user_email, e.provider_nome, e.provider_tipo, e.role, e.matched_group]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [allUnified, kindFilter, providerFilter, fieldFilter, search]);

  const stats = useMemo(() => {
    const byField: Record<SsoSyncFieldKey, number> = {
      full_name: 0,
      avatar_url: 0,
      telefone: 0,
    };
    let jitCount = 0;
    let psCount = 0;
    filtered.forEach((e) => {
      if (e.kind === 'jit') jitCount++;
      else {
        psCount++;
        e.fields_changed.forEach((f) => {
          byField[f] = (byField[f] ?? 0) + 1;
        });
      }
    });
    return { total: filtered.length, jit: jitCount, profile_sync: psCount, byField };
  }, [filtered]);

  const applyPreset = (dias: number) => {
    setFromIso(subDays(new Date(), dias).toISOString());
    setToIso(new Date().toISOString());
  };

  const refetchAll = () => {
    refetchPs();
    refetchJit();
  };

  const fieldFilterDisabled = kindFilter === 'jit';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Auditoria de Sincronização SSO
            </h1>
            <p className="text-sm text-muted-foreground">
              Eventos de provisionamento (JIT) e sincronização de perfil via SSO.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* KPIs */}
        <StatsCards stats={stats} />

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tipo de evento</label>
                <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as EventKindFilter)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Início</label>
                <Input
                  type="date"
                  className="w-40"
                  value={fromIso ? fromIso.slice(0, 10) : ''}
                  onChange={(e) =>
                    setFromIso(e.target.value ? new Date(e.target.value).toISOString() : '')
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fim</label>
                <Input
                  type="date"
                  className="w-40"
                  value={toIso ? toIso.slice(0, 10) : ''}
                  onChange={(e) =>
                    setToIso(e.target.value ? new Date(e.target.value).toISOString() : '')
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Provider</label>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os providers</SelectItem>
                    {uniqueProviders.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Campo alterado{fieldFilterDisabled && ' (só Profile Sync)'}
                </label>
                <Select
                  value={fieldFilter}
                  onValueChange={(v) => setFieldFilter(v as SsoSyncFieldKey | 'all')}
                  disabled={fieldFilterDisabled}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground block mb-1">Busca</label>
                <Input
                  placeholder="email, provider, role, grupo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {PRESETS.map((p) => (
                  <Button
                    key={p.dias}
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset(p.dias)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum evento SSO encontrado para os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <UnifiedRow key={e.id} event={e} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
