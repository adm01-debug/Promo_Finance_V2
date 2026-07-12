import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart,
} from 'recharts';
import { Download, DollarSign, Clock, MapPin, Package, TrendingUp, CheckCircle2, RotateCcw } from 'lucide-react';
import { useDeliveryReports, type DeliveryReportFilters } from '@/hooks/useDeliveryReports';
import { exportToCSV } from '@/lib/export-utils';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'MATCHED', 'ON_GOING', 'PICKED_UP', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const;
const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
const TAB_VALUES = ['custo', 'performance', 'geografia'] as const;
type TabValue = typeof TAB_VALUES[number];

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nfmt = (n: number, digits = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function getDefaultFilters(): DeliveryReportFilters {
  const today = new Date();
  const past = new Date(); past.setDate(past.getDate() - 30);
  return {
    from: past.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    status: 'ALL',
    customer: '',
    region: '',
  };
}

function parseFilters(sp: URLSearchParams): DeliveryReportFilters {
  const def = getDefaultFilters();
  const from = sp.get('from');
  const to = sp.get('to');
  const status = sp.get('status');
  return {
    from: from && ISO_DATE.test(from) ? from : def.from,
    to: to && ISO_DATE.test(to) ? to : def.to,
    status: status && (STATUS_OPTIONS as readonly string[]).includes(status) ? status : def.status,
    customer: sp.get('customer') ?? '',
    region: sp.get('region') ?? '',
  };
}

export default function RelatoriosEntregas() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = useMemo(() => parseFilters(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialTab = useMemo<TabValue>(() => {
    const t = searchParams.get('tab');
    return (TAB_VALUES as readonly string[]).includes(t ?? '') ? (t as TabValue) : 'custo';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState<DeliveryReportFilters>(initialFilters);
  const [tab, setTab] = useState<TabValue>(initialTab);

  // Sincroniza estado -> query string (replace para não poluir histórico)
  useEffect(() => {
    const def = getDefaultFilters();
    const next = new URLSearchParams();
    if (filters.from !== def.from) next.set('from', filters.from);
    if (filters.to !== def.to) next.set('to', filters.to);
    if (filters.status !== def.status) next.set('status', filters.status);
    if (filters.customer.trim()) next.set('customer', filters.customer.trim());
    if (filters.region.trim()) next.set('region', filters.region.trim());
    if (tab !== 'custo') next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [filters, tab, setSearchParams]);

  const resetFilters = useCallback(() => setFilters(getDefaultFilters()), []);

  const { data, isLoading, analytics, refetch, isFetching } = useDeliveryReports(filters);
  const kpis = analytics.kpis;

  const handleExport = () => {
    if (!data?.length) return;
    const columns = Object.keys(data[0]).map((k) => ({ key: k as keyof typeof data[0], header: k }));
    exportToCSV(data as unknown as Record<string, unknown>[], columns as never, `relatorio-entregas-${filters.from}_${filters.to}`);
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Relatórios de Entregas</h1>
          <p className="text-sm text-muted-foreground">Custo, performance e geografia com filtros avançados</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.length} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </header>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="from">Início</Label>
              <Input id="from" type="date" value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="to">Fim</Label>
              <Input id="to" type="date" value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'ALL' ? 'Todos' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <Input id="customer" placeholder="Nome do cliente"
                value={filters.customer} onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="region">Região</Label>
              <Input id="region" placeholder="Cidade, bairro, UF..."
                value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={resetFilters} disabled={isFetching}>
              <RotateCcw className="mr-2 h-4 w-4" /> Limpar
            </Button>
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Atualizando...' : 'Aplicar filtros'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={<Package className="h-4 w-4" />} label="Pedidos" value={nfmt(kpis.total)} loading={isLoading} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Concluídos" value={`${nfmt(kpis.completionRate, 1)}%`} loading={isLoading} />
        <KpiCard icon={<Clock className="h-4 w-4" />} label="No prazo" value={`${nfmt(kpis.onTimeRate, 1)}%`} loading={isLoading} />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Custo total" value={brl(kpis.totalCost)} loading={isLoading} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Ticket médio" value={brl(kpis.avgCost)} loading={isLoading} />
        <KpiCard icon={<MapPin className="h-4 w-4" />} label="R$/km" value={brl(kpis.costPerKm)} loading={isLoading} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="custo">Custo</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geografia">Geografia</TabsTrigger>
        </TabsList>

        {/* CUSTO */}
        <TabsContent value="custo" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Custo diário" loading={isLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={analytics.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, n) => n === 'cost' ? brl(v) : nfmt(v)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cost" name="Custo" fill="hsl(var(--primary))" />
                  <Line yAxisId="right" dataKey="orders" name="Pedidos" stroke="hsl(var(--warning))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Custo por veículo" loading={isLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.costByVehicle}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Bar dataKey="cost" name="Custo" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Top centros de custo" loading={isLoading}>
            <TableSimple
              rows={analytics.costByCostCenter}
              columns={[
                { key: 'key', label: 'Centro de custo' },
                { key: 'orders', label: 'Pedidos', align: 'right', render: (r) => nfmt(r.orders) },
                { key: 'cost', label: 'Custo total', align: 'right', render: (r) => brl(r.cost) },
              ]}
            />
          </ChartCard>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <KpiCard label="Atraso médio" value={`${nfmt(kpis.avgDelay, 1)} min`} loading={isLoading} icon={<Clock className="h-4 w-4" />} />
            <KpiCard label="Duração média" value={`${nfmt(kpis.avgDuration, 0)} min`} loading={isLoading} icon={<Clock className="h-4 w-4" />} />
            <KpiCard label="Cancelamentos" value={nfmt(kpis.cancelled)} loading={isLoading} icon={<Package className="h-4 w-4" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Atraso médio diário" loading={isLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${nfmt(v, 1)} min`} />
                  <Line dataKey="avgDelay" name="Atraso médio" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribuição por status" loading={isLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={analytics.statusDistribution} dataKey="value" nameKey="key" cx="50%" cy="50%" outerRadius={100} label>
                    {analytics.statusDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Top clientes por custo" loading={isLoading}>
            <TableSimple
              rows={analytics.topCustomers}
              columns={[
                { key: 'key', label: 'Cliente' },
                { key: 'orders', label: 'Pedidos', align: 'right', render: (r) => nfmt(r.orders) },
                { key: 'cost', label: 'Custo total', align: 'right', render: (r) => brl(r.cost) },
              ]}
            />
          </ChartCard>
        </TabsContent>

        {/* GEOGRAFIA */}
        <TabsContent value="geografia" className="space-y-4">
          <ChartCard title="Top 15 regiões por volume" loading={isLoading}>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={analytics.regionSeries} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="key" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="Pedidos" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Detalhamento por região" loading={isLoading}>
            <TableSimple
              rows={analytics.regionSeries}
              columns={[
                { key: 'key', label: 'Região' },
                { key: 'orders', label: 'Pedidos', align: 'right', render: (r) => nfmt(r.orders) },
                { key: 'cost', label: 'Custo total', align: 'right', render: (r) => brl(r.cost) },
                {
                  key: 'avgDelay', label: 'Atraso médio', align: 'right',
                  render: (r) => (
                    <Badge variant={r.avgDelay > 15 ? 'destructive' : r.avgDelay > 5 ? 'secondary' : 'default'}>
                      {nfmt(r.avgDelay, 1)} min
                    </Badge>
                  ),
                },
              ]}
            />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Sub-componentes ----------

interface KpiCardProps { label: string; value: string; loading: boolean; icon?: React.ReactNode }
function KpiCard({ label, value, loading, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs">{label}</span>
          {icon}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-24" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartCardProps { title: string; loading: boolean; children: React.ReactNode }
function ChartCard({ title, loading, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[280px] w-full" /> : children}
      </CardContent>
    </Card>
  );
}

interface Column<T> { key: keyof T | string; label: string; align?: 'left' | 'right'; render?: (row: T) => React.ReactNode }
function TableSimple<T extends Record<string, unknown>>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  if (!rows.length) return <p className="py-4 text-center text-sm text-muted-foreground">Sem dados no período</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {columns.map((c) => (
              <th key={String(c.key)} className={`py-2 pr-4 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
              {columns.map((c) => (
                <td key={String(c.key)} className={`py-2 pr-4 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(r) : String(r[c.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
