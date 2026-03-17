import { useState } from 'react';
import { FileText, Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ItemNFe {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface NotaFiscal {
  numero: string;
  serie: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  dataEmissao: string;
  cnpjEmitente: string;
  emitenteNome: string;
  cnpjDestinatario: string;
  destinatarioNome: string;
  destinatarioEndereco: string;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  valorDesconto: number;
  valorIPI: number;
  valorICMS: number;
  valorTotal: number;
  status: string;
  protocolo?: string;
  itens: ItemNFe[];
}

interface DANFEGeneratorProps {
  nota: NotaFiscal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DANFEGenerator({ nota, open, onOpenChange }: DANFEGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  if (!nota) return null;

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.rect(10, 10, pageWidth - 20, 25);
      doc.text('DANFE - Documento Auxiliar da Nota Fiscal Eletrônica', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`0 - ENTRADA / 1 - SAÍDA`, pageWidth / 2, 24, { align: 'center' });
      doc.text(`NF-e Nº ${nota.numero} | Série ${nota.serie}`, pageWidth / 2, 30, { align: 'center' });

      // Chave de acesso
      doc.rect(10, 38, pageWidth - 20, 12);
      doc.setFontSize(7);
      doc.text('CHAVE DE ACESSO', 14, 43);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(nota.chaveAcesso, pageWidth / 2, 47, { align: 'center' });

      // Protocolo
      doc.rect(10, 52, pageWidth - 20, 10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('PROTOCOLO DE AUTORIZAÇÃO DE USO', 14, 57);
      doc.setFont('helvetica', 'bold');
      doc.text(nota.protocolo || 'N/A', pageWidth / 2, 57, { align: 'center' });

      // Emitente
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 65, pageWidth - 20, 20);
      doc.text('EMITENTE', 14, 70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(nota.emitenteNome, 14, 76);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`CNPJ: ${nota.cnpjEmitente}`, 14, 81);
      doc.text(`Natureza: ${nota.naturezaOperacao}`, pageWidth / 2, 81);

      // Destinatário
      doc.rect(10, 88, pageWidth - 20, 20);
      doc.setFont('helvetica', 'normal');
      doc.text('DESTINATÁRIO/REMETENTE', 14, 93);
      doc.setFont('helvetica', 'bold');
      doc.text(nota.destinatarioNome, 14, 99);
      doc.setFont('helvetica', 'normal');
      doc.text(`CNPJ/CPF: ${nota.cnpjDestinatario}`, 14, 104);
      doc.text(nota.destinatarioEndereco, pageWidth / 2, 104);

      // Itens
      autoTable(doc, {
        startY: 112,
        head: [['Cód.', 'Descrição', 'NCM', 'CFOP', 'UN', 'Qtd', 'V.Unit', 'V.Total']],
        body: nota.itens.map(item => [
          item.codigo,
          item.descricao,
          item.ncm,
          item.cfop,
          item.unidade,
          item.quantidade.toString(),
          formatCurrency(item.valorUnitario),
          formatCurrency(item.valorTotal),
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 50 },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      });

      // Totais
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.rect(10, finalY + 2, pageWidth - 20, 25);
      doc.setFontSize(7);
      doc.text('CÁLCULO DO IMPOSTO', 14, finalY + 7);
      const col1 = 14; const col2 = 55; const col3 = 95; const col4 = 140;
      doc.text(`Base ICMS: ${formatCurrency(nota.valorProdutos)}`, col1, finalY + 13);
      doc.text(`Valor ICMS: ${formatCurrency(nota.valorICMS)}`, col2, finalY + 13);
      doc.text(`Valor IPI: ${formatCurrency(nota.valorIPI)}`, col3, finalY + 13);
      doc.text(`Frete: ${formatCurrency(nota.valorFrete)}`, col1, finalY + 19);
      doc.text(`Seguro: ${formatCurrency(nota.valorSeguro)}`, col2, finalY + 19);
      doc.text(`Desconto: ${formatCurrency(nota.valorDesconto)}`, col3, finalY + 19);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`TOTAL: ${formatCurrency(nota.valorTotal)}`, col4, finalY + 19);

      // Data
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Emissão: ${formatDate(nota.dataEmissao)}`, 14, finalY + 24);

      doc.save(`DANFE_${nota.numero}.pdf`);
      toast.success('DANFE gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar DANFE');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            DANFE - NF-e {nota.numero}
          </DialogTitle>
          <DialogDescription>Visualize e baixe o DANFE em PDF</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">{nota.emitenteNome}</p>
                <p className="text-sm text-muted-foreground">CNPJ: {nota.cnpjEmitente}</p>
              </div>
              <Badge variant={nota.status === 'autorizada' ? 'default' : 'destructive'}>{nota.status}</Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">NF-e:</span> {nota.numero}</div>
              <div><span className="text-muted-foreground">Série:</span> {nota.serie}</div>
              <div><span className="text-muted-foreground">Destinatário:</span> {nota.destinatarioNome}</div>
              <div><span className="text-muted-foreground">CNPJ:</span> {nota.cnpjDestinatario}</div>
            </div>
            <Separator />
            <div className="text-xs font-mono text-muted-foreground break-all">
              Chave: {nota.chaveAcesso}
            </div>
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-bold text-sm">{formatCurrency(nota.valorProdutos)}</p></div>
              <div><p className="text-xs text-muted-foreground">ICMS</p><p className="font-bold text-sm text-warning">{formatCurrency(nota.valorICMS)}</p></div>
              <div><p className="text-xs text-muted-foreground">IPI</p><p className="font-bold text-sm text-warning">{formatCurrency(nota.valorIPI)}</p></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-sm text-primary">{formatCurrency(nota.valorTotal)}</p></div>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Itens ({nota.itens.length}):</p>
              {nota.itens.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-border/30 last:border-0">
                  <span>{item.descricao}</span>
                  <span className="font-medium">{item.quantidade}x {formatCurrency(item.valorUnitario)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { generatePDF(); window.print(); }} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={generatePDF} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Baixar DANFE (PDF)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
