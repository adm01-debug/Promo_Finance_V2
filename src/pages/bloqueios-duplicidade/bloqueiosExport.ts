import { format } from "date-fns";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/formatters";
import type { BloqueioRow } from "./types";

export function exportCSV(bloqueios: BloqueioRow[] | undefined) {
  if (!bloqueios || bloqueios.length === 0) return;
  const headers = ["Data", "Usuário", "Tabela", "Motivo", "Valor Bloqueado", "Documento", "Tipo Match", "Campos Conflitantes"];
  const rows = bloqueios.map((b) => [
    format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
    b.perfil?.full_name || "Sistema",
    b.tabela,
    b.motivo_bloqueio,
    b.valor_bloqueado || 0,
    b.dados_tentativa?.numero_documento || "N/D",
    b.match_type || "exact",
    JSON.stringify(b.campos_conflitantes),
  ]);
  const csvContent = ["\ufeff" + headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `auditoria_duplicidade_${format(new Date(), "yyyy-MM-dd")}.csv`);
  toast.success("Relatório de auditoria exportado com sucesso!");
}

export function exportPDF(bloqueios: BloqueioRow[] | undefined, totalCount: number, totalValue: number) {
  if (!bloqueios || bloqueios.length === 0) return;
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Relatório de Auditoria de Duplicidade", 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
  doc.text(`Total de Bloqueios: ${totalCount}`, 14, 35);
  doc.text(`Total Economizado: ${formatCurrency(totalValue)}`, 14, 40);

  const tableData = bloqueios.map((b) => [
    format(new Date(b.created_at), "dd/MM/yy HH:mm"),
    b.perfil?.full_name || "Sistema",
    b.motivo_bloqueio,
    formatCurrency(b.valor_bloqueado || 0),
    b.dados_tentativa?.numero_documento || "N/D",
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Data", "Usuário", "Motivo", "Valor", "Doc"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [24, 95, 46], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8 },
  });

  doc.save(`auditoria_duplicidade_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  toast.success("Relatório PDF exportado com sucesso!");
}
