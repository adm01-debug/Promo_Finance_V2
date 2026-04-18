// ============================================
// Gerador PDF Anual Tributário (P6)
// jsPDF + autoTable — layout corporativo (capa + 4 seções)
// ============================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analisarOportunidadesElisao } from '@/lib/tributario/elisao/orquestrador-elisao';
import type { ContextoEmpresa } from '@/lib/tributario/elisao/types';

export interface RelatorioAnualPayload {
  empresa: { razao_social: string; cnpj: string; regime_atual: string };
  ano: number;
  kpis: {
    faturamento_anual: number;
    tributos_anuais: number;
    carga_efetiva: number;
    meses_apurados: number;
  };
  apuracao_mensal: Array<Record<string, number | string>>;
  decisao_regime: {
    recomendado?: { nome?: string; cargaEfetiva?: number; totalTributos?: number };
    economiaAnualVsAtual?: number;
    justificativa?: string;
  } | null;
  alertas_resolvidos: Array<{ titulo: string; prioridade: string; resolvido_em?: string }>;
  gerado_em: string;
}

const fmtBRL = (n: number) =>
  (n ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
const fmtPct = (n: number) => `${(n ?? 0).toFixed(2)}%`;

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function addHeaderFooter(doc: jsPDF, p: RelatorioAnualPayload) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (i === 1) continue; // pular capa
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${p.empresa.razao_social} · CNPJ ${p.empresa.cnpj}`, 15, 10);
    doc.text(`Relatório Anual Tributário ${p.ano}`, w - 15, 10, { align: 'right' });
    doc.text(`Página ${i} de ${pages}`, w - 15, h - 8, { align: 'right' });
    doc.text(
      `Gerado em ${new Date(p.gerado_em).toLocaleString('pt-BR')}`,
      15,
      h - 8
    );
  }
}

export function gerarRelatorioAnualPDF(p: RelatorioAnualPayload): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();

  // ============= CAPA =============
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, w, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Relatório Anual Tributário', 15, 45);
  doc.setFontSize(14);
  doc.text(`Exercício ${p.ano}`, 15, 58);
  doc.setFontSize(10);
  doc.text('CBS · IBS · Imposto Seletivo · Residuais', 15, 70);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(p.empresa.razao_social, 15, 115);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`CNPJ: ${p.empresa.cnpj}`, 15, 122);
  doc.text(`Regime atual: ${p.empresa.regime_atual}`, 15, 128);

  // KPI box
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 145, w - 30, 80, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text('Faturamento anual', 22, 158);
  doc.setFontSize(18);
  doc.text(fmtBRL(p.kpis.faturamento_anual), 22, 168);

  doc.setFontSize(11);
  doc.text('Tributos pagos', 110, 158);
  doc.setFontSize(18);
  doc.text(fmtBRL(p.kpis.tributos_anuais), 110, 168);

  doc.setFontSize(11);
  doc.text('Carga efetiva', 22, 195);
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text(fmtPct(p.kpis.carga_efetiva), 22, 205);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text('Meses apurados', 110, 195);
  doc.setFontSize(18);
  doc.text(`${p.kpis.meses_apurados}/12`, 110, 205);

  // ============= SUMÁRIO EXECUTIVO =============
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('1. Sumário Executivo', 15, 25);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const recomendado = p.decisao_regime?.recomendado?.nome ?? '—';
  const economia = p.decisao_regime?.economiaAnualVsAtual ?? 0;
  const justif =
    p.decisao_regime?.justificativa ??
    `O regime atual é ${p.empresa.regime_atual} com carga efetiva de ${fmtPct(p.kpis.carga_efetiva)}.`;

  const splitJ = doc.splitTextToSize(justif, w - 30);
  doc.text(splitJ, 15, 38);

  autoTable(doc, {
    startY: 70,
    head: [['Indicador', 'Valor']],
    body: [
      ['Regime atual', p.empresa.regime_atual],
      ['Regime ótimo recomendado', recomendado],
      ['Carga efetiva atual', fmtPct(p.kpis.carga_efetiva)],
      [
        'Carga regime ótimo',
        fmtPct(p.decisao_regime?.recomendado?.cargaEfetiva ?? 0),
      ],
      ['Economia anual potencial', fmtBRL(economia)],
      ['Tributos pagos no ano', fmtBRL(p.kpis.tributos_anuais)],
      ['Faturamento anual', fmtBRL(p.kpis.faturamento_anual)],
    ],
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
  });

  // ============= APURAÇÃO MENSAL =============
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('2. Apuração Mensal', 15, 25);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Tributos novos (CBS/IBS/IS) e residuais por competência.',
    15,
    32
  );

  const linhasMes = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const linha = p.apuracao_mensal.find((x) => Number(x.mes) === m);
    return [
      MESES[i],
      fmtBRL(Number(linha?.faturamento ?? 0)),
      fmtBRL(Number(linha?.cbs ?? 0)),
      fmtBRL(Number(linha?.ibs ?? 0)),
      fmtBRL(Number(linha?.imposto_seletivo ?? 0)),
      fmtBRL(Number(linha?.residuais ?? 0)),
      fmtBRL(Number(linha?.total_tributos ?? 0)),
    ];
  });

  autoTable(doc, {
    startY: 38,
    head: [['Mês', 'Faturamento', 'CBS', 'IBS', 'IS', 'Residuais', 'Total']],
    body: linhasMes,
    foot: [
      [
        'Total',
        fmtBRL(p.kpis.faturamento_anual),
        fmtBRL(
          p.apuracao_mensal.reduce((a, x) => a + Number(x.cbs ?? 0), 0)
        ),
        fmtBRL(
          p.apuracao_mensal.reduce((a, x) => a + Number(x.ibs ?? 0), 0)
        ),
        fmtBRL(
          p.apuracao_mensal.reduce(
            (a, x) => a + Number(x.imposto_seletivo ?? 0),
            0
          )
        ),
        fmtBRL(
          p.apuracao_mensal.reduce((a, x) => a + Number(x.residuais ?? 0), 0)
        ),
        fmtBRL(p.kpis.tributos_anuais),
      ],
    ],
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    styles: { fontSize: 8 },
  });

  // ============= OPORTUNIDADES DE ELISÃO =============
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('3. Oportunidades de Elisão Fiscal', 15, 25);

  const ctxElisao: ContextoEmpresa = {
    regime_atual:
      (p.empresa.regime_atual as ContextoEmpresa['regime_atual']) ??
      'lucro_real',
    faturamento_anual: p.kpis.faturamento_anual,
    lucro_liquido: p.kpis.faturamento_anual * 0.1,
    patrimonio_liquido: p.kpis.faturamento_anual * 0.3,
    folha_pagamento_anual: p.kpis.faturamento_anual * 0.15,
    receita_exportacao: 0,
    receita_importacao: 0,
    despesas_pd: 0,
    beneficio_icms_anual: 0,
    dividendos_pf_anual: 0,
    uf: 'SP',
    cnae_principal: '',
  };
  const elisao = analisarOportunidadesElisao(ctxElisao);

  autoTable(doc, {
    startY: 32,
    head: [['Estratégia', 'Aplicável', 'Economia estimada', 'Risco']],
    body: elisao.oportunidades.slice(0, 9).map((o) => [
      o.estrategia,
      o.aplicavel ? 'Sim' : 'Não',
      fmtBRL(o.economia_estimada),
      o.risco_classificacao ?? '—',
    ]),
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  });

  // ============= RECOMENDAÇÕES =============
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('4. Recomendações', 15, 25);

  const score = Math.max(
    0,
    Math.min(100, 100 - p.alertas_resolvidos.length * 2)
  );
  const recomendacoes: string[] = [];
  if (p.kpis.carga_efetiva > 25)
    recomendacoes.push(
      'Carga efetiva acima de 25% — avalie migração de regime e estratégias de elisão (JCP, Lei do Bem, REINTEGRA).'
    );
  if (economia > 10000)
    recomendacoes.push(
      `Economia potencial significativa de ${fmtBRL(economia)} ao migrar para ${recomendado}.`
    );
  if (elisao.total_aplicaveis >= 3)
    recomendacoes.push(
      `${elisao.total_aplicaveis} estratégias de elisão aplicáveis identificadas — revisar implementação.`
    );
  recomendacoes.push(
    `Score saúde fiscal: ${score}/100 (${score >= 80 ? 'excelente' : score >= 60 ? 'bom' : 'requer atenção'}).`
  );
  recomendacoes.push(
    'Reforma Tributária: prepare-se para a transição CBS/IBS 2026-2033 — avalie créditos acumulados e revisão de NCMs.'
  );

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  recomendacoes.forEach((r, i) => {
    const split = doc.splitTextToSize(`${i + 1}. ${r}`, w - 30);
    doc.text(split, 15, 40 + i * 18);
  });

  addHeaderFooter(doc, p);
  return doc;
}
