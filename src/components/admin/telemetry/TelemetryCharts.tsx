import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(45, 93%, 47%)",
  "hsl(var(--accent))",
  "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 55%)",
];

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  const timeSeriesData = useMemo(() => {
    if (rows.length === 0) return [];
    const buckets = new Map<string, { label: string; count: number; avgMs: number; totalMs: number }>();
    
    for (const r of rows) {
      const d = new Date(r.created_at);
      let key: string;
      if (timeFilter === "1h" || timeFilter === "6h") {
        key = `${d.getHours().toString().padStart(2, "0")}:${(Math.floor(d.getMinutes() / 10) * 10).toString().padStart(2, "0")}`;
      } else {
        key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}h`;
      }
      const prev = buckets.get(key) || { label: key, count: 0, avgMs: 0, totalMs: 0 };
      prev.count += 1;
      prev.totalMs += r.duration_ms;
      prev.avgMs = Math.round(prev.totalMs / prev.count);
      buckets.set(key, prev);
    }
    return [...buckets.values()];
  }, [rows, timeFilter]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name: name === "very_slow" ? "Muito Lenta" : name === "slow" ? "Lenta" : name === "error" ? "Erro" : name, value }));
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Queries por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: number, name: string) => [
                  name === "avgMs" ? `${value}ms` : value,
                  name === "avgMs" ? "Média" : "Qtd",
                ]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Qtd" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribuição por Severidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {severityData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
