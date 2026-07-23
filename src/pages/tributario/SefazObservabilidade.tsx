import { useMemo } from 'react';
import { AlertTriangle, Activity, Check, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useResolveAlert, useSefazAlerts, useSefazObservability } from '@/hooks/useSefazObservability';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

function fmtSeconds(sec: number | null): string {
  if (sec === null || sec === undefined) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  return `${(sec / 3600).toFixed(1)}h`;
}

export default function SefazObservabilidade() {
  const cursors = useSefazObservability();
  const alerts = useSefazAlerts();

  const kpis = useMemo(() => {
    const rows = cursors.data ?? [];
    const open = alerts.data ?? [];
    return {
      total: rows.length,
      stuck: rows.filter((r) => (r.seconds_since_last ?? 0) > 6 * 3600).length,
      circuitOpen: rows.filter((r) => r.circuit_open).length,
      nfe24: rows.reduce((s, r) => s + Number(r.nfe_24h ?? 0), 0),
      alerts: open.length,
      critical: open.filter((a) => a.severity === 'critical').length,
    };
  }, [cursors.data, alerts.data]);

  const loading = cursors.isLoading || alerts.isLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Observabilidade SEFAZ
          </h1>
          <p className="text-sm text-muted-foreground">
            Cursores DFe, gaps de NSU e alertas de integridade em tempo real
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            cursors.refetch();
            alerts.refetch();
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Atualizar</span>
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Cursores" value={kpis.total} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Parados >6h" value={kpis.stuck} tone={kpis.stuck > 0 ? 'warning' : 'ok'} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Circuit open" value={kpis.circuitOpen} tone={kpis.circuitOpen > 0 ? 'danger' : 'ok'} icon={<Zap className="h-4 w-4" />} />
        <KpiCard label="NFe 24h" value={kpis.nfe24} icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="Alertas abertos" value={kpis.alerts} tone={kpis.alerts > 0 ? 'warning' : 'ok'} icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard label="Críticos" value={kpis.critical} tone={kpis.critical > 0 ? 'danger' : 'ok'} icon={<ShieldAlert className="h-4 w-4" />} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cursores DFe por CNPJ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CNPJ</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead className="text-right">Último NSU</TableHead>
                <TableHead>Última consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">NFe 24h</TableHead>
                <TableHead className="text-right">NFe 7d</TableHead>
                <TableHead className="text-right">Alertas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cursors.data ?? []).map((r) => (
                <TableRow key={`${r.cnpj}-${r.ambiente}`}>
                  <TableCell className="font-mono text-xs">{r.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.ambiente}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.ultimo_nsu ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.ultima_consulta
                      ? formatDistanceToNow(new Date(r.ultima_consulta), { addSuffix: true, locale: ptBR })
                      : 'nunca'}
                    {r.seconds_since_last !== null && (
                      <span className="ml-1 opacity-70">({fmtSeconds(r.seconds_since_last)})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.circuit_open ? (
                      <Badge variant="destructive">Circuit open</Badge>
                    ) : (
                      <Badge variant="secondary">{r.ultimo_status ?? 'ok'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{r.nfe_24h}</TableCell>
                  <TableCell className="text-right">{r.nfe_7d}</TableCell>
                  <TableCell className="text-right">
                    {r.open_alerts > 0 ? (
                      <Badge variant="destructive">{r.open_alerts}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(cursors.data ?? []).length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum cursor DFe configurado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Alertas de integridade em aberto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invariante</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Afetados</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(alerts.data ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.invariant}</TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[a.severity] ?? 'outline'}>{a.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-md truncate" title={a.reason}>
                    {a.reason}
                  </TableCell>
                  <TableCell className="text-right">{a.affected_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
              {(alerts.data ?? []).length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum alerta aberto — SEFAZ operando dentro dos invariantes ✅
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone = 'ok',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: 'ok' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{label}</span>
          {icon}
        </div>
        <div className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
