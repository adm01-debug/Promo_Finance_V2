import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ShieldAlert, Info } from "lucide-react";
import { useState } from "react";

interface AlertRow {
  id: string;
  source: string;
  alert_key: string;
  alert_hour: string;
  severity: "critical" | "warning" | "info" | string;
  reason: string | null;
  current_value: number | null;
  baseline_value: number | null;
  ratio: number | null;
  sample_count: number | null;
  query_snippet: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function severityBadge(sev: string) {
  if (sev === "critical")
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
        <ShieldAlert className="h-3 w-3 mr-1" /> Crítico
      </Badge>
    );
  if (sev === "warning")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px]">
        <AlertTriangle className="h-3 w-3 mr-1" /> Aviso
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-[10px]">
      <Info className="h-3 w-3 mr-1" /> Info
    </Badge>
  );
}

export function PerformanceAlertsPanel() {
  const [days, setDays] = useState(1);

  const { data = [], isLoading, refetch, isRefetching } = useQuery<AlertRow[]>({
    queryKey: ["performance-alerts", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_performance_alerts" as any, {
        p_days: days,
        p_severity: null,
        p_source: null,
      });
      if (error) throw error;
      return ((data as unknown as AlertRow[]) || []).sort(
        (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
      );
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const counts = data.reduce(
    (acc, r) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Alertas de Performance</CardTitle>
          <div className="flex gap-1 ml-2">
            {counts.critical ? (
              <Badge variant="destructive" className="text-[10px]">
                {counts.critical} crítico{counts.critical > 1 ? "s" : ""}
              </Badge>
            ) : null}
            {counts.warning ? (
              <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 text-[10px]">
                {counts.warning} aviso{counts.warning > 1 ? "s" : ""}
              </Badge>
            ) : null}
            {counts.info ? (
              <Badge variant="secondary" className="text-[10px]">
                {counts.info} info
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs bg-background border rounded px-2 py-1"
          >
            <option value={1}>24h</option>
            <option value={3}>3 dias</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando alertas...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ Nenhum alerta de regressão detectado no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 font-medium">Severidade</th>
                  <th className="text-left py-2 font-medium">Origem</th>
                  <th className="text-left py-2 font-medium">Detalhe</th>
                  <th className="text-right py-2 font-medium">Atual</th>
                  <th className="text-right py-2 font-medium">Baseline</th>
                  <th className="text-right py-2 font-medium">Ratio</th>
                  <th className="text-right py-2 font-medium">Amostras</th>
                  <th className="text-right py-2 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((r, idx) => (
                  <tr key={`${r.source}-${r.alert_key}-${idx}`} className="border-b border-muted/40">
                    <td className="py-2">{severityBadge(r.severity)}</td>
                    <td className="py-2 text-muted-foreground">
                      {r.source === "pg_stat_statements" ? "pg_stat" : "telemetry"}
                    </td>
                    <td className="py-2 max-w-md">
                      <div className="truncate" title={r.reason || ""}>
                        {r.reason || r.alert_key}
                      </div>
                      {r.query_snippet ? (
                        <div
                          className="truncate text-muted-foreground/70 text-[10px] font-mono"
                          title={r.query_snippet}
                        >
                          {r.query_snippet}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.current_value != null ? `${Math.round(r.current_value)}ms` : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {r.baseline_value != null ? `${Math.round(r.baseline_value)}ms` : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.ratio != null ? `${Number(r.ratio).toFixed(2)}x` : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.sample_count ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground text-[10px]">{new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
