import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LineChart } from "lucide-react";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface WeeklyRow {
  week_start: string;
  source: string;
  severity: string;
  alert_count: number;
  distinct_keys: number;
  avg_current_ms: number | null;
  max_current_ms: number | null;
  avg_ratio: number | null;
  max_ratio: number | null;
  total_samples: number | null;
  delta_pct_vs_prev_week: number | null;
  refreshed_at: string;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-muted-foreground text-[10px]">—</span>;
  if (delta > 0) {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1">
        <TrendingUp className="h-3 w-3" /> +{delta.toFixed(1)}%
      </Badge>
    );
  }
  if (delta < 0) {
    return (
      <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px] gap-1">
        <TrendingDown className="h-3 w-3" /> {delta.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] gap-1">
      <Minus className="h-3 w-3" /> 0%
    </Badge>
  );
}

export function PerformanceAlertsWeeklyTrend() {
  const { data = [], isLoading } = useQuery<WeeklyRow[]>({
    queryKey: ["performance-alerts-weekly", 12],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_performance_alerts_weekly" as any, {
        p_weeks: 12,
      });
      if (error) throw error;
      return (data as unknown as WeeklyRow[]) || [];
    },
    staleTime: 5 * 60_000,
  });

  // Agrega por semana: {week, critical, warning, info}
  const chartData = useMemo(() => {
    const map = new Map<string, { week: string; critical: number; warning: number; info: number }>();
    for (const r of data) {
      const key = r.week_start;
      const label = new Date(r.week_start).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const entry = map.get(key) ?? { week: label, critical: 0, warning: 0, info: 0 };
      if (r.severity === "critical") entry.critical += r.alert_count;
      else if (r.severity === "warning") entry.warning += r.alert_count;
      else entry.info += r.alert_count;
      map.set(key, entry);
    }
    // Ordena crescente (semanas antigas → recentes) para o gráfico
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Tendência Semanal de Regressões (12 semanas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando tendências...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ Sem regressões registradas nas últimas 12 semanas.
          </p>
        ) : (
          <>
            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.4} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="critical" name="Crítico" stackId="a" fill="hsl(var(--destructive))" />
                  <Bar dataKey="warning" name="Aviso" stackId="a" fill="hsl(45 93% 47%)" />
                  <Bar dataKey="info" name="Info" stackId="a" fill="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">

            <table className="w-full text-xs">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 font-medium">Semana</th>
                  <th className="text-left py-2 font-medium">Origem</th>
                  <th className="text-left py-2 font-medium">Severidade</th>
                  <th className="text-right py-2 font-medium">Alertas</th>
                  <th className="text-right py-2 font-medium">Chaves únicas</th>
                  <th className="text-right py-2 font-medium">P95 médio</th>
                  <th className="text-right py-2 font-medium">Ratio máx</th>
                  <th className="text-right py-2 font-medium">Δ vs anterior</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 60).map((r, idx) => (
                  <tr key={`${r.week_start}-${r.source}-${r.severity}-${idx}`} className="border-b border-muted/40">
                    <td className="py-2 tabular-nums">
                      {new Date(r.week_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {r.source === "pg_stat_statements" ? "pg_stat" : "telemetry"}
                    </td>
                    <td className="py-2">
                      {r.severity === "critical" ? (
                        <Badge variant="destructive" className="text-[10px]">Crítico</Badge>
                      ) : r.severity === "warning" ? (
                        <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px]">Aviso</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Info</Badge>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.alert_count}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{r.distinct_keys}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.avg_current_ms != null ? `${Math.round(r.avg_current_ms)}ms` : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.max_ratio != null ? `${Number(r.max_ratio).toFixed(2)}x` : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <DeltaBadge delta={r.delta_pct_vs_prev_week} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
