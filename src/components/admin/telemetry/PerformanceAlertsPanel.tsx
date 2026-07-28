import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseDyn } from "@/lib/supabase-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ShieldAlert, Info, Radio, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  /** Preenchido quando o sintoma deixou de existir (ex.: automação voltou a rodar). */
  resolved_at: string | null;
  resolved_reason: string | null;
}


const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const SOURCE_LABELS: Record<string, string> = {
  pg_stat_statements: "pg_stat",
  query_telemetry: "telemetry",
  cron: "automação",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

/**
 * Alertas de origens distintas não compartilham unidade: telemetria mede
 * latência (ms), enquanto alertas de automação medem ocorrências ou horas.
 */
function formatMetric(source: string, alertKey: string, value: number | null): string {
  if (value == null) return "—";
  if (source !== "cron") return `${Math.round(value)}ms`;
  if (alertKey.startsWith("job_stale:")) return `${Number(value).toFixed(1)}h`;
  if (alertKey.startsWith("job_failed:")) return `${Math.round(value)}x`;
  return "—";
}


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
  const [incluirResolvidos, setIncluirResolvidos] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const queryClient = useQueryClient();

  const { data = [], isLoading, refetch, isRefetching } = useQuery<AlertRow[]>({
    queryKey: ["performance-alerts", days, incluirResolvidos],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<AlertRow[]>("get_performance_alerts", {
        p_days: days,
        p_severity: null,
        p_source: null,
        p_incluir_resolvidos: incluirResolvidos,
      });
      if (error) throw error;
      // Abertos primeiro; dentro de cada grupo, por severidade.
      return ((data as unknown as AlertRow[]) || []).sort((a, b) => {
        const resolvido = Number(Boolean(a.resolved_at)) - Number(Boolean(b.resolved_at));
        if (resolvido !== 0) return resolvido;
        return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      });
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });


  // Toast on new critical alerts (dedup by id across refetches)
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!data.length) return;
    if (seenIds.current === null) {
      // First load: prime cache silently, don't toast historical alerts
      seenIds.current = new Set(data.map((a) => a.id));
      return;
    }
    // Alerta já encerrado é histórico: nunca deve gerar notificação.
    const fresh = data.filter(
      (a) => a.severity === "critical" && !a.resolved_at && !seenIds.current!.has(a.id),
    );

    fresh.forEach((a) => {
      toast.error(`🚨 Regressão crítica detectada`, {
        description: a.reason || a.alert_key,
        duration: 10_000,
      });
      seenIds.current!.add(a.id);
    });
    // Also track non-critical to avoid re-toasting if severity changes
    data.forEach((a) => seenIds.current!.add(a.id));
  }, [data]);

  // Realtime: escuta INSERTs em performance_alerts para notificação instantânea
  useEffect(() => {
    const channel = supabase
      .channel("performance-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "performance_alerts" },
        (payload) => {
          const row = payload.new as Partial<AlertRow>;
          if (row?.severity === "critical") {
            toast.error("🚨 Regressão crítica em tempo real", {
              description: row.reason || row.alert_key || "Nova regressão detectada",
              duration: 12_000,
            });
          } else if (row?.severity === "warning") {
            toast.warning("⚠️ Novo aviso de performance", {
              description: row.reason || row.alert_key || "Aviso detectado",
              duration: 6_000,
            });
          }
          if (row?.id) seenIds.current?.add(row.id);
          queryClient.invalidateQueries({ queryKey: ["performance-alerts"] });
        },
      )
      .subscribe((status) => {
        setRealtimeOn(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  // Os contadores refletem apenas incidentes abertos — encerrados não pesam no topo.
  const counts = data.reduce(
    (acc, r) => {
      if (r.resolved_at) {
        acc.resolvidos = (acc.resolvidos || 0) + 1;
        return acc;
      }
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
          <Badge
            variant="outline"
            className={`text-[10px] gap-1 ${realtimeOn ? "border-green-500/40 text-green-600" : "border-muted text-muted-foreground"}`}
            title={realtimeOn ? "Realtime conectado" : "Realtime desconectado"}
          >
            <Radio className={`h-3 w-3 ${realtimeOn ? "animate-pulse" : ""}`} />
            {realtimeOn ? "Live" : "Offline"}
          </Badge>
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
            {counts.resolvidos ? (
              <Badge
                variant="outline"
                className="text-[10px] border-green-500/40 text-green-600"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> {counts.resolvidos} encerrado
                {counts.resolvidos > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={incluirResolvidos ? "secondary" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setIncluirResolvidos((v) => !v)}
            aria-pressed={incluirResolvidos}
          >
            {incluirResolvidos ? "Ocultar encerrados" : "Mostrar encerrados"}
          </Button>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs bg-background border rounded px-2 py-1"
            aria-label="Período dos alertas"
          >
            <option value={1}>24h</option>
            <option value={3}>3 dias</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Atualizar alertas"
          >
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
                  <tr
                    key={`${r.source}-${r.alert_key}-${idx}`}
                    className={`border-b border-muted/40 ${r.resolved_at ? "opacity-60" : ""}`}
                  >
                    <td className="py-2">
                      {r.resolved_at ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500/40 text-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Encerrado
                        </Badge>
                      ) : (
                        severityBadge(r.severity)
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {sourceLabel(r.source)}
                    </td>
                    <td className="py-2 max-w-md">
                      <div className="truncate" title={r.reason || ""}>
                        {r.reason || r.alert_key}
                      </div>
                      {r.resolved_reason ? (
                        <div
                          className="truncate text-green-600/80 text-[10px]"
                          title={r.resolved_reason}
                        >
                          {r.resolved_reason}
                        </div>
                      ) : null}
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
                      {formatMetric(r.source, r.alert_key, r.current_value)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatMetric(r.source, r.alert_key, r.baseline_value)}
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
