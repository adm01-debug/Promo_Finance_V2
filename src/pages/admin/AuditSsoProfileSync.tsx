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
import { RefreshCcw, ShieldCheck, UserCircle, Phone, Image as ImageIcon } from 'lucide-react';
import { subDays } from 'date-fns';
import { formatDate } from '@/lib/formatters';
import {
  useSsoProfileSyncEvents,
  type SsoProfileSyncEvent,
} from '@/hooks/useSsoProfileSyncEvents';
import { SSO_SYNC_FIELD_LABEL, type SsoSyncFieldKey } from '@/hooks/useLastSsoProfileSync';

const FIELD_OPTIONS: { value: SsoSyncFieldKey | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os campos' },
  { value: 'full_name', label: 'Nome completo' },
  { value: 'avatar_url', label: 'Foto de perfil' },
  { value: 'telefone', label: 'Telefone' },
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

export default function AuditSsoProfileSync() {
  const [fromIso, setFromIso] = useState<string>(subDays(new Date(), 30).toISOString());
  const [toIso, setToIso] = useState<string>(new Date().toISOString());
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<SsoSyncFieldKey | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading, refetch, isFetching } = useSsoProfileSyncEvents({
    fromIso,
    toIso,
  });

  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.provider_nome) set.add(e.provider_nome);
    });
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (providerFilter !== 'all' && e.provider_nome !== providerFilter) return false;
      if (fieldFilter !== 'all' && !e.fields_changed.includes(fieldFilter)) return false;
      if (term) {
        const hay = [e.user_email, e.provider_nome, e.provider_tipo, e.details]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [events, providerFilter, fieldFilter, search]);

  const stats = useMemo(() => {
    const byField: Record<SsoSyncFieldKey, number> = {
      full_name: 0,
      avatar_url: 0,
      telefone: 0,
    };
    filtered.forEach((e) =>
      e.fields_changed.forEach((f) => {
        byField[f] = (byField[f] ?? 0) + 1;
      }),
    );
    return { total: filtered.length, byField };
  }, [filtered]);

  const applyPreset = (dias: number) => {
    setFromIso(subDays(new Date(), dias).toISOString());
    setToIso(new Date().toISOString());
  };

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
              Acompanhe quais atributos do IdP estão sendo sincronizados ao perfil do usuário.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Eventos no período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
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
                <label className="text-xs text-muted-foreground block mb-1">Campo alterado</label>
                <Select
                  value={fieldFilter}
                  onValueChange={(v) => setFieldFilter(v as SsoSyncFieldKey | 'all')}
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
                  placeholder="email, provider, detalhe..."
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
            <CardTitle className="text-base">
              Eventos ({filtered.length})
            </CardTitle>
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
                Nenhum evento de sincronização SSO encontrado para os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Campos alterados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <SyncRow key={e.id} event={e} />
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

function SyncRow({ event }: { event: SsoProfileSyncEvent }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(event.created_at)}
      </TableCell>
      <TableCell className="text-sm">{event.user_email ?? '—'}</TableCell>
      <TableCell className="text-sm">{event.provider_nome ?? '—'}</TableCell>
      <TableCell>
        {event.provider_tipo ? (
          <Badge variant="outline" className="text-[11px] uppercase">
            {event.provider_tipo}
          </Badge>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  );
}
