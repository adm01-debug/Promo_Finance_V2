import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LineChart, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  type SeverityFilter,
  readSeverityFromLocation,
  readWeekFromLocation,
  buildUrlWithParams,
} from "./performance-alerts-deeplink";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LineChart as ReLineChart,
  Line,
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

  const [selectedWeek, setSelectedWeekState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readWeekFromLocation(window.location.search);
  });

  const setSelectedWeek = useCallback((wk: string | null) => {
    setSelectedWeekState(wk);
    try {
      const next = buildUrlWithParams(window.location.href, { week: wk });
      window.history.replaceState({}, "", next);
    } catch {
      /* history indisponível — ignora */
    }
  }, []);

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>(() => {
    if (typeof window === "undefined") return "all";
    const stored = window.localStorage.getItem("perf-alerts-severity-filter");
    return readSeverityFromLocation(window.location.search, stored);
  });

  const handleSeverityChange = useCallback((v: SeverityFilter) => {
    setSeverityFilter(v);
    try {
      window.localStorage.setItem("perf-alerts-severity-filter", v);
      const next = buildUrlWithParams(window.location.href, { severity: v });
      window.history.replaceState({}, "", next);
    } catch {
      /* storage/history indisponível — ignora */
    }
  }, []);

  // Semanas únicas ordenadas (crescente) — usada pela navegação ←/→ no dialog
  const weekKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) set.add(r.week_start);
    return Array.from(set).sort();
  }, [data]);

  // Hotkeys: 1-4 = severidade; ←/→ = navegar semanas no dialog. Ignora inputs/textarea/contenteditable.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable) return;

      // Navegação de semanas quando o dialog está aberto
      if (selectedWeek && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const idx = weekKeys.indexOf(selectedWeek);
        if (idx === -1) return;
        const nextIdx = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
        if (nextIdx >= 0 && nextIdx < weekKeys.length) {
          e.preventDefault();
          setSelectedWeek(weekKeys[nextIdx]);
        }
        return;
      }

      const map: Record<string, SeverityFilter> = { "1": "all", "2": "critical", "3": "warning", "4": "info" };
      const next = map[e.key];
      if (next) {
        e.preventDefault();
        handleSeverityChange(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSeverityChange, selectedWeek, weekKeys, setSelectedWeek]);

  const filteredData = useMemo(
    () => (severityFilter === "all" ? data : data.filter((r) => r.severity === severityFilter)),
    [data, severityFilter],
  );

  // Agrega por semana: {week, weekKey, critical, warning, info}
  const chartData = useMemo(() => {
    const map = new Map<string, { week: string; weekKey: string; critical: number; warning: number; info: number }>();
    for (const r of filteredData) {
      const key = r.week_start;
      const label = new Date(r.week_start).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const entry = map.get(key) ?? { week: label, weekKey: key, critical: 0, warning: 0, info: 0 };
      if (r.severity === "critical") entry.critical += r.alert_count;
      else if (r.severity === "warning") entry.warning += r.alert_count;
      else entry.info += r.alert_count;
      map.set(key, entry);
    }
    // Ordena crescente (semanas antigas → recentes) para o gráfico
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [filteredData]);

  const baseline = useMemo(() => {
    if (!chartData.length) return 0;
    const totals = chartData.map((d) => d.critical + d.warning + d.info);
    const sum = totals.reduce((a, b) => a + b, 0);
    return sum / totals.length;
  }, [chartData]);

  // Sparklines por origem (pg_stat vs telemetry) — respeitam filtro de severidade
  const sparklineBySource = useMemo(() => {
    const bySource = new Map<string, Map<string, number>>();
    for (const r of filteredData) {
      const src = r.source;
      if (!bySource.has(src)) bySource.set(src, new Map());
      const wk = bySource.get(src)!;
      wk.set(r.week_start, (wk.get(r.week_start) ?? 0) + r.alert_count);
    }
    return Array.from(bySource.entries()).map(([source, weeks]) => {
      const series = Array.from(weeks.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([week, count]) => ({ week, count }));
      const total = series.reduce((a, b) => a + b.count, 0);
      const last = series[series.length - 1]?.count ?? 0;
      const prev = series[series.length - 2]?.count ?? 0;
      const delta = prev > 0 ? ((last - prev) / prev) * 100 : null;
      return { source, series, total, last, delta };
    });
  }, [filteredData]);

  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = [
      "week_start","source","severity","alert_count","distinct_keys",
      "avg_current_ms","max_current_ms","avg_ratio","max_ratio","total_samples","delta_pct_vs_prev_week",
    ];
    const escape = (v: unknown) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filteredData.map((r) => headers.map((h) => escape((r as any)[h])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-alerts-weekly-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = useCallback(async () => {
    const href = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
      } else {
        // Fallback para contextos sem Clipboard API (http, iframes antigos)
        const ta = document.createElement("textarea");
        ta.value = href;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Link copiado", {
        description: "Filtro e semana selecionada preservados no link.",
      });
    } catch {
      toast.error("Não foi possível copiar o link", {
        description: "Copie manualmente da barra de endereço.",
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Tendência Semanal de Regressões (12 semanas)
        </CardTitle>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={severityFilter}
            onValueChange={(v) => v && handleSeverityChange(v as SeverityFilter)}
            className="h-8"
          >
            <ToggleGroupItem value="all" title="Atalho: 1" className="h-7 px-2 text-[11px]">Todos</ToggleGroupItem>
            <ToggleGroupItem value="critical" title="Atalho: 2" className="h-7 px-2 text-[11px]">Crítico</ToggleGroupItem>
            <ToggleGroupItem value="warning" title="Atalho: 3" className="h-7 px-2 text-[11px]">Aviso</ToggleGroupItem>
            <ToggleGroupItem value="info" title="Atalho: 4" className="h-7 px-2 text-[11px]">Info</ToggleGroupItem>
          </ToggleGroup>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            disabled={isLoading || filteredData.length === 0}
            className="h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
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
            {sparklineBySource.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {sparklineBySource.map((s) => {
                  const label = s.source === "pg_stat_statements" ? "pg_stat" : "telemetry";
                  const deltaColor =
                    s.delta == null
                      ? "text-muted-foreground"
                      : s.delta > 0
                        ? "text-destructive"
                        : s.delta < 0
                          ? "text-green-600"
                          : "text-muted-foreground";
                  return (
                    <div
                      key={s.source}
                      className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            {label}
                          </span>
                          <span className={`text-[10px] tabular-nums ${deltaColor}`}>
                            {s.delta == null
                              ? "—"
                              : `${s.delta > 0 ? "+" : ""}${s.delta.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold tabular-nums">{s.last}</span>
                          <span className="text-[10px] text-muted-foreground">últ. semana</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            total {s.total}
                          </span>
                        </div>
                      </div>
                      <div className="h-10 w-24 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart data={s.series} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="hsl(var(--primary))"
                              strokeWidth={1.5}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  onClick={(e: any) => {
                    const payload = e?.activePayload?.[0]?.payload;
                    if (payload?.weekKey) setSelectedWeek(payload.weekKey);
                  }}
                  style={{ cursor: "pointer" }}
                >
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
                  {baseline > 0 && (
                    <ReferenceLine
                      y={baseline}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      label={{
                        value: `média ${baseline.toFixed(1)}`,
                        position: "insideTopRight",
                        fill: "hsl(var(--primary))",
                        fontSize: 10,
                      }}
                    />
                  )}
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
                {filteredData.slice(0, 60).map((r, idx) => (
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

      <Dialog open={!!selectedWeek} onOpenChange={(o) => !o && setSelectedWeek(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>
                Detalhe da semana{" "}
                {selectedWeek
                  ? new Date(selectedWeek).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : ""}
              </span>
              {selectedWeek && (() => {
                const idx = weekKeys.indexOf(selectedWeek);
                const hasPrev = idx > 0;
                const hasNext = idx >= 0 && idx < weekKeys.length - 1;
                return (
                  <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      disabled={!hasPrev}
                      onClick={() => hasPrev && setSelectedWeek(weekKeys[idx - 1])}
                      title="Semana anterior (←)"
                      aria-label="Semana anterior"
                    >
                      ←
                    </Button>
                    <span className="tabular-nums px-1">
                      {idx + 1}/{weekKeys.length}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      disabled={!hasNext}
                      onClick={() => hasNext && setSelectedWeek(weekKeys[idx + 1])}
                      title="Próxima semana (→)"
                      aria-label="Próxima semana"
                    >
                      →
                    </Button>
                  </span>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground border-b sticky top-0 bg-background">
                <tr>
                  <th className="text-left py-2 font-medium">Origem</th>
                  <th className="text-left py-2 font-medium">Severidade</th>
                  <th className="text-right py-2 font-medium">Alertas</th>
                  <th className="text-right py-2 font-medium">Chaves</th>
                  <th className="text-right py-2 font-medium">P95 médio</th>
                  <th className="text-right py-2 font-medium">P95 máx</th>
                  <th className="text-right py-2 font-medium">Ratio máx</th>
                  <th className="text-right py-2 font-medium">Δ semana ant.</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((r) => r.week_start === selectedWeek)
                  .map((r, idx) => (
                    <tr key={idx} className="border-b border-muted/40">
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
                        {r.max_current_ms != null ? `${Math.round(r.max_current_ms)}ms` : "—"}
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
        </DialogContent>
      </Dialog>
    </Card>
  );
}
