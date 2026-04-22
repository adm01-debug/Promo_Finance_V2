// Exportação CSV e PDF para Livro Diário e Livro Razão
// - PDF com cabeçalho da empresa, período e paginação (jsPDF + autoTable)
// - CSV completo do dataset filtrado, com cabeçalho contextual
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export interface EmpresaHeader {
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
}

export interface PartidaExport {
  data: string;
  numero: number | null;
  historico: string;
  conta_codigo: string;
  conta_nome: string;
  debito: number;
  credito: number;
}

export interface RazaoContaExport {
  conta_id: string;
  codigo: string;
  nome: string;
  saldo_inicial: number;
  movs: PartidaExport[];
}

interface PeriodoCtx {
  empresa?: EmpresaHeader;
  dataInicio: string;
  dataFim: string;
}

function fmtDate(s: string) {
  return format(new Date(`${s}T00:00:00`), 'dd/MM/yyyy');
}

function buildFilename(base: string, ctx: PeriodoCtx) {
  return `${base}_${ctx.dataInicio}_a_${ctx.dataFim}.csv`;
}

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

function headerLines(titulo: string, ctx: PeriodoCtx): string[] {
  const e = ctx.empresa;
  return [
    csvEscape(titulo),
    csvEscape(`Empresa: ${e?.razao_social ?? '—'}${e?.nome_fantasia ? ` (${e.nome_fantasia})` : ''}`),
    csvEscape(`CNPJ: ${e?.cnpj ?? '—'}`),
    csvEscape(`Período: ${fmtDate(ctx.dataInicio)} a ${fmtDate(ctx.dataFim)}`),
    csvEscape(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`),
    '',
  ];
}

// ============ CSV ============

export function exportDiarioCSV(partidas: PartidaExport[], ctx: PeriodoCtx) {
  const lines: string[] = headerLines('LIVRO DIÁRIO', ctx);
  lines.push(['Data', 'Nº', 'Histórico', 'Conta', 'Débito', 'Crédito'].map(csvEscape).join(';'));
  let totalD = 0;
  let totalC = 0;
  for (const p of partidas) {
    totalD += p.debito;
    totalC += p.credito;
    lines.push(
      [
        fmtDate(p.data),
        p.numero ?? '',
        p.historico,
        `${p.conta_codigo} — ${p.conta_nome}`,
        p.debito ? p.debito.toFixed(2).replace('.', ',') : '',
        p.credito ? p.credito.toFixed(2).replace('.', ',') : '',
      ]
        .map(csvEscape)
        .join(';'),
    );
  }
  lines.push('');
  lines.push(
    ['', '', '', 'TOTAIS', totalD.toFixed(2).replace('.', ','), totalC.toFixed(2).replace('.', ',')]
      .map(csvEscape)
      .join(';'),
  );
  lines.push(
    ['', '', '', 'Diferença (D-C)', '', (totalD - totalC).toFixed(2).replace('.', ',')]
      .map(csvEscape)
      .join(';'),
  );
  downloadCSV(lines.join('\n'), buildFilename('livro-diario', ctx));
}

export function exportRazaoCSV(contas: RazaoContaExport[], ctx: PeriodoCtx) {
  const lines: string[] = headerLines('LIVRO RAZÃO', ctx);
  lines.push(
    ['Conta', 'Data', 'Histórico', 'Débito', 'Crédito', 'Saldo'].map(csvEscape).join(';'),
  );
  let gSaldoIni = 0;
  let gD = 0;
  let gC = 0;
  let gSaldoFim = 0;
  for (const g of contas) {
    const conta = `${g.codigo} — ${g.nome}`;
    let saldo = g.saldo_inicial;
    let dT = 0;
    let cT = 0;
    lines.push(
      [conta, '', 'SALDO INICIAL', '', '', saldo.toFixed(2).replace('.', ',')]
        .map(csvEscape)
        .join(';'),
    );
    for (const m of g.movs) {
      saldo += m.debito - m.credito;
      dT += m.debito;
      cT += m.credito;
      lines.push(
        [
          conta,
          fmtDate(m.data),
          m.historico,
          m.debito ? m.debito.toFixed(2).replace('.', ',') : '',
          m.credito ? m.credito.toFixed(2).replace('.', ',') : '',
          saldo.toFixed(2).replace('.', ','),
        ]
          .map(csvEscape)
          .join(';'),
      );
    }
    lines.push(
      [
        conta,
        '',
        'TOTAIS DA CONTA',
        dT.toFixed(2).replace('.', ','),
        cT.toFixed(2).replace('.', ','),
        saldo.toFixed(2).replace('.', ','),
      ]
        .map(csvEscape)
        .join(';'),
    );
    lines.push('');
    gSaldoIni += g.saldo_inicial;
    gD += dT;
    gC += cT;
    gSaldoFim += saldo;
  }
  lines.push(
    [
      'SUMÁRIO GLOBAL',
      '',
      `Saldo Inicial: ${gSaldoIni.toFixed(2).replace('.', ',')}`,
      gD.toFixed(2).replace('.', ','),
      gC.toFixed(2).replace('.', ','),
      gSaldoFim.toFixed(2).replace('.', ','),
    ]
      .map(csvEscape)
      .join(';'),
  );
  downloadCSV(lines.join('\n'), buildFilename('livro-razao', ctx));
}

// ============ PDF ============

function drawHeader(doc: jsPDF, titulo: string, ctx: PeriodoCtx) {
  const e = ctx.empresa;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 40, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const empresaLinha = `${e?.razao_social ?? '—'}${e?.nome_fantasia ? ` (${e.nome_fantasia})` : ''}`;
  doc.text(empresaLinha, 40, 58);
  doc.text(`CNPJ: ${e?.cnpj ?? '—'}`, 40, 72);
  doc.text(`Período: ${fmtDate(ctx.dataInicio)} a ${fmtDate(ctx.dataFim)}`, 40, 86);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 100);
  doc.setTextColor(0);
}

function drawFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${totalPages}`, w - 40, h - 20, { align: 'right' });
    doc.setTextColor(0);
  }
}

