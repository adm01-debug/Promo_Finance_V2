// Etapa 82: relatorio PDF dos alertas fiscais da importacao de XML, com a
// fundamentacao legal de cada apontamento.
//
// O badge da tela mostra "N alertas" e o tooltip cabe uma nota por vez: quem
// precisa discutir a classificacao com o contador nao tinha como levar a lista
// e a norma junto.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DivergenciaFiscal } from '@/lib/tributario/validador-ncm-cst';
import type { FundamentoLegalResumo } from '@/lib/tributario/catalogos/fundamentacao-legal';

/** Nota reduzida ao que o relatorio imprime. */
export interface NotaComAlertas {
  numero: string;
  emitente: string;
  /** Data de emissao ja formatada (dd/MM/yyyy). */
  data: string;
  alertas: DivergenciaFiscal[];
}

const MAX_FUNDAMENTO_TABELA = 220;

const limpar = (texto: string) => texto.replace(/\s+/g, ' ').trim();

const primeiraLinha = (texto: string) => {
  const linha = texto
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean);
  return linha ?? texto.trim();
};

const cortar = (texto: string, limite: number) =>
  texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto;

/** Fundamento em uma linha, para a celula da tabela. */
export const fundamentoEmLinha = (fundamento?: FundamentoLegalResumo): string => {
  if (!fundamento) return '—';
  return cortar(
    limpar(`${fundamento.referencia} — ${primeiraLinha(fundamento.texto)}`),
    MAX_FUNDAMENTO_TABELA
  );
};

/** Uma linha por alerta: nota, item, codigo da regra, divergencia e norma. */
export function linhasAlertas(nfes: NotaComAlertas[]): string[][] {
  return nfes.flatMap((nota) =>
    nota.alertas.map((alerta) => [
      nota.numero || '—',
      alerta.item ? String(alerta.item) : '—',
      nota.emitente || 'N/I',
      nota.data,
      alerta.codigo,
      alerta.campo,
      limpar(alerta.mensagem),
      fundamentoEmLinha(alerta.fundamento),
    ])
  );
}

/** Textos integrais distintos, sem repetir a mesma norma por item. */
export function fundamentosDistintos(nfes: NotaComAlertas[]): FundamentoLegalResumo[] {
  const vistos = new Map<string, FundamentoLegalResumo>();
  for (const nota of nfes) {
    for (const alerta of nota.alertas) {
      const f = alerta.fundamento;
      if (!f) continue;
      const chave = `${f.referencia}|${f.texto}`;
      if (!vistos.has(chave)) vistos.set(chave, f);
    }
  }
  return [...vistos.values()];
}

const totalAlertas = (nfes: NotaComAlertas[]) =>
  nfes.reduce((total, nota) => total + nota.alertas.length, 0);

export function gerarAlertasFiscaisPdf(nfes: NotaComAlertas[]): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const largura = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Alertas fiscais da importacao de XML', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const resumo = `${totalAlertas(nfes)} alerta(s) em ${nfes.length} nota(s)`;
  doc.text(resumo, 14, 22);
  doc.text(
    'Fundamentacao: LC 214/2025 - dados abertos da Receita Federal (catalogo de fundamentacoes legais)',
    14,
    27
  );
  doc.setTextColor(0);

  const corpo = linhasAlertas(nfes);
  autoTable(doc, {
    startY: 32,
    head: [
      ['Nota', 'Item', 'Emitente', 'Data', 'Regra', 'Campo', 'Divergencia', 'Fundamento legal'],
    ],
    body: corpo.length > 0 ? corpo : [['—', '—', '—', '—', '—', '—', 'Nenhum alerta fiscal', '—']],
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 10 },
      2: { cellWidth: 42 },
      3: { cellWidth: 20 },
      4: { cellWidth: 16 },
      5: { cellWidth: 22 },
      6: { cellWidth: 70 },
      7: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const fundamentos = fundamentosDistintos(nfes);
  if (fundamentos.length > 0) {
    const cursor = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
    let y = (cursor?.finalY ?? 40) + 10;
    const alturaPagina = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Fundamentacao integral', 14, y);
    y += 5;

    for (const fundamento of fundamentos) {
      const texto = `${fundamento.referencia}\n${fundamento.texto}`;
      const quebrado = doc.splitTextToSize(texto, largura - 28) as string[];
      if (y + quebrado.length * 3.4 > alturaPagina - 12) {
        doc.addPage();
        y = 16;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(fundamento.referencia, 14, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const corpoTexto = doc.splitTextToSize(fundamento.texto, largura - 28) as string[];
      doc.text(corpoTexto, 14, y);
      y += corpoTexto.length * 3.4 + 4;
    }
  }

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Pagina ${i} de ${paginas} - gerado em ${new Date().toLocaleString('pt-BR')}`,
      largura - 14,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'right' }
    );
    doc.setTextColor(0);
  }

  return doc;
}

export function baixarAlertasFiscaisPdf(
  nfes: NotaComAlertas[],
  arquivo = 'alertas-fiscais.pdf'
): void {
  gerarAlertasFiscaisPdf(nfes).save(arquivo);
}
