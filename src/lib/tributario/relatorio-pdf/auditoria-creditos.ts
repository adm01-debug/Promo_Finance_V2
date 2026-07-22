// Relatório de auditoria de créditos sugeridos.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt } from './shared';

export interface CreditoAuditoriaItem {
  ncm: string;
  cst_csosn: string;
  valor_credito_calculado: number;
  score_confianca?: number;
  status_aprovacao: string;
  metodologia_aplicada: string;
}

export function baixarRelatorioAuditoriaCreditos(
  empresaNome: string,
  creditos: CreditoAuditoriaItem[],
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE AUDITORIA DE CRÉDITOS', 14, 20);
  doc.setFontSize(10);
  doc.text(`EMPRESA: ${empresaNome}`, 14, 30);
  doc.text(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 50, 30);

  autoTable(doc, {
    startY: 50,
    head: [['NCM', 'CST', 'Valor Crédito', 'Score', 'Status', 'Metodologia']],
    body: creditos.map((c) => [
      c.ncm,
      c.cst_csosn,
      fmt(c.valor_credito_calculado),
      `${c.score_confianca || 100}%`,
      c.status_aprovacao.toUpperCase(),
      c.metodologia_aplicada,
    ]),
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
  });

  doc.save(`auditoria-creditos-${new Date().toISOString().slice(0, 10)}.pdf`);
}
