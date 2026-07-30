// PDF Memorial de Cálculo Tributário — jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ResultadoCalculadora, ResultadoRegime } from '@/lib/tributario/calculadora';

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PCT = (v: number) => `${(v * 100).toFixed(2)}%`;

export interface DadosEmpresa {
  nome: string;
  cnpj?: string;
  periodo?: string;
}

export function gerarPdfMemorialCalculo(
  resultado: ResultadoCalculadora,
  ativo: ResultadoRegime,
  empresa: DadosEmpresa,
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Capa
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('Memorial de Cálculo Tributário', 20, 25);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Empresa: ${empresa.nome}`, 20, 35);
  if (empresa.cnpj) doc.text(`CNPJ: ${empresa.cnpj}`, 20, 41);
  doc.text(`Período: ${empresa.periodo ?? new Date().getFullYear()}`, 20, 47);
  doc.text(`Regime analisado: ${ativo.nome}`, 20, 53);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 59);

  // Sumário executivo
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text('Sumário executivo', 20, 72);
  autoTable(doc, {
    startY: 76,
    theme: 'grid',
    styles: { fontSize: 9 },
    head: [['Indicador', 'Valor']],
    body: [
      ['Receita bruta', BRL(ativo.receitaBase)],
      ['Total de tributos', BRL(ativo.totalTributos)],
      ['Retenções compensadas', BRL(ativo.retencoesCompensadas)],
      ['Total a pagar', BRL(ativo.totalAPagar)],
      ['Carga efetiva', `${ativo.cargaEfetiva.toFixed(2)}%`],
    ],
  });

  // Detalhamento por tributo
  const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(13);
  doc.text('Detalhamento por tributo', 20, afterY + 10);
  autoTable(doc, {
    startY: afterY + 14,
    theme: 'striped',
    styles: { fontSize: 8 },
    head: [['Tributo', 'Base', 'Alíq. efetiva', 'Valor', 'Fórmula']],
    body: ativo.tributos
      .filter((t) => t.valor > 0)
      .map((t) => [t.nome, BRL(t.base), PCT(t.aliquotaEfetiva), BRL(t.valor), t.formula]),
  });

  // Memória linha a linha
  const afterY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(13);
  doc.text('Memória de cálculo', 20, afterY2 + 10);
  autoTable(doc, {
    startY: afterY2 + 14,
    theme: 'grid',
    styles: { fontSize: 7 },
    head: [['#', 'Grupo', 'Descrição', 'Base', 'Alíq.', 'Valor']],
    body: ativo.memoria.map((l) => [
      String(l.ordem),
      l.grupo,
      l.descricao + (l.observacao ? `\n${l.observacao}` : ''),
      l.base != null ? BRL(l.base) : '—',
      l.aliquota != null ? PCT(l.aliquota) : '—',
      BRL(l.valor),
    ]),
  });

  // Comparativo entre regimes
  doc.addPage();
  doc.setFontSize(13);
  doc.text('Comparativo entre regimes', 20, 25);
  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 9 },
    head: [['Regime', 'Elegível', 'Total a pagar', 'Carga efetiva', 'Observação']],
    body: resultado.cenarios.map((c) => [
      c.nome,
      c.elegivel ? 'Sim' : 'Não',
      c.elegivel ? BRL(c.totalAPagar) : '—',
      c.elegivel ? `${c.cargaEfetiva.toFixed(2)}%` : '—',
      c.regime === resultado.melhorCenario?.regime ? 'RECOMENDADO' : (c.motivoInelegibilidade ?? ''),
    ]),
  });

  const afterCmp = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  if (resultado.melhorCenario) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Recomendação', 20, afterCmp + 12);
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(
      `Regime recomendado: ${resultado.melhorCenario.nome}. Economia estimada vs. pior cenário: ${BRL(resultado.economiaAnualVsPior)} por ano.`,
      20, afterCmp + 18, { maxWidth: 170 },
    );
  }

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${i} de ${total} — documento auxiliar, não substitui apuração oficial.`, 20, 290);
  }

  return doc.output('blob');
}
