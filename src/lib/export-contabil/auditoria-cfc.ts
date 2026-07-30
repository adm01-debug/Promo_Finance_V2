import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditoriaCFCExportData, EmpresaHeader, PeriodoCtx } from './types';
import { csvEscape, downloadCSV, nowStamp } from './utils';
import { drawFooter, drawHeader, type DocWithAT } from './pdf-common';

export function exportAuditoriaCFCCSV(data: AuditoriaCFCExportData, empresa?: EmpresaHeader) {
  const lines: string[] = [
    csvEscape('AUDITORIA CFC — PLANO DE CONTAS'),
    csvEscape(`Empresa: ${empresa?.razao_social ?? '—'}${empresa?.nome_fantasia ? ` (${empresa.nome_fantasia})` : ''}`),
    csvEscape(`CNPJ: ${empresa?.cnpj ?? '—'}`),
    csvEscape(`Score de conformidade: ${data.scoreConformidade}/100`),
    csvEscape(`Contas analíticas: ${data.totalAnaliticas} · Com referencial: ${data.comReferencial} · Sem referencial: ${data.semReferencial}`),
    csvEscape(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`),
    '',
  ];
  lines.push(['Categoria', 'Código local', 'Descrição', 'Natureza', 'Cód. referencial', 'Problema', 'Sugestão']
    .map(csvEscape).join(';'));

  for (const c of data.formatoInvalido) {
    lines.push(['Formato inválido', c.codigo, c.descricao, c.natureza, c.codigo_referencial ?? '',
      'Não corresponde ao padrão CFC N.NN.NN.NN[.NNN]', '']
      .map(csvEscape).join(';'));
  }
  for (const p of data.prefixoIncorreto) {
    lines.push(['Prefixo incorreto', p.conta.codigo, p.conta.descricao, p.conta.natureza,
      p.conta.codigo_referencial ?? '',
      `Prefixo deve ser ${p.esperado.join(' ou ')}`, p.sugestao ?? '']
      .map(csvEscape).join(';'));
  }
  for (const d of data.duplicidades) {
    for (const c of d.contas) {
      lines.push(['Duplicidade', c.codigo, c.descricao, '', d.codigo_referencial,
        `Código repetido em ${d.contas.length} contas`, '']
        .map(csvEscape).join(';'));
    }
  }

  downloadCSV(lines.join('\n'), `auditoria-cfc_${nowStamp()}.csv`);
}

export function exportAuditoriaCFCPDF(data: AuditoriaCFCExportData, empresa?: EmpresaHeader) {
  const ctx: PeriodoCtx = {
    empresa,
    dataInicio: format(new Date(), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
  };
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'AUDITORIA CFC — PLANO DE CONTAS', ctx);

  autoTable(doc, {
    startY: 115,
    head: [['Score', 'Contas ativas', 'Analíticas', 'Com referencial', 'Sem referencial']],
    body: [[
      `${data.scoreConformidade}/100`,
      String(data.totalContas),
      String(data.totalAnaliticas),
      String(data.comReferencial),
      String(data.semReferencial),
    ]],
    styles: { fontSize: 9, cellPadding: 5, halign: 'center' },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  let cursor = ((doc as DocWithAT).lastAutoTable?.finalY ?? 115) + 20;

  const sections: Array<{ titulo: string; body: (string | number)[][] }> = [];

  if (data.formatoInvalido.length > 0) {
    sections.push({
      titulo: `Formato inválido (${data.formatoInvalido.length})`,
      body: data.formatoInvalido.map((c) => [
        c.codigo, c.descricao, c.natureza, c.codigo_referencial ?? '—', 'Padrão CFC N.NN.NN.NN[.NNN]',
      ]),
    });
  }
  if (data.prefixoIncorreto.length > 0) {
    sections.push({
      titulo: `Prefixo incorreto (${data.prefixoIncorreto.length})`,
      body: data.prefixoIncorreto.map((p) => [
        p.conta.codigo, p.conta.descricao, p.conta.natureza,
        p.conta.codigo_referencial ?? '—',
        `Esperado ${p.esperado.join(' ou ')}${p.sugestao ? ` → ${p.sugestao}` : ''}`,
      ]),
    });
  }
  if (data.duplicidades.length > 0) {
    const body: (string | number)[][] = [];
    for (const d of data.duplicidades) {
      for (const c of d.contas) {
        body.push([c.codigo, c.descricao, '—', d.codigo_referencial, `Repetido em ${d.contas.length} contas`]);
      }
    }
    sections.push({ titulo: `Duplicidades (${data.duplicidades.length})`, body });
  }

  for (const sec of sections) {
    autoTable(doc, {
      startY: cursor,
      head: [
        [{ content: sec.titulo, colSpan: 5, styles: { halign: 'left', fillColor: [229, 231, 235], textColor: 0, fontStyle: 'bold' } }],
        ['Código local', 'Descrição', 'Natureza', 'Cód. referencial', 'Problema / Sugestão'],
      ],
      body: sec.body,
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [55, 65, 81], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 90 },
        2: { cellWidth: 70 },
        3: { cellWidth: 110 },
      },
      margin: { top: 115, left: 40, right: 40, bottom: 40 },
      didDrawPage: (d) => {
        if (d.pageNumber > 1) drawHeader(doc, 'AUDITORIA CFC (cont.)', ctx);
      },
    });
    cursor = ((doc as DocWithAT).lastAutoTable?.finalY ?? cursor) + 16;
    if (cursor > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      drawHeader(doc, 'AUDITORIA CFC (cont.)', ctx);
      cursor = 115;
    }
  }

  if (sections.length === 0) {
    autoTable(doc, {
      startY: cursor,
      body: [['Plano de contas 100% conforme com o padrão CFC. Nenhum problema detectado.']],
      styles: { fontSize: 11, cellPadding: 12, halign: 'center', fillColor: [220, 252, 231], textColor: [22, 101, 52] },
      margin: { left: 40, right: 40 },
    });
  }

  drawFooter(doc);
  doc.save(`auditoria-cfc_${nowStamp()}.pdf`);
}
