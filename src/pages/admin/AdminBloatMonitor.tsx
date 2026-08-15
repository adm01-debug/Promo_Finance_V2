import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Database, HardDrive, RefreshCw, Search, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface BloatRow {
  schemaname: string;
  table_name: string;
  live_rows: number;
  dead_rows: number;
  dead_ratio_pct: number;
  total_size_pretty: string;
  total_size_bytes: number;
  table_size_pretty: string;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  last_autoanalyze: string | null;
  vacuum_count: number;
  autovacuum_count: number;
  analyze_count: number;
  autoanalyze_count: number;
}

interface HistoryRow {
  id: string;
  table_name: string;
  dead_ratio_pct: number;
  severity: string;
  details: string | null;
  created_at: string;
}

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

function severityBadge(sev: string) {
  if (sev === "critical") return <Badge className="bg-destructive/20 text-destructive border-destructive/30">🔴 Crítico</Badge>;
  if (sev === "warning") return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">🟡 Atenção</Badge>;
  return <Badge variant="secondary">{sev}</Badge>;
}

function ratioBadge(pct: number) {
  if (pct >= 40) return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{pct}%</Badge>;
  if (pct >= 20) return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">{pct}%</Badge>;
  return <Badge variant="secondary">{pct}%</Badge>;
}

export default function AdminBloatMonitor() {
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");

  const bloatQ = useQuery({
    queryKey: ["admin-bloat-current"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_table_bloat");
      if (error) throw error;
      return (data ?? []) as BloatRow[];
    },
    staleTime: 60_000,
  });

  const histQ = useQuery({
    queryKey: ["admin-bloat-history", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_bloat_history", { p_days: Number(days) });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
    staleTime: 60_000,
  });

  const rows = useMemo(() => bloatQ.data ?? [], [bloatQ.data]);
  const hist = useMemo(() => histQ.data ?? [], [histQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => r.table_name.toLowerCase().includes(q));
  }, [rows, search]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const critical = rows.filter(r => Number(r.dead_ratio_pct) >= 40).length;
    const warning = rows.filter(r => {
      const p = Number(r.dead_ratio_pct);
      return p >= 20 && p < 40;
    }).length;
    const totalBytes = rows.reduce((s, r) => s + Number(r.total_size_bytes || 0), 0);
    const gb = totalBytes / (1024 ** 3);
    return { total, critical, warning, sizeLabel: gb >= 1 ? `${gb.toFixed(2)} GB` : `${(totalBytes / (1024 ** 2)).toFixed(1)} MB` };
  }, [rows]);

  const chartData = useMemo(() => {
    // Agrupa histórico por dia + severidade
    const map = new Map<string, { day: string; critical: number; warning: number; info: number }>();
    for (const h of hist) {
      const d = new Date(h.created_at);
      const key = d.toISOString().slice(0, 10);
      const bucket = map.get(key) || { day: key, critical: 0, warning: 0, info: 0 };
      if (h.severity === "critical") bucket.critical += 1;
      else if (h.severity === "warning") bucket.warning += 1;
      else bucket.info += 1;
      map.set(key, bucket);
    }
    return [...map.values()]
      .sort((a, b) => a.day.localeCompare(b.day))
      .map(b => ({
        ...b,
        label: new Date(b.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));
  }, [hist]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Monitor de Bloat
          </h1>
          <p className="text-sm text-muted-foreground">
            Estado atual (v_table_bloat) e histórico do job diário monitor_table_bloat.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { bloatQ.refetch(); histQ.refetch(); }}
          disabled={bloatQ.isFetching || histQ.isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${bloatQ.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tabelas monitoradas</p>
            <p className="text-2xl font-bold tabular-nums">{bloatQ.isLoading ? "—" : kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Críticas (≥40%)
            </p>
            <p className="text-2xl font-bold text-destructive tabular-nums">{bloatQ.isLoading ? "—" : kpis.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Atenção (20–39%)</p>
            <p className="text-2xl font-bold text-yellow-600 tabular-nums">{bloatQ.isLoading ? "—" : kpis.warning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Tamanho total
            </p>
            <p className="text-2xl font-bold tabular-nums">{bloatQ.isLoading ? "—" : kpis.sizeLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Histórico de alertas (monitor_table_bloat)
          </CardTitle>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {histQ.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum alerta de bloat registrado no período — 🎉 o sistema está saudável.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="critical" name="Crítico" stackId="1"
                  stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="warning" name="Atenção" stackId="1"
                  stroke="hsl(45, 93%, 47%)" fill="hsl(45, 93%, 47%)" fillOpacity={0.6} />
                <Area type="monotone" dataKey="info" name="Info" stackId="1"
                  stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela estado atual */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
          <CardTitle className="text-sm">Estado atual das tabelas</CardTitle>
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar tabela..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {bloatQ.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhuma tabela encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Tabela</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Linhas vivas</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Linhas mortas</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">% Bloat</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Tamanho</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Último autovacuum</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Vacuum #</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.table_name} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{r.table_name}</td>
                      <td className="p-3 text-right tabular-nums">{Number(r.live_rows).toLocaleString("pt-BR")}</td>
                      <td className="p-3 text-right tabular-nums">{Number(r.dead_rows).toLocaleString("pt-BR")}</td>
                      <td className="p-3 text-right">{ratioBadge(Number(r.dead_ratio_pct))}</td>
                      <td className="p-3 text-right tabular-nums text-xs">{r.total_size_pretty}</td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(r.last_autovacuum || r.last_vacuum)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-xs">
                        {Number(r.autovacuum_count) + Number(r.vacuum_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Últimos alertas — lista */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Últimos alertas registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {histQ.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : hist.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum registro em query_telemetry para operation = 'bloat_monitor'.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Quando</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Tabela</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">% Bloat</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Severidade</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {hist.slice(0, 200).map((h) => (
                    <tr key={h.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{fmtDate(h.created_at)}</td>
                      <td className="p-3 font-mono text-xs">{h.table_name}</td>
                      <td className="p-3 text-right">{ratioBadge(Number(h.dead_ratio_pct))}</td>
                      <td className="p-3">{severityBadge(h.severity)}</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-md truncate">{h.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
