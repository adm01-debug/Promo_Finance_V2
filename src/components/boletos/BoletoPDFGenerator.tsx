import { useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface BoletoPDFGeneratorProps {
  boleto: {
    numero: string;
    banco: string;
    agencia: string;
    conta: string;
    cedente_nome: string;
    cedente_cnpj?: string | null;
    sacado_nome: string;
    sacado_cpf_cnpj?: string | null;
    valor: number;
    vencimento: string;
    descricao?: string | null;
    codigo_barras: string;
    linha_digitavel: string;
  };
  variant?: 'button' | 'icon';
}

export function BoletoPDFGenerator({ boleto, variant = 'button' }: BoletoPDFGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.rect(10, 10, pw - 20, 15);
      doc.text(`${boleto.banco}`, 14, 20);
      doc.text(`Boleto de Cobrança`, pw / 2, 20, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Ag: ${boleto.agencia} / Cc: ${boleto.conta}`, pw - 14, 20, { align: 'right' });

      // Cedente
      let y = 30;
      doc.rect(10, y, pw - 20, 22);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Beneficiário', 14, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(boleto.cedente_nome, 14, y + 11);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (boleto.cedente_cnpj) doc.text(`CNPJ: ${boleto.cedente_cnpj}`, 14, y + 17);

      doc.text('Nosso Número', pw - 60, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(boleto.numero, pw - 60, y + 11);

      // Sacado
      y = 55;
      doc.rect(10, y, pw - 20, 22);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Pagador', 14, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(boleto.sacado_nome, 14, y + 11);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (boleto.sacado_cpf_cnpj) doc.text(`CPF/CNPJ: ${boleto.sacado_cpf_cnpj}`, 14, y + 17);

      // Valores
      y = 80;
      doc.rect(10, y, pw - 20, 30);
      const col = [14, 55, 100, 150];
      doc.setFontSize(7);
      doc.text('Vencimento', col[0], y + 5);
      doc.text('Valor do Documento', col[1], y + 5);
      doc.text('Desconto', col[2], y + 5);
      doc.text('(=) Valor Cobrado', col[3], y + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(formatDate(boleto.vencimento), col[0], y + 13);
      doc.text(formatCurrency(boleto.valor), col[1], y + 13);
      doc.setFontSize(8);
      doc.text('R$ 0,00', col[2], y + 13);
      doc.setFontSize(11);
      doc.text(formatCurrency(boleto.valor), col[3], y + 13);

      if (boleto.descricao) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Descrição: ${boleto.descricao}`, 14, y + 22);
      }

      // Linha digitável
      y = 115;
      doc.rect(10, y, pw - 20, 15);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Linha Digitável', 14, y + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(boleto.linha_digitavel, pw / 2, y + 12, { align: 'center' });

      // Barcode visual
      y = 135;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Código de Barras', 14, y);
      const barY = y + 3;
      const barHeight = 25;
      boleto.codigo_barras.split('').forEach((d, i) => {
        const w = parseInt(d) % 2 === 0 ? 0.3 : 0.6;
        doc.setFillColor(0, 0, 0);
        doc.rect(14 + (i * 0.8), barY, w, barHeight, 'F');
      });

      // Footer
      doc.setFontSize(6);
      doc.setTextColor(128);
      doc.text('Autenticação Mecânica - Ficha de Compensação', pw / 2, 280, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Promo Finance`, pw / 2, 285, { align: 'center' });

      doc.save(`Boleto_${boleto.numero}.pdf`);
      toast.success('Boleto PDF gerado!');
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Button size="icon" variant="ghost" onClick={generatePDF} disabled={generating} title="Gerar PDF do Boleto">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={generatePDF} disabled={generating} className="gap-2">
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      Imprimir Boleto
    </Button>
  );
}
