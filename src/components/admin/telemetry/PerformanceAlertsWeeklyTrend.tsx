import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart, Download, Link2, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  type SeverityFilter,
  readSeverityFromLocation,
  readWeekFromLocation,
  buildUrlWithParams,
} from "./performance-alerts-deeplink";
import { useWeeklyTrendData } from "./weekly-trend/useWeeklyTrendData";
import { SparklineCards } from "./weekly-trend/SparklineCards";
import { TrendBarChart } from "./weekly-trend/TrendBarChart";
import { TrendTable } from "./weekly-trend/TrendTable";
import { WeekDetailDialog } from "./weekly-trend/WeekDetailDialog";
import { copyShareLink, exportCSV, exportPDF } from "./weekly-trend/exportUtils";

export function PerformanceAlertsWeeklyTrend() {
  const [selectedWeek, setSelectedWeekState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readWeekFromLocation(window.location.search);
  });
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>(() => {
    if (typeof window === "undefined") return "all";
    const stored = window.localStorage.getItem("perf-alerts-severity-filter");
    return readSeverityFromLocation(window.location.search, stored);
  });
  const chartRef = useRef<HTMLDivElement | null>(null);

  const {
    data, isLoading, filteredData, weekKeys, chartData, baseline,
    sparklineBySource, criticalTotal,
  } = useWeeklyTrendData(severityFilter);

  const setSelectedWeek = useCallback((wk: string | null) => {
    setSelectedWeekState(wk);
    try {
      const next = buildUrlWithParams(window.location.href, { week: wk });
      window.history.replaceState({}, "", next);
    } catch { /* history indisponível */ }
  }, []);

  const handleSeverityChange = useCallback((v: SeverityFilter) => {
    setSeverityFilter(v);
    try {
      window.localStorage.setItem("perf-alerts-severity-filter", v);
      const next = buildUrlWithParams(window.location.href, { severity: v });
      window.history.replaceState({}, "", next);
    } catch { /* storage/history indisponível */ }
  }, []);

  const handleResetFilters = useCallback(() => {
    setSeverityFilter("all");
    setSelectedWeek(null);
    try {
      window.localStorage.removeItem("perf-alerts-severity-filter");
      const url = new URL(window.location.href);
      url.searchParams.delete("severity");
      url.searchParams.delete("week");
      window.history.replaceState({}, "", url.toString());
    } catch { /* storage/history indisponível */ }
    toast.success("Filtros resetados");
  }, [setSelectedWeek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable) return;

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

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Tendência Semanal de Regressões (12 semanas)
          {criticalTotal > 0 && (
            <Badge
              variant="destructive"
              className="text-[10px] tabular-nums"
              aria-label={`${criticalTotal} alertas críticos nas últimas 12 semanas`}
              title="Total de alertas críticos (12 semanas)"
            >
              {criticalTotal} crítico{criticalTotal > 1 ? "s" : ""}
            </Badge>
          )}
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
            variant="ghost"
            onClick={handleResetFilters}
            disabled={severityFilter === "all" && !selectedWeek}
            className="h-8 gap-1.5"
            title="Resetar severidade e semana selecionada"
            aria-label="Resetar filtros"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={copyShareLink}
            className="h-8 gap-1.5"
            title="Copiar link com filtro e semana atuais"
            aria-label="Copiar link compartilhável"
          >
            <Link2 className="h-3.5 w-3.5" />
            Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCSV(filteredData)}
            disabled={isLoading || filteredData.length === 0}
            className="h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportPDF(filteredData, severityFilter, chartRef.current)}
            disabled={isLoading || filteredData.length === 0}
            className="h-8 gap-1.5"
            aria-label="Exportar PDF"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
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
            <SparklineCards items={sparklineBySource} />
            <TrendBarChart
              ref={chartRef}
              data={chartData}
              baseline={baseline}
              onSelectWeek={setSelectedWeek}
            />
            <TrendTable rows={filteredData} />
          </>
        )}
      </CardContent>

      <WeekDetailDialog
        selectedWeek={selectedWeek}
        onChange={setSelectedWeek}
        weekKeys={weekKeys}
        data={data}
      />
    </Card>
  );
}
