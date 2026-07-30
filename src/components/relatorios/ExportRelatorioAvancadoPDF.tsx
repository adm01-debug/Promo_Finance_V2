import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/formatters';

interface AgingItem {
  cliente: string;
  total: number;
  ate30: number;
  de31a60: number;
  de61a90: number;
  acima90: number;
}

interface FluxoCaixaItem {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface DRELinha {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: string;
}

type ReportType = 'dre' | 'balanco' | 'fluxo' | 'aging';

interface ExportRelatorioAvancadoPDFProps {
  tipo: ReportType;
  empresa: string;
  periodo: string;
  linhasDRE?: DRELinha[];
  fluxoCaixa?: FluxoCaixaItem[];
  aging?: AgingItem[];
}

function addCorporateHeader(doc: jsPDF, empresa: string, titulo: string, periodo: string) {
  const w = doc.internal.pageSize.getWidth();

  // Brand bar
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, w, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROMO FINANCE', 14, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Financeiro Corporativo', 14, 22);

  // Report title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 14, 44);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Empresa: ${empresa}  |  Período: ${periodo}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 52);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 56, w - 14, 56);

  return 60; // startY
}

function addCorporateFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Promo Finance — Confidencial`, 14, h - 8);
    doc.text(`Página ${i} de ${pages}`, w - 14, h - 8, { align: 'right' });
  }
}

export function ExportRelatorioAvancadoPDF({
  tipo,
  empresa,
  periodo,
  linhasDRE,
  fluxoCaixa,
  aging,
}: ExportRelatorioAvancadoPDFProps) {
  const [exporting, setExporting] = useState(false);

  const tipoTitulos: Record<ReportType, string> = {
    dre: 'Demonstração do Resultado do Exercício (DRE)',
    balanco: 'Balanço Patrimonial',
    fluxo: 'Demonstração de Fluxo de Caixa',
    aging: 'Relatório de Aging de Inadimplência',
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const startY = addCorporateHeader(doc, empresa, tipoTitulos[tipo], periodo);

      if (tipo === 'aging' && aging) {
        autoTable(doc, {
          startY,
          head: [['Cliente', 'Até 30d', '31-60d', '61-90d', '+90d', 'Total']],
          body: aging.map(a => [
            a.cliente,
            formatCurrency(a.ate30),
            formatCurrency(a.de31a60),
            formatCurrency(a.de61a90),
            formatCurrency(a.acima90),
            formatCurrency(a.total),
          ]),
          foot: [[
            'TOTAL',
            formatCurrency(aging.reduce((s, a) => s + a.ate30, 0)),
            formatCurrency(aging.reduce((s, a) => s + a.de31a60, 0)),
            formatCurrency(aging.reduce((s, a) => s + a.de61a90, 0)),
            formatCurrency(aging.reduce((s, a) => s + a.acima90, 0)),
            formatCurrency(aging.reduce((s, a) => s + a.total, 0)),
          ]],
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
          footStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index >= 1) {
              const item = aging[data.row.index];
              if (item && data.column.index === 4 && item.acima90 > 0) {
                data.cell.styles.textColor = [180, 30, 30];
              }
            }
          },
          margin: { left: 14, right: 14 },
        });
      } else if ((tipo === 'dre' || tipo === 'balanco') && linhasDRE) {
        autoTable(doc, {
          startY,
          head: [['Código', 'Descrição', 'Valor (R$)', 'AV (%)']],
          body: linhasDRE.map(l => [
            l.codigo,
            (l.nivel > 0 ? '  '.repeat(l.nivel) : '') + l.descricao,
            formatCurrency(Math.abs(l.valor)),
            l.percentual.toFixed(1) + '%',
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 85 },
            2: { halign: 'right', cellWidth: 40 },
            3: { halign: 'right', cellWidth: 25 },
          },
          didParseCell: (data) => {
            if (data.section === 'body') {
              const linha = linhasDRE[data.row.index];
              if (linha?.nivel === 0) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [245, 245, 245];
              }
            }
          },
          margin: { left: 14, right: 14 },
        });
      } else if (tipo === 'fluxo' && fluxoCaixa) {
        autoTable(doc, {
          startY,
          head: [['Data', 'Receitas', 'Despesas', 'Saldo Projetado']],
          body: fluxoCaixa.map(f => [
            new Date(f.data).toLocaleDateString('pt-BR'),
            formatCurrency(f.receitas),
            formatCurrency(f.despesas),
            formatCurrency(f.saldo),
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              const item = fluxoCaixa[data.row.index];
              if (item && item.saldo < 0) {
                data.cell.styles.textColor = [180, 30, 30];
              }
            }
          },
          margin: { left: 14, right: 14 },
        });
      }

      addCorporateFooter(doc);
      doc.save(`${tipo.toUpperCase()}_${empresa.replace(/\s/g, '_')}_${periodo}.pdf`);
      toast.success(`Relatório ${tipoTitulos[tipo]} exportado!`);
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      PDF Corporativo
    </Button>
  );
}
