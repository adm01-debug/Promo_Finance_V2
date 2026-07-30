import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Activity } from "lucide-react";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  severity: string;
  created_at: string;
}

interface TelemetryChartsProps {
  rows: TelemetryRow[];
  timeFilter: string;
}

function formatBucketTime(ts: number, timeFilter: string): string {
  const d = new Date(ts);
  if (timeFilter === "7d") {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getBucketMs(timeFilter: string): number {
  switch (timeFilter) {
    case "1h": return 5 * 60 * 1000;       // 5 min
    case "6h": return 30 * 60 * 1000;      // 30 min
    case "24h": return 60 * 60 * 1000;     // 1 hora
    default: return 6 * 60 * 60 * 1000;    // 6 horas (7d/custom)
  }
}

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  // ── Chart 1: Stacked AreaChart — Alertas ao Longo do Tempo ──
  const alertTimeData = useMemo(() => {
    if (rows.length === 0) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { ts: number; muitoLentas: number; lentas: number; erros: number }>();

    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      const key = Math.floor(t / bucketMs) * bucketMs;
      const prev = buckets.get(key) || { ts: key, muitoLentas: 0, lentas: 0, erros: 0 };
      if (r.severity === "very_slow") prev.muitoLentas += 1;
      else if (r.severity === "slow") prev.lentas += 1;
      else if (r.severity === "error") prev.erros += 1;
      buckets.set(key, prev);
    }

    return [...buckets.values()]
      .sort((a, b) => a.ts - b.ts)
      .map(b => ({ ...b, label: formatBucketTime(b.ts, timeFilter) }));
  }, [rows, timeFilter]);

  // ── Chart 2: AreaChart — Duração Média / Máxima ──
  const durationTimeData = useMemo(() => {
    if (rows.length === 0) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { ts: number; totalMs: number; count: number; maxMs: number }>();

    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      const key = Math.floor(t / bucketMs) * bucketMs;
      const prev = buckets.get(key) || { ts: key, totalMs: 0, count: 0, maxMs: 0 };
      prev.totalMs += r.duration_ms;
      prev.count += 1;
      prev.maxMs = Math.max(prev.maxMs, r.duration_ms);
      buckets.set(key, prev);
    }

    return [...buckets.values()]
      .sort((a, b) => a.ts - b.ts)
      .map(b => ({
        label: formatBucketTime(b.ts, timeFilter),
        mediaMs: Math.round(b.totalMs / b.count),
        maxMs: b.maxMs,
      }));
  }, [rows, timeFilter]);

  // ── Chart 3: Horizontal BarChart — Alertas por Tabela ──
  const tableData = useMemo(() => {
    if (rows.length === 0) return [];
    const stats = new Map<string, number>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      stats.set(key, (stats.get(key) || 0) + 1);
    }
    return [...stats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [rows]);

  if (rows.length === 0) return null;

  const formatMs = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: Alertas ao Longo do Tempo (AreaChart empilhado) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Alertas ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={alertTimeData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <Area
                type="monotone" dataKey="muitoLentas" name="Muito Lentas"
                stackId="1" fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone" dataKey="lentas" name="Lentas"
                stackId="1" fill="hsl(45, 93%, 47%)" stroke="hsl(45, 93%, 47%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone" dataKey="erros" name="Erros"
                stackId="1" fill="hsl(0, 84%, 60%)" stroke="hsl(0, 84%, 60%)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Duração Média / Máxima (AreaChart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Duração Média / Máxima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={durationTimeData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatMs} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value: number) => [formatMs(value)]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <Area
                type="monotone" dataKey="maxMs" name="Máxima"
                fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))"
                fillOpacity={0.3}
              />
              <Area
                type="monotone" dataKey="mediaMs" name="Média"
                fill="hsl(var(--primary))" stroke="hsl(var(--primary))"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 3: Alertas por Tabela (BarChart horizontal) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Alertas por Tabela
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tableData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis
                type="category" dataKey="name" tick={{ fontSize: 9 }}
                width={100}
              />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Alertas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
