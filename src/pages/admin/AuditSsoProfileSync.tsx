import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCcw,
  ShieldCheck,
  UserCircle,
  Phone,
  Image as ImageIcon,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { subDays } from 'date-fns';
import { formatDate } from '@/lib/formatters';
import {
  useSsoProfileSyncEvents,
  type SsoProfileSyncEvent,
} from '@/hooks/useSsoProfileSyncEvents';
import { SSO_SYNC_FIELD_LABEL, type SsoSyncFieldKey } from '@/hooks/useLastSsoProfileSync';
import { useSSOJitEvents, type JitAuditEvent } from '@/hooks/useSSOJitEvents';

type EventKind = 'jit' | 'profile_sync';
type EventKindFilter = 'all' | EventKind;

interface UnifiedEvent {
  id: string;
  kind: EventKind;
  created_at: string;
  user_email: string | null;
  provider_nome: string | null;
  provider_tipo: string | null;
  /** Para profile_sync: campos alterados. Para jit: vazio. */
  fields_changed: SsoSyncFieldKey[];
  /** Para jit: role atribuída. Para profile_sync: null. */
  role: string | null;
  /** Para jit: grupo que casou. Para profile_sync: null. */
  matched_group: string | null;
}

const FIELD_OPTIONS: { value: SsoSyncFieldKey | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os campos' },
  { value: 'full_name', label: 'Nome completo' },
  { value: 'avatar_url', label: 'Foto de perfil' },
  { value: 'telefone', label: 'Telefone' },
];

const KIND_OPTIONS: { value: EventKindFilter; label: string }[] = [
  { value: 'all', label: 'Todos os eventos' },
  { value: 'jit', label: 'JIT (provisionamento)' },
  { value: 'profile_sync', label: 'Sincronização de perfil' },
];

const PRESETS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
];

const FIELD_ICON: Record<SsoSyncFieldKey, JSX.Element> = {
  full_name: <UserCircle className="h-3 w-3" />,
  avatar_url: <ImageIcon className="h-3 w-3" />,
  telefone: <Phone className="h-3 w-3" />,
};

const KIND_META: Record<EventKind, { label: string; icon: JSX.Element; className: string }> = {
  jit: {
    label: 'JIT',
    icon: <UserPlus className="h-3 w-3" />,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  profile_sync: {
    label: 'Profile Sync',
    icon: <RefreshCw className="h-3 w-3" />,
    className: 'bg-secondary text-secondary-foreground border-border',
  },
};

function mapProfileSync(e: SsoProfileSyncEvent): UnifiedEvent {
  return {
    id: `ps-${e.id}`,
    kind: 'profile_sync',
    created_at: e.created_at,
    user_email: e.user_email,
    provider_nome: e.provider_nome,
    provider_tipo: e.provider_tipo,
    fields_changed: e.fields_changed,
    role: null,
    matched_group: null,
  };
}

function mapJit(e: JitAuditEvent): UnifiedEvent {
  return {
    id: `jit-${e.id}`,
    kind: 'jit',
    created_at: e.created_at,
    user_email: e.user_email,
    provider_nome: e.new_data?.provider_nome ?? null,
    provider_tipo: e.new_data?.provider_tipo ?? null,
    fields_changed: [],
    role: e.new_data?.role ?? null,
    matched_group: e.new_data?.matched_group ?? null,
  };
}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <UserPlus className="h-3 w-3" />
                JIT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.jit}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                Profile Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.profile_sync}</p>
            </CardContent>
          </Card>
          {(['full_name', 'avatar_url', 'telefone'] as SsoSyncFieldKey[]).map((f) => (
            <Card key={f}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  {FIELD_ICON[f]}
                  {SSO_SYNC_FIELD_LABEL[f]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.byField[f]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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

function UnifiedRow({ event }: { event: UnifiedEvent }) {
  const meta = KIND_META[event.kind];
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(event.created_at)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[11px] gap-1 ${meta.className}`}>
          {meta.icon}
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{event.user_email ?? '—'}</TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-2">
          <span>{event.provider_nome ?? '—'}</span>
          {event.provider_tipo && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {event.provider_tipo}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {event.kind === 'profile_sync' ? (
          <div className="flex flex-wrap gap-1">
            {event.fields_changed.length === 0 && (
              <span className="text-xs text-muted-foreground">(sem alterações)</span>
            )}
            {event.fields_changed.map((f) => (
              <Badge key={f} variant="secondary" className="text-[11px] gap-1">
                {FIELD_ICON[f]}
                {SSO_SYNC_FIELD_LABEL[f]}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 items-center text-xs">
            {event.role && (
              <Badge variant="secondary" className="text-[11px]">
                role: {event.role}
              </Badge>
            )}
            {event.matched_group && (
              <Badge variant="outline" className="text-[11px]">
                grupo: {event.matched_group}
              </Badge>
            )}
            {!event.role && !event.matched_group && (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
