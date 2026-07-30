import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ViewExportColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

interface ViewMeta {
  /** Filtros ativos (pares legíveis) */
  filtros?: Record<string, string | undefined | null>;
  /** Ordenação atual */
  ordenacao?: string;
  /** Período (texto) */
  periodo?: string;
}

interface ViewExportButtonProps<T> {
  filename: string;
  title: string;
  rows: T[];
  columns: ViewExportColumn<T>[];
  meta?: ViewMeta;
  /** Apenas colunas visíveis (já filtradas pelo chamador) */
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
}

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function buildMetaLines(meta?: ViewMeta): string[] {
  if (!meta) return [];
  const lines: string[] = [];
  if (meta.periodo) lines.push(`Período: ${meta.periodo}`);
  if (meta.ordenacao) lines.push(`Ordenação: ${meta.ordenacao}`);
  if (meta.filtros) {
    const ativos = Object.entries(meta.filtros)
      .filter(([, v]) => v && String(v).trim().length > 0)
      .map(([k, v]) => `${k}: ${v}`);
    if (ativos.length) lines.push(`Filtros: ${ativos.join(" | ")}`);
  }
  return lines;
}

export function ViewExportButton<T>({
  filename,
  title,
  rows,
  columns,
  meta,
  size = "sm",
  variant = "outline",
}: ViewExportButtonProps<T>) {
  const [busy, setBusy] = useState(false);

  const exportCsv = () => {
    setBusy(true);
    try {
      const generatedAt = new Date().toLocaleString("pt-BR");
      const metaLines = [
        `Relatório: ${title}`,
        `Gerado em: ${generatedAt}`,
        `Total de registros: ${rows.length}`,
        ...buildMetaLines(meta),
      ];
      const headerRow = columns.map((c) => escapeCsv(c.header)).join(";");
      const dataRows = rows.map((r) =>
        columns.map((c) => escapeCsv(c.accessor(r))).join(";"),
      );
      const csv =
        "\uFEFF" +
        [
          ...metaLines.map((l) => escapeCsv(l)),
          "",
          headerRow,
          ...dataRows,
        ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exportado para auditoria");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar CSV");
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = () => {
    setBusy(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text(title, 14, 16);
      doc.setFontSize(9);
      const generatedAt = new Date().toLocaleString("pt-BR");
      const metaLines = [
        `Gerado em: ${generatedAt}`,
        `Total de registros: ${rows.length}`,
        ...buildMetaLines(meta),
      ];
      metaLines.forEach((l, i) => doc.text(l, 14, 22 + i * 5));
      const startY = 22 + metaLines.length * 5 + 4;
      autoTable(doc, {
        startY,
        head: [columns.map((c) => c.header)],
        body: rows.map((r) =>
          columns.map((c) => {
            const v = c.accessor(r);
            return v === null || v === undefined ? "" : String(v);
          }),
        ),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
      doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exportado para auditoria");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5" disabled={busy}>
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Exportar visualização
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">
          Auditoria — visualização atual
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCsv} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-success" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPdf} className="gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
