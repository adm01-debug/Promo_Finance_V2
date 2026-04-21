import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, CheckCircle, XCircle, Clock, Users, UserPlus } from 'lucide-react';
import { useSSOLoginAttempts, useSSOProviders, type SSOLoginAttempt } from '@/hooks/useSSO';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const isJitAttempt = (a: SSOLoginAttempt): boolean => {
  if (!a.success) return false;
  if (a.error_code === 'jit_provisioned') return true;
  const ctx = a.context as Record<string, unknown> | null | undefined;
  return ctx?.jit_created === true;
};

export function SSOMetricsPanel() {
  const { data: attempts, isLoading } = useSSOLoginAttempts(500);
  const { data: providers } = useSSOProviders();

  const stats = useMemo(() => {
    if (!attempts) return null;
    const last7 = attempts.filter(a => new Date(a.created_at) >= subDays(new Date(), 7));
    const successCount = last7.filter(a => a.success).length;
    const successRate = last7.length ? (successCount / last7.length) * 100 : 0;
    const uniqueUsers = new Set(last7.map(a => a.email).filter(Boolean)).size;
    const avgDuration = last7.filter(a => a.duration_ms).reduce((s, a) => s + (a.duration_ms ?? 0), 0) / Math.max(1, last7.filter(a => a.duration_ms).length);
    const jitCount = last7.filter(isJitAttempt).length;
    const jitRate = successCount ? (jitCount / successCount) * 100 : 0;

    const byDay: Record<string, { date: string; success: number; fail: number; jit: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      byDay[d] = { date: d, success: 0, fail: 0, jit: 0 };
    }
    last7.forEach(a => {
      const d = format(new Date(a.created_at), 'dd/MM');
      if (byDay[d]) {
        byDay[d][a.success ? 'success' : 'fail']++;
        if (isJitAttempt(a)) byDay[d].jit++;
      }
    });

    const byProvider: Record<string, number> = {};
    last7.forEach(a => {
      const name = providers?.find(p => p.id === a.provider_id)?.nome ?? 'Desconhecido';
      byProvider[name] = (byProvider[name] ?? 0) + 1;
    });

    return {
      total: last7.length,
      successCount,
      successRate,
      uniqueUsers,
      avgDuration,
      jitCount,
      jitRate,
      timeSeries: Object.values(byDay),
      byProvider: Object.entries(byProvider).map(([name, value]) => ({ name, value })),
      recent: attempts.slice(0, 20),
    };
  }, [attempts, providers]);

  if (isLoading || !stats) {
    return <div className="grid gap-4 md:grid-cols-5">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <KPI icon={<Activity className="h-4 w-4" />} label="Logins 7d" value={stats.total.toString()} />
        <KPI icon={<CheckCircle className="h-4 w-4 text-success" />} label="Taxa de sucesso" value={`${stats.successRate.toFixed(1)}%`} />
        <KPI icon={<Users className="h-4 w-4 text-primary" />} label="Usuários únicos" value={stats.uniqueUsers.toString()} />
        <KPI icon={<Clock className="h-4 w-4 text-accent" />} label="Latência média" value={stats.avgDuration ? `${Math.round(stats.avgDuration)}ms` : '—'} />
        <KPI
          icon={<UserPlus className="h-4 w-4 text-accent" />}
          label="Provisionamentos JIT"
          value={stats.jitCount.toString()}
          hint={stats.successCount ? `${stats.jitRate.toFixed(1)}% dos logins` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Logins SSO últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="hsl(var(--success))" name="Sucesso" strokeWidth={2} />
                <Line type="monotone" dataKey="fail" stroke="hsl(var(--destructive))" name="Falha" strokeWidth={2} />
                <Line type="monotone" dataKey="jit" stroke="hsl(var(--accent))" name="Provisionamentos JIT" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por provedor</CardTitle></CardHeader>
          <CardContent>
            {stats.byProvider.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.byProvider} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.byProvider.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">Sem dados ainda</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Últimas tentativas</CardTitle></CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tentativa registrada</p>
          ) : (
            <div className="space-y-2">
              {stats.recent.map(a => {
                const provName = providers?.find(p => p.id === a.provider_id)?.nome ?? '—';
                const jit = isJitAttempt(a);
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {a.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <span className="truncate font-mono text-xs">{a.email ?? '—'}</span>
                      <Badge variant="outline" className="text-xs">{provName}</Badge>
                      {jit && <Badge variant="secondary" className="text-xs gap-1"><UserPlus className="h-3 w-3" />JIT</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(a.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
