// Sub-componentes da página AuditSsoProfileSync — extraídos para zerar max-lines.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Image as ImageIcon, Phone, RefreshCw, UserCircle, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { SSO_SYNC_FIELD_LABEL, type SsoSyncFieldKey } from '@/hooks/useLastSsoProfileSync';
import type { EventKind, UnifiedEvent } from './AuditSsoProfileSync.helpers';

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

export function StatsCards({ stats }: { stats: { total: number; jit: number; profile_sync: number; byField: Record<SsoSyncFieldKey, number> } }) {
  return (
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
  );
}

export function UnifiedRow({ event }: { event: UnifiedEvent }) {
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
