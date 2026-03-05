/**
 * PDF Generation Utilities
 * Generate PDF reports using jsPDF
 */

interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  logo?: string; // Base64 image
}

interface PDFTableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown) => string;
}

interface PDFSection {
  title?: string;
  content?: string;
  table?: {
    columns: PDFTableColumn[];
    data: Record<string, unknown>[];
  };
  spacing?: number;
}

const DEFAULT_OPTIONS: PDFOptions = {
  orientation: 'portrait',
  pageSize: 'a4',
  margins: { top: 40, right: 40, bottom: 40, left: 40 },
};

/**
 * Generate PDF document
 */
export async function generatePDF(
  sections: PDFSection[],
  options: PDFOptions = {}
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: 'pt',
    format: opts.pageSize,
  });

  // Set metadata
  if (opts.title) doc.setProperties({ title: opts.title });
  if (opts.author) doc.setProperties({ author: opts.author });
  if (opts.subject) doc.setProperties({ subject: opts.subject });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margins = opts.margins!;
  const contentWidth = pageWidth - margins.left - margins.right;

  let yPosition = margins.top;

  // Add logo if provided
  if (opts.logo) {
    try {
      doc.addImage(opts.logo, 'PNG', margins.left, yPosition, 100, 40);
      yPosition += 50;
    } catch (error) {
      console.warn('Failed to add logo:', error);
    }
  }

  // Add title
  if (opts.title) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(opts.title, margins.left, yPosition);
    yPosition += 30;
  }

  // Add sections
  for (const section of sections) {
    // Check if we need a new page
    if (yPosition > pageHeight - margins.bottom - 100) {
      doc.addPage();
      yPosition = margins.top;
    }

    // Section title
    if (section.title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margins.left, yPosition);
      yPosition += 20;
    }

    // Section content
    if (section.content) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(section.content, contentWidth);
      doc.text(lines, margins.left, yPosition);
      yPosition += lines.length * 14 + 10;
    }

    // Section table
    if (section.table) {
      const { columns, data } = section.table;

      const headers = columns.map((col) => col.header);
      const body = data.map((row) =>
        columns.map((col) => {
          const value = row[col.key];
          return col.formatter ? col.formatter(value) : String(value ?? '');
        })
      );

      (doc as any).autoTable({
        startY: yPosition,
        head: [headers],
        body,
        margin: { left: margins.left, right: margins.right },
        styles: {
          fontSize: 9,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: columns.reduce((acc, col, index) => {
          if (col.width) {
            acc[index] = { cellWidth: col.width };
          }
          if (col.align) {
            acc[index] = { ...acc[index], halign: col.align };
          }
          return acc;
        }, {} as Record<number, Record<string, unknown>>),
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Add spacing
    yPosition += section.spacing ?? 10;
  }

  // Add footer to all pages
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    
    // Page number
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
    
    // Date
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      margins.left,
      pageHeight - 20
    );
  }

  return doc.output('blob');
}

/**
 * Generate and download PDF
 */
