import { toast } from "sonner";
import type { WeeklyRow } from "./types";

export function exportCSV(filteredData: WeeklyRow[]) {
  if (!filteredData.length) return;
  const headers = [
    "week_start", "source", "severity", "alert_count", "distinct_keys",
    "avg_current_ms", "max_current_ms", "avg_ratio", "max_ratio",
    "total_samples", "delta_pct_vs_prev_week",
  ];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = filteredData.map((r) =>
    headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","),
  );
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
}

export async function exportPDF(
  filteredData: WeeklyRow[],
  severityFilter: string,
  chartEl: HTMLDivElement | null,
) {
  if (!filteredData.length) return;
  try {
    const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 40;

    doc.setFontSize(14);
    doc.text("Tendencia Semanal de Regressoes (12 semanas)", marginX, y);
    y += 16;
    doc.setFontSize(9);
    doc.setTextColor(120);
    const filterLabel =
      severityFilter === "all" ? "todas severidades" : `severidade: ${severityFilter}`;
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} | ${filterLabel} | ${filteredData.length} linhas`,
      marginX,
      y,
    );
    doc.setTextColor(0);
    y += 18;

    const totals = filteredData.reduce(
      (acc, r) => {
        if (r.severity === "critical") acc.critical += r.alert_count;
        else if (r.severity === "warning") acc.warning += r.alert_count;
        else acc.info += r.alert_count;
        return acc;
      },
      { critical: 0, warning: 0, info: 0 },
    );
    doc.setFontSize(10);
    doc.text(
      `Critico: ${totals.critical}   Aviso: ${totals.warning}   Info: ${totals.info}   Total: ${totals.critical + totals.warning + totals.info}`,
      marginX,
      y,
    );
    y += 18;

    if (chartEl) {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(chartEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const maxW = pageWidth - marginX * 2;
        const ratio = canvas.height / canvas.width;
        const imgW = maxW;
        const imgH = Math.min(220, imgW * ratio);
        doc.addImage(imgData, "PNG", marginX, y, imgW, imgH, undefined, "FAST");
        y += imgH + 16;
      } catch {
        /* segue sem imagem */
      }
    }

    const headers = ["Semana", "Origem", "Sev.", "Alertas", "Chaves", "P95 med", "Ratio max", "Δ %"];
    const colWidths = [70, 70, 55, 60, 60, 70, 70, 60];
    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, y - 10, pageWidth - marginX * 2, 14, "F");
    let x = marginX + 4;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });
    y += 8;
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 10;

    const rows = filteredData.slice(0, 200);
    for (const r of rows) {
      if (y > 540) {
        doc.addPage();
        y = 40;
      }
      const cells = [
        new Date(r.week_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        r.source === "pg_stat_statements" ? "pg_stat" : "telemetry",
        r.severity,
        String(r.alert_count),
        String(r.distinct_keys),
        r.avg_current_ms != null ? `${Math.round(r.avg_current_ms)}ms` : "-",
        r.max_ratio != null ? `${Number(r.max_ratio).toFixed(2)}x` : "-",
        r.delta_pct_vs_prev_week != null
          ? `${r.delta_pct_vs_prev_week > 0 ? "+" : ""}${r.delta_pct_vs_prev_week.toFixed(1)}%`
          : "-",
      ];
      x = marginX + 4;
      cells.forEach((c, i) => {
        doc.text(String(c), x, y);
        x += colWidths[i];
      });
      y += 14;
    }

    doc.save(`performance-alerts-weekly-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exportado");
  } catch (err) {
    toast.error("Falha ao gerar PDF", {
      description: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function copyShareLink() {
  const href = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(href);
    } else {
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
}
