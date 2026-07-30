import { useMemo } from 'react';
import { useSLOMetrics } from '@/hooks/useSLOMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Clock, Download, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function exportCSV(rows: ReturnType<typeof useSLOMetrics>['data']) {
  if (!rows?.length) return;
  const header = ['data', 'total_requisicoes', 'p50_ms', 'p95_ms', 'p99_ms', 'taxa_erro_pct', 'uptime_pct', 'cron_ok', 'cron_falha'];
  const lines = [header.join(',')];
  rows.forEach((r) => {
    lines.push([
      r.data,
      r.total_requisicoes,
      r.latencia_p50_ms,
      r.latencia_p95_ms,
      r.latencia_p99_ms,
      r.taxa_erro_pct,
      r.uptime_pct,
      r.cron_jobs_sucesso,
      r.cron_jobs_falha,
    ].join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slo_metrics_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SLOPanel() {
  const { data: metrics, isLoading } = useSLOMetrics(30);

  const resumo = useMemo(() => {
    const list = metrics ?? [];
    if (!list.length) return null;
    const last = list[list.length - 1];
    const avgUptime = list.reduce((s, r) => s + Number(r.uptime_pct || 0), 0) / list.length;
    return {
      uptime: Number(avgUptime.toFixed(2)),
      p95: last.latencia_p95_ms,
      taxaErro: Number(last.taxa_erro_pct),
      total: last.total_requisicoes,
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!metrics?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum snapshot SLO disponível ainda. O primeiro será gerado às 23:55.
        </CardContent>
      </Card>
    );
  }

  const chartData = metrics.map((m) => ({
    data: format(new Date(m.data), 'dd/MM', { locale: ptBR }),
    'p95 (ms)': m.latencia_p95_ms,
    'erro %': Number(m.taxa_erro_pct),
    'uptime %': Number(m.uptime_pct),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiSlo icon={<Activity className="h-4 w-4" />} label="Uptime médio (30d)" value={`${resumo?.uptime ?? 0}%`} ok={(resumo?.uptime ?? 0) >= 99} />
        <KpiSlo icon={<Clock className="h-4 w-4" />} label="Latência p95 hoje" value={`${resumo?.p95 ?? 0} ms`} ok={(resumo?.p95 ?? 0) < 3000} />
        <KpiSlo icon={<AlertTriangle className="h-4 w-4" />} label="Taxa de erro hoje" value={`${resumo?.taxaErro ?? 0}%`} ok={(resumo?.taxaErro ?? 0) < 1} />
        <KpiSlo icon={<Zap className="h-4 w-4" />} label="Requisições hoje" value={(resumo?.total ?? 0).toLocaleString('pt-BR')} ok />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="p95 (ms)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="erro %" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="uptime %" stroke="hsl(var(--chart-2, 142 70% 45%))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico detalhado</CardTitle>
          <Button variant="outline" size="sm" onClick={() => exportCSV(metrics)}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Req.</TableHead>
                <TableHead className="text-right">p50</TableHead>
                <TableHead className="text-right">p95</TableHead>
                <TableHead className="text-right">p99</TableHead>
                <TableHead className="text-right">Erro %</TableHead>
                <TableHead className="text-right">Uptime %</TableHead>
                <TableHead className="text-right">Cron OK/Falha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...metrics].reverse().map((m) => (
                <TableRow key={m.data}>
                  <TableCell className="font-medium">{format(new Date(m.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">{m.total_requisicoes.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{m.latencia_p50_ms} ms</TableCell>
                  <TableCell className="text-right">{m.latencia_p95_ms} ms</TableCell>
                  <TableCell className="text-right">{m.latencia_p99_ms} ms</TableCell>
                  <TableCell className="text-right">{Number(m.taxa_erro_pct).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{Number(m.uptime_pct).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{m.cron_jobs_sucesso}/{m.cron_jobs_falha}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiSlo({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${ok ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${ok ? 'text-muted-foreground' : 'text-destructive'}`}>{ok ? 'Dentro do SLO' : 'Atenção ao SLO'}</p>
      </CardContent>
    </Card>
  );
}