export async function downloadPDF(
  sections: PDFSection[],
  filename: string,
  options: PDFOptions = {}
): Promise<void> {
  const blob = await generatePDF(sections, options);
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate financial report PDF
 */
export async function generateFinancialReportPDF(data: {
  title: string;
  period: string;
  company?: string;
  receitas: Array<{ descricao: string; valor: number; data: string }>;
  despesas: Array<{ descricao: string; valor: number; data: string }>;
}): Promise<Blob> {
  const formatCurrency = (value: unknown) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
      .format(value as number);

  const formatDate = (value: unknown) =>
    new Date(value as string).toLocaleDateString('pt-BR');

  const totalReceitas = data.receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = data.despesas.reduce((sum, d) => sum + d.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const sections: PDFSection[] = [
    {
      content: data.company ? `${data.company}\n${data.period}` : data.period,
      spacing: 20,
    },
    {
      title: 'Receitas',
      table: {
        columns: [
          { key: 'descricao', header: 'Descrição' },
          { key: 'data', header: 'Data', formatter: formatDate, width: 80 },
          { key: 'valor', header: 'Valor', formatter: formatCurrency, width: 100, align: 'right' },
        ],
        data: data.receitas,
      },
    },
    {
      content: `Total de Receitas: ${formatCurrency(totalReceitas)}`,
      spacing: 30,
    },
    {
      title: 'Despesas',
      table: {
        columns: [
          { key: 'descricao', header: 'Descrição' },
          { key: 'data', header: 'Data', formatter: formatDate, width: 80 },
          { key: 'valor', header: 'Valor', formatter: formatCurrency, width: 100, align: 'right' },
        ],
        data: data.despesas,
      },
    },
    {
      content: `Total de Despesas: ${formatCurrency(totalDespesas)}`,
      spacing: 30,
    },
    {
      title: 'Resumo',
      content: [
        `Receitas: ${formatCurrency(totalReceitas)}`,
        `Despesas: ${formatCurrency(totalDespesas)}`,
        `Saldo: ${formatCurrency(saldo)}`,
      ].join('\n'),
    },
  ];

  return generatePDF(sections, {
    title: data.title,
    author: data.company,
    subject: `Relatório Financeiro - ${data.period}`,
  });
}

/**
 * Generate invoice PDF (Boleto/Recibo)
 */
export async function generateInvoicePDF(data: {
  numero: string;
  data: string;
  vencimento: string;
  cliente: {
    nome: string;
    documento?: string;
    endereco?: string;
  };
  empresa: {
    nome: string;
    documento?: string;
    endereco?: string;
    logo?: string;
  };
  itens: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  observacoes?: string;
}): Promise<Blob> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO', pageWidth / 2, 30, { align: 'center' });

  // Número e data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${data.numero}`, 20, 50);
  doc.text(`Data: ${new Date(data.data).toLocaleDateString('pt-BR')}`, pageWidth - 20, 50, { align: 'right' });

  // Empresa
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa.nome, 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.empresa.documento) {
    doc.text(`CNPJ: ${data.empresa.documento}`, 20, 80);
  }
  if (data.empresa.endereco) {
    doc.text(data.empresa.endereco, 20, 90);
  }

  // Cliente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, 110);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente.nome, 20, 120);
  doc.setFontSize(10);
  if (data.cliente.documento) {
    doc.text(`CPF/CNPJ: ${data.cliente.documento}`, 20, 130);
  }
  if (data.cliente.endereco) {
    doc.text(data.cliente.endereco, 20, 140);
  }

  // Itens
  let yPos = 160;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição', 20, yPos);
  doc.text('Qtd', 120, yPos, { align: 'center' });
  doc.text('Valor Unit.', 150, yPos, { align: 'right' });
  doc.text('Total', pageWidth - 20, yPos, { align: 'right' });

  yPos += 5;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  let total = 0;

  for (const item of data.itens) {
    const itemTotal = item.quantidade * item.valorUnitario;
    total += itemTotal;

    doc.text(item.descricao.substring(0, 40), 20, yPos);
    doc.text(item.quantidade.toString(), 120, yPos, { align: 'center' });
    doc.text(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitario),
      150,
      yPos,
      { align: 'right' }
    );
    doc.text(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemTotal),
      pageWidth - 20,
      yPos,
      { align: 'right' }
    );

    yPos += 15;
  }

  // Total
  yPos += 5;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 120, yPos);
  doc.text(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total),
    pageWidth - 20,
    yPos,
    { align: 'right' }
  );

  // Vencimento
  yPos += 20;
  doc.setFontSize(10);
  doc.text(`Vencimento: ${new Date(data.vencimento).toLocaleDateString('pt-BR')}`, 20, yPos);

  // Observações
  if (data.observacoes) {
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.observacoes, pageWidth - 40);
    doc.text(lines, 20, yPos);
  }

  return doc.output('blob');
}

export type { PDFOptions, PDFSection, PDFTableColumn };
export default generatePDF;
