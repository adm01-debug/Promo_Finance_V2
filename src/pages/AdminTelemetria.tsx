import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, RefreshCw, Trash2, Download, FileText } from "lucide-react";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";
import { TelemetriaTable } from "./admin-telemetria/TelemetriaTable";
import { TelemetriaStatsCards } from "@/components/admin/telemetry/TelemetriaStatsCards";
import { TelemetriaFilters } from "@/components/admin/telemetry/TelemetriaFilters";
import { TelemetriaTopOffenders } from "@/components/admin/telemetry/TelemetriaTopOffenders";
import { toast } from "sonner";
import { format } from "date-fns";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  query_limit: number | null;
  query_offset: number | null;
  count_mode: string | null;
  severity: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
}

type SeverityFilter = "all" | "slow" | "very_slow" | "error";
type TimeFilter = "1h" | "6h" | "24h" | "7d" | "custom";

export default function AdminTelemetriaPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  const getTimeThreshold = (): { from: string; to: string } => {
    const now = new Date();
    const to = now.toISOString();

    if (timeFilter === "custom" && customDateFrom) {
      const fromDate = new Date(customDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = customDateTo ? new Date(customDateTo) : new Date();
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate.toISOString(), to: toDate.toISOString() };
    }

    switch (timeFilter) {
      case "1h": return { from: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), to };
      case "6h": return { from: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), to };
      case "24h": return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), to };
      case "7d": return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to };
      default: return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), to };
    }
  };

  const { data: rows = [], isLoading, refetch, isRefetching } = useQuery<TelemetryRow[]>({
    queryKey: ["query-telemetry", severityFilter, timeFilter, customDateFrom?.toISOString(), customDateTo?.toISOString()],
    queryFn: async () => {
      const { from, to } = getTimeThreshold();
      let query = supabase
        .from("query_telemetry" as any)
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(500);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TelemetryRow[]) || [];
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleCleanup = async () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("query_telemetry" as any)
      .delete()
      .lt("created_at", threshold);
    if (error) {
      toast.error("Erro ao limpar dados antigos");
    } else {
      toast.success("Dados com mais de 7 dias removidos");
      refetch();
    }
  };

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = [
      "Data/Hora", "Operação", "Tabela/RPC", "Duração (ms)", "Severidade",
      "Registros", "Limit", "Offset", "Count Mode", "Erro"
    ];

    const csvRows = rows.map(r => [
      new Date(r.created_at).toLocaleString("pt-BR"),
      r.operation,
      r.rpc_name || r.table_name || "-",
      r.duration_ms,
      r.severity,
      r.record_count ?? "-",
      r.query_limit ?? "-",
      r.query_offset ?? "-",
      r.count_mode ?? "-",
      `"${(r.error_message || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(";"), ...csvRows.map(row => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `telemetria_${format(new Date(), "yyyy-MM-dd")}_${timeFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} registros exportados para CSV`);
  };

  // ── Export PDF ──
  const handleExportPDF = async () => {
    if (rows.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const now = new Date();

      const periodLabels: Record<string, string> = {
        "1h": "Última hora", "6h": "Últimas 6h", "24h": "Últimas 24h",
        "7d": "Últimos 7 dias", "custom": "Período personalizado",
      };

      doc.setFontSize(16);
      doc.text("Telemetria de Queries — Banco Externo", 14, 15);
      doc.setFontSize(9);
      doc.text(
        `Exportado em ${now.toLocaleString("pt-BR")} · Período: ${periodLabels[timeFilter] || timeFilter} · ${rows.length} registros`,
        14, 22
      );

      const headers = ["Data/Hora", "Operação", "Tabela/RPC", "Duração", "Severidade", "Records", "Limit", "Offset", "Count", "Erro"];
      const body = rows.map(r => [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.operation,
        r.rpc_name || r.table_name || "-",
        formatDuration(r.duration_ms),
        r.severity === "very_slow" ? "Muito Lenta" : r.severity === "slow" ? "Lenta" : r.severity === "error" ? "Erro" : r.severity,
        r.record_count?.toString() ?? "-",
        r.query_limit?.toString() ?? "-",
        r.query_offset?.toString() ?? "-",
        r.count_mode ?? "-",
        (r.error_message || "-").substring(0, 60),
      ]);

      autoTable(doc, {
        head: [headers],
        body,
        startY: 28,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 37, 36], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 244] },
      });

      doc.save(`telemetria_${format(now, "yyyy-MM-dd")}_${timeFilter}.pdf`);
      toast.success("PDF exportado com sucesso");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
      console.error(e);
    }
  };

  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;

  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, {
      count: prev.count + 1,
      totalMs: prev.totalMs + r.duration_ms,
      maxMs: Math.max(prev.maxMs, r.duration_ms),
    });
  }
  const topOffenders = [...tableStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "very_slow":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">🔴 Muito Lenta</Badge>;
      case "slow":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[10px]">🟡 Lenta</Badge>;
      case "error":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">❌ Erro</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{severity}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Telemetria de Queries</h1>
              <p className="text-sm text-muted-foreground">Monitoramento de performance do banco externo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={rows.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={rows.length === 0}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleCleanup}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Limpar +7d
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <TelemetriaStatsCards
          verySlow={verySlow}
          slow={slow}
          errors={errors}
          avgDuration={avgDuration}
          formatDuration={formatDuration}
        />

        {/* Top Offenders */}
        <TelemetriaTopOffenders topOffenders={topOffenders} formatDuration={formatDuration} />

        {/* Charts */}
        <TelemetryCharts rows={rows} timeFilter={timeFilter} />

        {/* Filters */}
        <TelemetriaFilters
          severityFilter={severityFilter}
          timeFilter={timeFilter}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          rowCount={rows.length}
          onSeverityChange={setSeverityFilter}
          onTimeChange={setTimeFilter}
          onCustomDateFromChange={setCustomDateFrom}
          onCustomDateToChange={setCustomDateTo}
        />

        <TelemetriaTable rows={rows} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
}
