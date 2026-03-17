import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/formatters';

interface DRELinha {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: string;
}

interface ExportDemonstrativoPDFProps {
  tipo: 'dre' | 'balanco' | 'fluxo';
  periodo: string;
  mes: number;
  ano: number;
  empresa: string;
  linhas: DRELinha[];
}

export function ExportDemonstrativoPDF({ tipo, periodo, mes, ano, empresa, linhas }: ExportDemonstrativoPDFProps) {
  const [exporting, setExporting] = useState(false);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const tipoLabels: Record<string, string> = {
    dre: 'Demonstração do Resultado do Exercício (DRE)',
    balanco: 'Balanço Patrimonial',
    fluxo: 'Demonstração de Fluxo de Caixa (DFC)',
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(tipoLabels[tipo] || tipo.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${empresa}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Período: ${meses[mes]} de ${ano}`, pageWidth / 2, 34, { align: 'center' });

      doc.setDrawColor(200);
      doc.line(10, 38, pageWidth - 10, 38);

      // Table
      autoTable(doc, {
        startY: 42,
        head: [['Código', 'Descrição', 'Valor (R$)', 'AV (%)']],
        body: linhas.map(l => [
          l.codigo,
          (l.nivel === 1 ? '  ' : '') + l.descricao,
          formatCurrency(Math.abs(l.valor)),
          l.percentual.toFixed(1) + '%',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [50, 50, 50], textColor: 255 },
        bodyStyles: { textColor: [30, 30, 30] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 85 },
          2: { halign: 'right', cellWidth: 40 },
          3: { halign: 'right', cellWidth: 25 },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const linha = linhas[data.row.index];
            if (linha && linha.nivel === 0) {
              data.cell.styles.fontStyle = 'bold';
            }
            if (linha && linha.codigo === '11') {
              data.cell.styles.fillColor = [230, 240, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 10, right: 10 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || 250;
      doc.setFontSize(7);
      doc.setTextColor(128);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Promo Finance`, pageWidth / 2, finalY + 10, { align: 'center' });

      doc.save(`${tipo.toUpperCase()}_${meses[mes]}_${ano}.pdf`);
      toast.success(`${tipoLabels[tipo]} exportado em PDF!`);
    } catch {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar PDF
    </Button>
  );
}
