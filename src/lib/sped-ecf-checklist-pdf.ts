import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ChecklistItem, SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';

interface ExportArgs {
  data: SpedEcfValidacaoResult;
  cfcCriticos?: number;
  preValidacaoOk?: boolean;
}

const STATUS_LABEL: Record<ChecklistItem['status'], string> = {
  ok: 'OK',
  warn: 'Aviso',
  error: 'Erro',
};

export function exportChecklistEcfPdf({ data, cfcCriticos = 0, preValidacaoOk = true }: ExportArgs) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const generatedAt = new Date().toLocaleString('pt-BR');
  const erros = data.validacoes.erros.length;
  const avisos = data.validacoes.avisos.length;
  const ecd = data.ecd_referencia;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Checklist de validações — SPED ECF', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Gerado em: ${generatedAt}`, 14, 22);

  // Identificação
  autoTable(doc, {
    startY: 26,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Empresa', data.empresa.razao_social],
      ['CNPJ', data.empresa.cnpj],
      ['Período', `${data.periodo.inicio} → ${data.periodo.fim}`],
      ['Lançamentos', String(data.total_lancamentos)],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38, textColor: [80, 80, 80] } },
  });

  // KPIs
  // @ts-expect-error - jspdf-autotable lastAutoTable
  let cursor = (doc.lastAutoTable?.finalY ?? 50) + 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo de validação', 14, cursor);
  cursor += 2;
  autoTable(doc, {
    startY: cursor + 1,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    head: [['Indicador', 'Resultado']],
    body: [
      ['Erros (bloqueantes)', erros === 0 ? '0 — sem erros' : `${erros} erro(s) — geração bloqueada`],
      ['Avisos (toleráveis)', avisos === 0 ? '0' : `${avisos} aviso(s)`],
      ['Pré-validação SPED', preValidacaoOk ? 'OK' : 'Pendências críticas'],
      ['Pendências CFC críticas', cfcCriticos === 0 ? '0' : `${cfcCriticos}`],
      ['Liberado para gerar', erros === 0 && preValidacaoOk && cfcCriticos === 0 ? 'Sim' : 'Não'],
    ],
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } },
  });

  // ECD vinculada
  // @ts-expect-error
  cursor = (doc.lastAutoTable?.finalY ?? cursor) + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cross-check com ECD do período', 14, cursor);
  autoTable(doc, {
    startY: cursor + 2,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    head: [['Campo', 'Valor']],
    body: ecd
      ? [
          ['ECD localizada', 'Sim'],
          ['Status', ecd.status],
          ['Gerada em', new Date(ecd.created_at).toLocaleString('pt-BR')],
          ['Hash SHA-256 (ECD)', ecd.hash_sha256 || '—'],
          ['Recibo de transmissão (ECD)', ecd.recibo_transmissao || '—'],
        ]
      : [['ECD localizada', 'NÃO — gere e transmita a SPED ECD do mesmo período antes da ECF']],
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  });

  // Checklist detalhado
  // @ts-expect-error
  cursor = (doc.lastAutoTable?.finalY ?? cursor) + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Checklist detalhado', 14, cursor);
  autoTable(doc, {
    startY: cursor + 2,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2, valign: 'top' },
    head: [['Status', 'Verificação', 'Detalhe']],
    body: data.checklist.map((c) => [
      STATUS_LABEL[c.status],
      c.label,
      [c.detail, c.itens?.length ? `Itens: ${c.itens.slice(0, 8).join(', ')}${c.itens.length > 8 ? '…' : ''}` : '']
        .filter(Boolean)
        .join('\n'),
    ]),
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 70 },
    },
    didParseCell: (hook) => {
      if (hook.section === 'body' && hook.column.index === 0) {
        const v = String(hook.cell.raw);
        if (v === 'Erro') hook.cell.styles.textColor = [185, 28, 28];
        else if (v === 'Aviso') hook.cell.styles.textColor = [161, 98, 7];
        else if (v === 'OK') hook.cell.styles.textColor = [21, 128, 61];
      }
    },
  });

  // Listas de erros e avisos
  if (erros > 0) {
    // @ts-expect-error
    cursor = (doc.lastAutoTable?.finalY ?? cursor) + 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`Erros (${erros})`, 14, cursor);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: cursor + 2,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      body: data.validacoes.erros.map((e, i) => [`${String(i + 1).padStart(2, '0')}.`, e]),
      columnStyles: { 0: { cellWidth: 10, fontStyle: 'bold', textColor: [185, 28, 28] } },
    });
  }

  if (avisos > 0) {
    // @ts-expect-error
    cursor = (doc.lastAutoTable?.finalY ?? cursor) + 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text(`Avisos (${avisos})`, 14, cursor);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: cursor + 2,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      body: data.validacoes.avisos.map((a, i) => [`${String(i + 1).padStart(2, '0')}.`, a]),
      columnStyles: { 0: { cellWidth: 10, fontStyle: 'bold', textColor: [161, 98, 7] } },
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Checklist SPED ECF · ${data.empresa.cnpj} · página ${i}/${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  const cnpjSafe = data.empresa.cnpj.replace(/\D/g, '');
  const fileName = `checklist-ecf-${cnpjSafe}-${data.periodo.inicio}-${data.periodo.fim}.pdf`;
  doc.save(fileName);
  return fileName;
}