export function exportDiarioPDF(partidas: PartidaExport[], ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'LIVRO DIÁRIO', ctx);

  let totalD = 0;
  let totalC = 0;
  const body = partidas.map((p) => {
    totalD += p.debito;
    totalC += p.credito;
    return [
      fmtDate(p.data),
      p.numero ?? '',
      p.historico,
      `${p.conta_codigo} — ${p.conta_nome}`,
      p.debito ? formatCurrency(p.debito) : '',
      p.credito ? formatCurrency(p.credito) : '',
    ];
  });

  autoTable(doc, {
    startY: 115,
    head: [['Data', 'Nº', 'Histórico', 'Conta', 'Débito', 'Crédito']],
    body,
    foot: [
      [
        { content: 'TOTAIS', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalD), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalC), styles: { halign: 'right', fontStyle: 'bold' } },
      ],
      [
        {
          content: `Diferença D-C: ${formatCurrency(totalD - totalC)} · ${
            Math.abs(totalD - totalC) < 0.01 ? 'OK ✓' : 'DIVERGÊNCIA ⚠'
          }`,
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic' },
        },
      ],
    ],
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    footStyles: { fillColor: [243, 244, 246], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      4: { halign: 'right', cellWidth: 80 },
      5: { halign: 'right', cellWidth: 80 },
    },
    margin: { top: 115, left: 40, right: 40, bottom: 40 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, 'LIVRO DIÁRIO (cont.)', ctx);
    },
  });

  drawFooter(doc);
  doc.save(`livro-diario_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}

export function exportRazaoPDF(contas: RazaoContaExport[], ctx: PeriodoCtx) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  drawHeader(doc, 'LIVRO RAZÃO', ctx);

  let cursorY = 115;
  let gSaldoIni = 0;
  let gD = 0;
  let gC = 0;
  let gSaldoFim = 0;

  for (const g of contas) {
    let saldo = g.saldo_inicial;
    let dT = 0;
    let cT = 0;
    const body: (string | number)[][] = [
      ['', 'SALDO INICIAL', '', '', formatCurrency(saldo)],
    ];
    for (const m of g.movs) {
      saldo += m.debito - m.credito;
      dT += m.debito;
      cT += m.credito;
      body.push([
        fmtDate(m.data),
        m.historico,
        m.debito ? formatCurrency(m.debito) : '',
        m.credito ? formatCurrency(m.credito) : '',
        formatCurrency(saldo),
      ]);
    }

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          {
            content: `${g.codigo} — ${g.nome}`,
            colSpan: 5,
            styles: { halign: 'left', fillColor: [229, 231, 235], textColor: 0, fontStyle: 'bold' },
          },
        ],
        ['Data', 'Histórico', 'Débito', 'Crédito', 'Saldo'],
      ],
      body,
      foot: [
        [
          { content: 'TOTAIS DA CONTA', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(dT), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(cT), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(saldo), styles: { halign: 'right', fontStyle: 'bold' } },
        ],
      ],
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [55, 65, 81], textColor: 255 },
      footStyles: { fillColor: [243, 244, 246], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 80 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'right', cellWidth: 90 },
      },
      margin: { top: 115, left: 40, right: 40, bottom: 40 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1 && data.cursor && data.cursor.y < 115) {
          drawHeader(doc, 'LIVRO RAZÃO (cont.)', ctx);
        }
      },
    });

    type DocWithAT = jsPDF & { lastAutoTable?: { finalY: number } };
    cursorY = ((doc as DocWithAT).lastAutoTable?.finalY ?? cursorY) + 16;
    if (cursorY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      drawHeader(doc, 'LIVRO RAZÃO (cont.)', ctx);
      cursorY = 115;
    }

    gSaldoIni += g.saldo_inicial;
    gD += dT;
    gC += cT;
    gSaldoFim += saldo;
  }

  // Sumário global
  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        {
          content: 'SUMÁRIO GLOBAL DO RAZÃO',
          colSpan: 4,
          styles: { halign: 'center', fillColor: [55, 65, 81], textColor: 255 },
        },
      ],
      ['Saldo Inicial', 'Débitos', 'Créditos', 'Saldo Final'],
    ],
    body: [
      [
        formatCurrency(gSaldoIni),
        formatCurrency(gD),
        formatCurrency(gC),
        formatCurrency(gSaldoFim),
      ],
    ],
    foot: [
      [
        {
          content: `Validação: ${
            Math.abs(gSaldoIni + gD - gC - gSaldoFim) < 0.01 ? 'consistente ✓' : 'divergência ⚠'
          }`,
          colSpan: 4,
          styles: { halign: 'center', fontStyle: 'italic' },
        },
      ],
    ],
    styles: { fontSize: 9, cellPadding: 5, halign: 'right' },
    margin: { top: 115, left: 40, right: 40, bottom: 40 },
  });

  drawFooter(doc);
  doc.save(`livro-razao_${ctx.dataInicio}_a_${ctx.dataFim}.pdf`);
}

// ============ Auditoria CFC ============

interface AuditoriaCFCExportData {
  scoreConformidade: number;
  totalContas: number;
  totalAnaliticas: number;
  comReferencial: number;
  semReferencial: number;
  formatoInvalido: Array<{ codigo: string; descricao: string; codigo_referencial: string | null; natureza: string }>;
  prefixoIncorreto: Array<{
    conta: { codigo: string; descricao: string; codigo_referencial: string | null; natureza: string };
    esperado: string[];
    sugestao: string | null;
  }>;
  duplicidades: Array<{ codigo_referencial: string; contas: Array<{ codigo: string; descricao: string }> }>;
}

function nowStamp() {
  return format(new Date(), 'yyyyMMdd-HHmm');
}

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

  // Resumo
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

  type DocWithAT = jsPDF & { lastAutoTable?: { finalY: number } };
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
