import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";
import type { ChartDatum, SparklineDatum, WeeklyRow } from "./types";

type SeverityFilter = "all" | "critical" | "warning" | "info";

export function useWeeklyTrendData(severityFilter: SeverityFilter) {
  const query = useQuery<WeeklyRow[]>({
    queryKey: ["performance-alerts-weekly", 12],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<WeeklyRow[]>(
        "get_performance_alerts_weekly",
        { p_weeks: 12 },
      );
      if (error) throw error;
      return (data as unknown as WeeklyRow[]) || [];
    },
    staleTime: 5 * 60_000,
  });

  const data = query.data ?? [];

  const weekKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) set.add(r.week_start);
    return Array.from(set).sort();
  }, [data]);

  const filteredData = useMemo(
    () =>
      severityFilter === "all"
        ? data
        : data.filter((r) => r.severity === severityFilter),
    [data, severityFilter],
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    const map = new Map<string, ChartDatum>();
    for (const r of filteredData) {
      const key = r.week_start;
      const label = new Date(r.week_start).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const entry =
        map.get(key) ?? { week: label, weekKey: key, critical: 0, warning: 0, info: 0 };
      if (r.severity === "critical") entry.critical += r.alert_count;
      else if (r.severity === "warning") entry.warning += r.alert_count;
      else entry.info += r.alert_count;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [filteredData]);

  const baseline = useMemo(() => {
    if (!chartData.length) return 0;
    const totals = chartData.map((d) => d.critical + d.warning + d.info);
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }, [chartData]);

  const sparklineBySource = useMemo<SparklineDatum[]>(() => {
    const bySource = new Map<string, Map<string, number>>();
    for (const r of filteredData) {
      if (!bySource.has(r.source)) bySource.set(r.source, new Map());
      const wk = bySource.get(r.source)!;
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

  const criticalTotal = useMemo(
    () =>
      data.reduce(
        (acc, r) => (r.severity === "critical" ? acc + r.alert_count : acc),
        0,
      ),
    [data],
  );

  return {
    data,
    isLoading: query.isLoading,
    filteredData,
    weekKeys,
    chartData,
    baseline,
    sparklineBySource,
    criticalTotal,
  };
}
