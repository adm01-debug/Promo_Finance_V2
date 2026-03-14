import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransacaoExport {
  descricao: string;
  data: Date | string;
  valor: number;
  tipo: string;
  status: string;
}

interface ConciliacaoExportProps {
  transacoes: TransacaoExport[];
  stats: {
    total: number;
    conciliadas: number;
    pendentes: number;
    percentual: number;
    valorConciliado: number;
    valorPendente: number;
  };
}

export function ConciliacaoExport({ transacoes, stats }: ConciliacaoExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = () => {
    setIsExporting(true);
    try {
      const data = transacoes.map(t => ({
        'Descrição': t.descricao,
        'Data': formatDate(t.data),
        'Valor': t.valor,
        'Tipo': t.tipo === 'credito' ? 'Crédito' : 'Débito',
        'Status': t.status === 'conciliada' ? 'Conciliada' : 'Pendente',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Conciliação');

      // Summary sheet
      const summaryData = [
        { 'Métrica': 'Total de Transações', 'Valor': stats.total },
        { 'Métrica': 'Conciliadas', 'Valor': stats.conciliadas },
        { 'Métrica': 'Pendentes', 'Valor': stats.pendentes },
        { 'Métrica': '% Conciliado', 'Valor': `${stats.percentual.toFixed(1)}%` },
        { 'Métrica': 'Valor Conciliado', 'Valor': formatCurrency(stats.valorConciliado) },
        { 'Métrica': 'Valor Pendente', 'Valor': formatCurrency(stats.valorPendente) },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

      XLSX.writeFile(wb, `conciliacao_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Relatório Excel exportado');
    } catch {
      toast.error('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Relatório de Conciliação Bancária', 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 28);

      // Summary
      doc.setFontSize(12);
      doc.text('Resumo', 14, 40);
      autoTable(doc, {
        startY: 44,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Transações', String(stats.total)],
          ['Conciliadas', String(stats.conciliadas)],
          ['Pendentes', String(stats.pendentes)],
          ['% Conciliado', `${stats.percentual.toFixed(1)}%`],
          ['Valor Conciliado', formatCurrency(stats.valorConciliado)],
          ['Valor Pendente', formatCurrency(stats.valorPendente)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Transactions table
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(12);
      doc.text('Transações', 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [['Descrição', 'Data', 'Valor', 'Tipo', 'Status']],
        body: transacoes.slice(0, 100).map(t => [
          t.descricao.slice(0, 40),
          formatDate(t.data),
          formatCurrency(t.valor),
          t.tipo === 'credito' ? 'Crédito' : 'Débito',
          t.status === 'conciliada' ? 'Conciliada' : 'Pendente',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
      });

      doc.save(`conciliacao_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Relatório PDF exportado');
    } catch {
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-success" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
