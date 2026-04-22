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

interface ResumoBalanco {
  totalAtivo: number;
  totalPassivo: number; // Passivo + PL
  equilibrado: boolean;
}

interface ResumoDRE {
  receitaLiquida?: number;
  lucroLiquido: number;
}

interface ExportDemonstrativoPDFProps {
  tipo: 'dre' | 'balanco' | 'fluxo';
  periodo: string;
  mes: number;
  ano: number;
  empresa: string;
  linhas: DRELinha[];
  resumoBalanco?: ResumoBalanco;
  resumoDRE?: ResumoDRE;
}

export function ExportDemonstrativoPDF({ tipo, periodo, mes, ano, empresa, linhas, resumoBalanco, resumoDRE }: ExportDemonstrativoPDFProps) {
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

      // Summary block (matches on-screen footer with green/red highlight)
      let tableStartY = 42;
      if (tipo === 'balanco' && resumoBalanco) {
        const diff = resumoBalanco.totalAtivo - resumoBalanco.totalPassivo;
        const ok = resumoBalanco.equilibrado;
        // Colors mirror the screen tokens: success (green) / destructive (red)
        const accent: [number, number, number] = ok ? [22, 163, 74] : [220, 38, 38];
        const bgTint: [number, number, number] = ok ? [240, 253, 244] : [254, 242, 242];

        const boxX = 10;
        const boxY = 42;
        const boxW = pageWidth - 20;
        const boxH = 26;

        doc.setFillColor(...bgTint);
        doc.setDrawColor(...accent);
        doc.setLineWidth(0.6);
        doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');
        doc.setLineWidth(0.2);

        // Status pill
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accent);
        doc.text(ok ? 'BALANÇO EQUILIBRADO' : 'BALANÇO DESEQUILIBRADO', boxX + 4, boxY + 7);

        // Three columns: Ativo | Passivo+PL | Diferença
        const colW = boxW / 3;
        const labelY = boxY + 14;
        const valueY = boxY + 22;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text('Ativo Total', boxX + 4, labelY);
        doc.text('Passivo + PL', boxX + colW + 4, labelY);
        doc.text('Diferença (Ativo − Passivo+PL)', boxX + 2 * colW + 4, labelY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(formatCurrency(resumoBalanco.totalAtivo), boxX + 4, valueY);
        doc.text(formatCurrency(resumoBalanco.totalPassivo), boxX + colW + 4, valueY);

        doc.setTextColor(...accent);
        const diffStr = `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}`;
        doc.text(diffStr, boxX + 2 * colW + 4, valueY);

        tableStartY = boxY + boxH + 6;
      } else if (tipo === 'dre' && resumoDRE) {
        const lucro = resumoDRE.lucroLiquido;
        const positivo = lucro >= 0;
        const accent: [number, number, number] = positivo ? [22, 163, 74] : [220, 38, 38];
        const bgTint: [number, number, number] = positivo ? [240, 253, 244] : [254, 242, 242];

        const boxX = 10;
        const boxY = 42;
        const boxW = pageWidth - 20;
        const boxH = 18;

        doc.setFillColor(...bgTint);
        doc.setDrawColor(...accent);
        doc.setLineWidth(0.6);
        doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');
        doc.setLineWidth(0.2);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accent);
        doc.text(positivo ? 'RESULTADO: LUCRO LÍQUIDO' : 'RESULTADO: PREJUÍZO LÍQUIDO', boxX + 4, boxY + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const valueStr = formatCurrency(Math.abs(lucro));
        doc.text(valueStr, boxX + boxW - 4, boxY + 13, { align: 'right' });

        tableStartY = boxY + boxH + 6;
      }

      // Table
      autoTable(doc, {
        startY: tableStartY,
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
