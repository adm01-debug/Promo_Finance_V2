import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import type { CentroCusto } from '@/hooks/useCentrosCusto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CentroCustoExportProps {
  centros: CentroCusto[];
}

export function CentroCustoExport({ centros }: CentroCustoExportProps) {
  const activeCentros = centros.filter(c => c.ativo);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    doc.setFontSize(16);
    doc.text('Relatório de Centros de Custo', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 14, 28);

    const totalOrcado = activeCentros.reduce((s, c) => s + c.orcamento_previsto, 0);
    const totalRealizado = activeCentros.reduce((s, c) => s + c.orcamento_realizado, 0);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Orçado: ${formatCurrency(totalOrcado)}`, 14, 38);
    doc.text(`Total Realizado: ${formatCurrency(totalRealizado)}`, 14, 45);
    doc.text(`Saldo: ${formatCurrency(totalOrcado - totalRealizado)}`, 14, 52);

    const rows = activeCentros.map(c => {
      const pct = c.orcamento_previsto > 0 ? ((c.orcamento_realizado / c.orcamento_previsto) * 100).toFixed(1) + '%' : '0%';
      return [c.codigo, c.nome, c.responsavel || '-', formatCurrency(c.orcamento_previsto), formatCurrency(c.orcamento_realizado), pct, formatCurrency(c.orcamento_previsto - c.orcamento_realizado)];
    });

    autoTable(doc, {
      startY: 60,
      head: [['Código', 'Nome', 'Responsável', 'Orçado', 'Realizado', '% Usado', 'Saldo']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 95, 46] },
    });

    doc.save('centros-de-custo.pdf');
    toast.success('PDF exportado com sucesso!');
  };

  const exportCSV = () => {
    const header = 'Código,Nome,Responsável,Descrição,Orçado,Realizado,% Usado,Saldo,Status\n';
    const rows = activeCentros.map(c => {
      const pct = c.orcamento_previsto > 0 ? ((c.orcamento_realizado / c.orcamento_previsto) * 100).toFixed(1) : '0';
      const saldo = c.orcamento_previsto - c.orcamento_realizado;
      return `"${c.codigo}","${c.nome}","${c.responsavel || ''}","${c.descricao || ''}",${c.orcamento_previsto},${c.orcamento_realizado},${pct}%,${saldo},${c.ativo ? 'Ativo' : 'Inativo'}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centros-de-custo.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="gap-2">
          <Table2 className="h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
