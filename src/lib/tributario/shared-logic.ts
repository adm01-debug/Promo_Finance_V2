
// LOGICA TRIBUTARIA COMPARTILHADA

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface FaturamentoMes {
  ano: number; mes: number; receita_bruta: number;
  receita_servicos?: number; receita_revenda?: number;
  receita_industria?: number; receita_exportacao?: number;
}
export interface FolhaMes {
  ano: number; mes: number; salarios: number; pro_labore: number;
  encargos: number; total_folha: number;
}
export interface ParametrosSimulacao {
  faturamentoAnual: number;
  faturamentoMensal?: FaturamentoMes[];
  folhaMensal?: FolhaMes[];
  folhaAnual?: number;
  margemLucro: number;
  percentualServicos: number;
  comprasComCredito?: number;
  despesasOperacionais?: number;
  /** Alíquota ICMS efetiva (0..1), default 0.18 (SP interna). */
  aliquotaICMS?: number;
  /** Alíquota ISS efetiva (0..1), default 0.05 (teto LC 116/2003). */
  aliquotaISS?: number;
  /** Percentual (0..100) da receita proveniente de industrialização própria (Anexo II). */
  percentualIndustria?: number;
  /** Percentual (0..100) da receita de revenda/comércio (Anexo I). */
  percentualRevenda?: number;
  /** Descrição da atividade principal — usada para detectar serviços do Anexo IV. */
  atividadePrincipal?: string;
  /**
   * Sublimite estadual de receita bruta (LC 123/2006, art. 19/20). Acima dele o
   * ICMS e o ISS saem do DAS e passam a ser recolhidos pelo regime normal.
   * Default: R$ 3.600.000,00.
   */
  sublimiteEstadual?: number;
  /** Valor anual de ISS retido na fonte pelo tomador — deduzido da parcela de ISS do DAS. */
  issRetidoFonte?: number;
  /**
   * Alíquota RAT/FAP aplicável à folha (fração, ex.: 0.02 = 2%). Usada na CPP
   * patronal recolhida FORA do DAS pelas empresas do Anexo IV. Default: 0.02.
   */
  aliquotaRAT?: number;
  /**
   * Alíquota de Contribuições a Terceiros (fração, ex.: 0.058 = 5,8%) incidente
   * sobre a folha em Lucro Presumido e Lucro Real. Default: 0.058 (FPAS 507).
   */
  aliquotaTerceiros?: number;
  /** CNAE principal da empresa; usado para derivar a alíquota de terceiros quando não informada. */
  cnaePrincipal?: string;
  /**
   * Percentual de presunção do IRPJ sobre a receita de serviços (fração).
   * Default 0,32 (serviços em geral, art. 15 §1º III "a" da Lei 9.249/95).
   * Transporte de cargas usa 0,08; transporte de passageiros 0,16;
   * serviços hospitalares/diagnóstico por imagem 0,08.
   */
  presuncaoIrpjServicos?: number;
  /**
   * Percentual de presunção da CSLL sobre a receita de serviços (fração).
   * Default 0,32; transporte e serviços hospitalares usam 0,12 (Lei 9.249/95, art. 20).
   */
  presuncaoCsllServicos?: number;
}

export interface ResultadoCenario {
  regime: RegimeTributario; nome: string; elegivel: boolean;
  motivoInelegibilidade?: string;
  irpj: number; csll: number; pis: number; cofins: number; cpp: number;
  icms: number; iss: number; cbs: number; ibs: number;
  totalTributos: number; cargaEfetiva: number;
  rbt12?: number; fatorR?: number; anexoAplicavel?: AnexoSimples;
  faixaAplicavel?: number; aliquotaNominal?: number;
  /** True quando o RBT12 ultrapassou o sublimite estadual (ICMS/ISS fora do DAS). */
  sublimiteExcedido?: boolean;
  /** ICMS recolhido fora do DAS (regime normal), quando há excesso de sublimite. */
  icmsForaDAS?: number;
  /** ISS recolhido fora do DAS (regime normal), quando há excesso de sublimite. */
  issForaDAS?: number;
  /** ISS retido na fonte efetivamente deduzido do DAS. */
  issRetidoDeduzido?: number;
  /** CPP patronal recolhida fora do DAS (Anexo IV do Simples Nacional). */
  cppForaDAS?: number;
  observacoes: string[];
}

export const ANEXOS: Record<AnexoSimples, Array<{ faixa: number; ate: number; aliq: number; pd: number }>> = {
  I: [
    { faixa: 1, ate: 180000, aliq: 0.04, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.073, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.095, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.107, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.143, pd: 87300 },
    { faixa: 6, ate: 4800000, aliq: 0.19, pd: 378000 },
  ],
  II: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.078, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.10, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.112, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.147, pd: 85500 },
    { faixa: 6, ate: 4800000, aliq: 0.30, pd: 720000 },
  ],
  III: [
    { faixa: 1, ate: 180000, aliq: 0.06, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.112, pd: 9360 },
    { faixa: 3, ate: 720000, aliq: 0.135, pd: 17640 },
    { faixa: 4, ate: 1800000, aliq: 0.16, pd: 35640 },
    { faixa: 5, ate: 3600000, aliq: 0.21, pd: 125640 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 648000 },
  ],
  IV: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.09, pd: 8100 },
    { faixa: 3, ate: 720000, aliq: 0.102, pd: 12420 },
    { faixa: 4, ate: 1800000, aliq: 0.14, pd: 39780 },
    { faixa: 5, ate: 3600000, aliq: 0.22, pd: 183780 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 828000 },
  ],
  V: [
    { faixa: 1, ate: 180000, aliq: 0.155, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.18, pd: 4500 },
    { faixa: 3, ate: 720000, aliq: 0.195, pd: 9900 },
    { faixa: 4, ate: 1800000, aliq: 0.205, pd: 17100 },
    { faixa: 5, ate: 3600000, aliq: 0.23, pd: 62100 },
    { faixa: 6, ate: 4800000, aliq: 0.305, pd: 540000 },
  ],
};

export const LIMITE_SIMPLES = 4800000;
export const LIMITE_PRESUMIDO = 78000000;

export function calcularRBT12(hist: FaturamentoMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  if (!ant.length) return 0;
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.receita_bruta || 0), 0);
  return u12.length < 12 ? (soma / u12.length) * 12 : soma;
}

export function calcularFolha12m(hist: FolhaMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.total_folha || 0), 0);
  return u12.length < 12 && u12.length > 0 ? (soma / u12.length) * 12 : soma;
}
/**
 * Serviços tributados obrigatoriamente pelo Anexo IV (LC 123/2006, art. 18 §5º-C),
 * onde a CPP fica FORA do DAS (recolhida à parte pela folha).
 */
const PALAVRAS_ANEXO_IV = [
  'construcao', 'obra', 'edificacao', 'vigilancia', 'seguranca',
  'limpeza', 'conservacao', 'zeladoria', 'portaria', 'advocacia', 'advogado',
];

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Determina o anexo do Simples Nacional pela atividade PREPONDERANTE.
 * Corrige a simplificação anterior (apenas Anexo I x III/V), que classificava
 * indústrias (Anexo II) como comércio e ignorava o Anexo IV.
 */
export function determinarAnexoSimples(
  p: ParametrosSimulacao,
  fatorR: number,
): { anexo: AnexoSimples; motivo: string } {
  const servicos = Math.max(0, p.percentualServicos || 0);
  const industria = Math.max(0, p.percentualIndustria || 0);
  const revenda = Math.max(0, p.percentualRevenda ?? Math.max(0, 100 - servicos - industria));

  const maior = Math.max(servicos, industria, revenda);

  if (maior === servicos && servicos > 0) {
    const atividade = normalizar(p.atividadePrincipal || '');
    if (atividade && PALAVRAS_ANEXO_IV.some((t) => atividade.includes(t))) {
      return {
        anexo: 'IV',
        motivo: `Serviço do Anexo IV (${p.atividadePrincipal}) — CPP fora do DAS, recolhida sobre a folha.`,
      };
    }
    const anexo: AnexoSimples = fatorR >= 0.28 ? 'III' : 'V';
    return {
      anexo,
      motivo: `Serviços preponderantes (${servicos.toFixed(1)}%). Fator R = ${(fatorR * 100).toFixed(2)}% → Anexo ${anexo}.`,
    };
  }

  if (maior === industria && industria > 0) {
    return {
      anexo: 'II',
      motivo: `Industrialização preponderante (${industria.toFixed(1)}%) → Anexo II.`,
    };
  }

  return {
    anexo: 'I',
    motivo: `Revenda/comércio preponderante (${revenda.toFixed(1)}%) → Anexo I.`,
  };
}


/** Coerção segura de número: descarta NaN/Infinity/negativos indevidos. */
function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Restringe um valor ao intervalo [min, max]. */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Normaliza defensivamente os parâmetros de simulação antes de qualquer cálculo.
 *
 * Motivação (gap detectado em fuzzing de milhares de cenários): entradas fora de
 * domínio — percentual de serviços > 100, mix serviços+indústria+revenda > 100,
 * alíquotas absurdas, valores negativos ou NaN vindos de formulários/JSONB —
 * produziam bases negativas (ex.: ICMS negativo no Lucro Presumido) e resultados
 * fiscalmente impossíveis. Aqui todo parâmetro é coagido ao seu domínio legal.
 */
export function sanitizarParametros(p: ParametrosSimulacao): ParametrosSimulacao {
  const faturamentoAnual = Math.max(0, num(p.faturamentoAnual, 0));
  let servicos = clamp(num(p.percentualServicos, 0), 0, 100);
  let industria = clamp(num(p.percentualIndustria, 0), 0, 100);
  let revenda = p.percentualRevenda === undefined || p.percentualRevenda === null
    ? Math.max(0, 100 - servicos - industria)
    : clamp(num(p.percentualRevenda, 0), 0, 100);
  const somaMix = servicos + industria + revenda;
  if (somaMix > 100 && somaMix > 0) {
    servicos = (servicos / somaMix) * 100;
    industria = (industria / somaMix) * 100;
    revenda = (revenda / somaMix) * 100;
  }
  return {
    ...p,
    faturamentoAnual,
    margemLucro: clamp(num(p.margemLucro, 0), -100, 100),
    percentualServicos: servicos,
    percentualIndustria: industria,
    percentualRevenda: revenda,
    folhaAnual: Math.max(0, num(p.folhaAnual, 0)),
    comprasComCredito: Math.max(0, num(p.comprasComCredito, 0)),
    despesasOperacionais: Math.max(0, num(p.despesasOperacionais, 0)),
    aliquotaICMS: p.aliquotaICMS === undefined ? undefined : clamp(num(p.aliquotaICMS, 0.18), 0, 1),
    aliquotaISS: p.aliquotaISS === undefined ? undefined : clamp(num(p.aliquotaISS, 0.05), 0, 1),
    aliquotaRAT: p.aliquotaRAT === undefined ? undefined : clamp(num(p.aliquotaRAT, 0.02), 0, 0.06),
    aliquotaTerceiros: p.aliquotaTerceiros === undefined ? undefined : clamp(num(p.aliquotaTerceiros, 0.058), 0, 0.1),
    issRetidoFonte: Math.max(0, num(p.issRetidoFonte, 0)),
    presuncaoIrpjServicos: p.presuncaoIrpjServicos === undefined
      ? undefined
      : clamp(num(p.presuncaoIrpjServicos, 0.32), 0.08, 0.32),
    presuncaoCsllServicos: p.presuncaoCsllServicos === undefined
      ? undefined
      : clamp(num(p.presuncaoCsllServicos, 0.32), 0.12, 0.32),

    sublimiteEstadual: p.sublimiteEstadual === undefined ? undefined : Math.max(0, num(p.sublimiteEstadual, 3600000)),
  };
}

export function simularSimples(
  p: ParametrosSimulacao,
  ano: number,
  mes: number,
  forcarAnexo?: AnexoSimples,
): ResultadoCenario {
  p = sanitizarParametros(p);
  const obs: string[] = [];
  if (p.faturamentoAnual > LIMITE_SIMPLES) {
    return {
      regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false,
      motivoInelegibilidade: `Faturamento acima de R$ 4,8 mi`,
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Acima do limite legal.'],
    };
  }
  let rbt12 = p.faturamentoAnual;
  if (p.faturamentoMensal?.length) {
    const r = calcularRBT12(p.faturamentoMensal, ano, mes);
    if (r > 0) {
      rbt12 = r;
    } else {
      obs.push('RBT12 estimado a partir do faturamento anual informado (histórico mensal sem meses anteriores ao mês de referência).');
    }
  }
  const folha12m = p.folhaMensal?.length
    ? calcularFolha12m(p.folhaMensal, ano, mes)
    : (p.folhaAnual || 0);
  const fatorR = rbt12 > 0 ? folha12m / rbt12 : 0;
  const { anexo: anexoDetectado, motivo } = determinarAnexoSimples(p, fatorR);
  let anexo: AnexoSimples = anexoDetectado;
  if (forcarAnexo) {
    anexo = forcarAnexo;
    obs.push(`Anexo forçado manualmente para simulação: Anexo ${anexo}.`);
  } else {
    obs.push(motivo);
  }
  const faixa = ANEXOS[anexo].find((f) => rbt12 <= f.ate) || ANEXOS[anexo][5];
  const aliqEfet = rbt12 > 0 ? Math.max(0, ((rbt12 * faixa.aliq) - faixa.pd) / rbt12) : faixa.aliq;
  const das = p.faturamentoAnual * aliqEfet;
  obs.push(`Faixa ${faixa.faixa}, alíq nominal ${(faixa.aliq * 100).toFixed(2)}%, efetiva ${(aliqEfet * 100).toFixed(2)}%.`);
  
  // Distribuição simplificada por anexo (LC 123/2006, Anexos I-V).
  // As frações de cada anexo precisam somar 1.0 — caso contrário o cálculo
  // sobrestima/subestima o total. Renormalizamos defensivamente para evitar
  // que pequenos desvios na tabela (ex.: 0.055+0.035+0.1282+0.0278+0.415+0.34
  // do Anexo I = 1.001) afetem o DAS.
  type DistribuicaoAnexo = {
    irpj: number; csll: number; cofins: number; pis: number;
    cpp: number; icms: number; iss: number;
  };
  const dist: Record<AnexoSimples, DistribuicaoAnexo> = {
    I:   { irpj: 0.055, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.415,  icms: 0.34,  iss: 0 },
    II:  { irpj: 0.055, csll: 0.035, cofins: 0.1182, pis: 0.0278, cpp: 0.415,  icms: 0.32,  iss: 0 },
    III: { irpj: 0.04,  csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0,     iss: 0.335 },
    IV:  { irpj: 0.185, csll: 0.15,  cofins: 0.1603, pis: 0.0347, cpp: 0,      icms: 0,     iss: 0.47 },
    V:   { irpj: 0.25,  csll: 0.15,  cofins: 0.1428, pis: 0.0309, cpp: 0.2885, icms: 0,     iss: 0.137 },
  };

  const raw = dist[anexo];
  const sum = raw.irpj + raw.csll + raw.cofins + raw.pis + raw.cpp + raw.icms + raw.iss;
  const d: DistribuicaoAnexo = sum > 0
    ? {
        irpj: raw.irpj / sum,
        csll: raw.csll / sum,
        cofins: raw.cofins / sum,
        pis: raw.pis / sum,
        cpp: raw.cpp / sum,
        icms: raw.icms / sum,
        iss: raw.iss / sum,
      }
    : raw;

  // --- Sublimite estadual (LC 123/2006, arts. 19 e 20) ---------------------
  // Ultrapassado o sublimite (padrão R$ 3,6 mi), ICMS e ISS deixam de ser
  // recolhidos no DAS e passam ao regime normal de apuração. A parcela federal
  // do DAS é reproporcionalizada para os tributos remanescentes.
  const sublimite = p.sublimiteEstadual ?? 3_600_000;
  const sublimiteExcedido = rbt12 > sublimite;

  let icms = das * d.icms;
  let iss = das * d.iss;
  let dasFinal = das;
  let icmsForaDAS = 0;
  let issForaDAS = 0;

  if (sublimiteExcedido && (d.icms > 0 || d.iss > 0)) {
    const fracaoEstadualMunicipal = d.icms + d.iss;
    dasFinal = das * (1 - fracaoEstadualMunicipal);

    const pServ = Math.max(0, Math.min(100, p.percentualServicos || 0)) / 100;
    const pMerc = Math.max(0, 1 - pServ);
    const aliqICMS = p.aliquotaICMS ?? 0.18;
    const aliqISS = p.aliquotaISS ?? 0.05;

    icmsForaDAS = d.icms > 0 ? p.faturamentoAnual * pMerc * aliqICMS : 0;
    issForaDAS = d.iss > 0 ? p.faturamentoAnual * pServ * aliqISS : 0;
    icms = icmsForaDAS;
    iss = issForaDAS;
    obs.push(
      `RBT12 (R$ ${rbt12.toLocaleString('pt-BR')}) acima do sublimite estadual de R$ ${sublimite.toLocaleString('pt-BR')}: ICMS e ISS recolhidos FORA do DAS pelo regime normal.`,
    );
  }

  // --- ISS retido na fonte (LC 116/2003) -----------------------------------
  // O ISS retido pelo tomador é deduzido da parcela de ISS devida no DAS,
  // limitado ao próprio valor dessa parcela (não gera saldo negativo).
  let issRetidoDeduzido = 0;
  const issRetido = Math.max(0, p.issRetidoFonte || 0);
  if (issRetido > 0 && !sublimiteExcedido && iss > 0) {
    issRetidoDeduzido = Math.min(issRetido, iss);
    iss -= issRetidoDeduzido;
    dasFinal -= issRetidoDeduzido;
    obs.push(
      `ISS retido na fonte de R$ ${issRetidoDeduzido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} deduzido do DAS.`,
    );
  }

  // --- CPP patronal fora do DAS (Anexo IV, LC 123/2006 art. 18 §5º-C) ------
  // No Anexo IV a contribuição previdenciária patronal NÃO está incluída no DAS:
  // a empresa recolhe 20% sobre a folha + RAT/FAP em GPS/DCTFWeb. Ignorar essa
  // parcela subestimaria materialmente a carga do regime na comparação.
  let cpp = das * d.cpp;
  let cppForaDAS = 0;
  if (anexo === 'IV') {
    const rat = Math.min(0.06, Math.max(0, p.aliquotaRAT ?? 0.02));
    cppForaDAS = Math.max(0, p.folhaAnual || 0) * (0.20 + rat);
    cpp = cppForaDAS;
    if (cppForaDAS > 0) {
      obs.push(
        `Anexo IV: CPP patronal de R$ ${cppForaDAS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (20% + RAT ${(rat * 100).toFixed(2)}%) recolhida FORA do DAS.`,
      );
    }
  }

  const totalTributos = (sublimiteExcedido ? dasFinal + icms + iss : dasFinal) + cppForaDAS;

  return {
    regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: true,
    irpj: das * d.irpj, csll: das * d.csll, pis: das * d.pis, cofins: das * d.cofins,
    cpp, icms, iss,
    cbs: 0, ibs: 0,
    totalTributos,
    cargaEfetiva: p.faturamentoAnual > 0 ? (totalTributos / p.faturamentoAnual) * 100 : 0,
    rbt12, fatorR, anexoAplicavel: anexo, faixaAplicavel: faixa.faixa,
    aliquotaNominal: faixa.aliq * 100,
    sublimiteExcedido,
    icmsForaDAS, issForaDAS, issRetidoDeduzido, cppForaDAS,
    observacoes: obs,
  };
}

/**
 * Alíquota RAT/FAP aplicada à folha (fração). Limitada a 6% — teto legal do
 * RAT (3%) multiplicado pelo FAP máximo (2,0), conforme Lei 8.212/1991 e
 * Decreto 3.048/1999.
 */
function ratFap(p: ParametrosSimulacao): number {
  return Math.min(0.06, Math.max(0, p.aliquotaRAT ?? 0.02));
}

/**
 * Contribuições a Terceiros (Sistema S / INCRA / Salário-Educação / SEBRAE).
 * Padrão 5,8% para o FPAS 507 (comércio/indústria/serviços em geral). Empresas
 * do Simples Nacional são isentas, por isso só se aplica a Presumido e Real.
 */
function terceiros(p: ParametrosSimulacao): number {
  const base = p.aliquotaTerceiros ?? terceirosPorCnaeMotor(p);
  return Math.min(0.08, Math.max(0, base));
}

/**
 * Alíquota de Contribuições a Terceiros por divisão CNAE (fração).
 * Espelha `src/lib/tributario/folha/fpas-terceiros.ts` (validado por teste de
 * coerência). Divisões ausentes usam o padrão 5,8% (FPAS 507).
 */
const TERCEIROS_POR_DIVISAO_CNAE: Readonly<Record<string, number>> = {
  '01': 0.052, '02': 0.052, '03': 0.052,
  '64': 0.052, '65': 0.052, '66': 0.052,
  '84': 0.025,
  '85': 0.027,
};

const TERCEIROS_PADRAO = 0.058;

/** Divisão (2 primeiros dígitos) do CNAE, ou null quando inválido. */
function divisaoCnaeMotor(cnae?: string | null): string | null {
  if (!cnae) return null;
  const digitos = String(cnae).replace(/\D/g, '');
  if (digitos.length < 2) return null;
  return digitos.slice(0, 2);
}

/**
 * Alíquota de terceiros aplicável: prioriza o valor explícito informado nos
 * parâmetros; na ausência, deriva do CNAE principal; por fim usa 5,8%.
 */
function terceirosPorCnaeMotor(p: ParametrosSimulacao): number {
  const divisao = divisaoCnaeMotor(p.cnaePrincipal);
  if (!divisao) return TERCEIROS_PADRAO;
  return TERCEIROS_POR_DIVISAO_CNAE[divisao] ?? TERCEIROS_PADRAO;
}


export function simularPresumido(p: ParametrosSimulacao): ResultadoCenario {
  p = sanitizarParametros(p);
  if (p.faturamentoAnual > LIMITE_PRESUMIDO) {
    return {
      regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: false,
      motivoInelegibilidade: 'Faturamento > R$ 78 mi',
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Obrigatório Lucro Real.'],
    };
  }
  const ps = p.percentualServicos / 100;
  const pc = 1 - ps;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * pc;
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  // Presunção da receita de serviços: 32% é apenas o caso geral. Transporte de
  // cargas (8%/12%), passageiros (16%/12%) e serviços hospitalares (8%/12%)
  // têm percentuais legais próprios (Lei 9.249/95, arts. 15 e 20).
  const presIrpjServ = p.presuncaoIrpjServicos ?? 0.32;
  const presCsllServ = p.presuncaoCsllServicos ?? 0.32;
  const baseIrpj = rs * presIrpjServ + rc * 0.08;
  const irpj = baseIrpj * 0.15 + (baseIrpj > 240000 ? (baseIrpj - 240000) * 0.10 : 0);
  const csll = (rs * presCsllServ + rc * 0.12) * 0.09;
  const pis = p.faturamentoAnual * 0.0065;
  const cofins = p.faturamentoAnual * 0.03;
  const icms = rc * aliqICMS;
  const iss = rs * aliqISS;
  const cpp = Math.max(0, p.folhaAnual || 0) * (0.20 + ratFap(p) + terceiros(p));
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  return {
    regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    observacoes: [
      `Presunção 8% comércio / IRPJ ${(presIrpjServ * 100).toFixed(0)}% e CSLL ${(presCsllServ * 100).toFixed(0)}% sobre serviços.`,
      'PIS/COFINS cumulativo.',
      `ICMS ${(aliqICMS * 100).toFixed(2)}% / ISS ${(aliqISS * 100).toFixed(2)}%.`,

    ],
  };
}

export function simularReal(p: ParametrosSimulacao): ResultadoCenario {
  p = sanitizarParametros(p);
  // Defesa: margemLucro ausente/inválida não pode propagar NaN para o total.
  const margemLucro = Number.isFinite(p.margemLucro) ? Number(p.margemLucro) : 0;
  const lucro = p.faturamentoAnual * (margemLucro / 100);
  const irpj = Math.max(0, lucro * 0.15 + (lucro > 240000 ? (lucro - 240000) * 0.10 : 0));
  const csll = Math.max(0, lucro * 0.09);
  const baseCred = (p.comprasComCredito || 0) + (p.despesasOperacionais || 0);
  const pis = Math.max(0, p.faturamentoAnual * 0.0165 - baseCred * 0.0165);
  const cofins = Math.max(0, p.faturamentoAnual * 0.076 - baseCred * 0.076);
  const ps = p.percentualServicos / 100;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * (1 - ps);
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  const icms = Math.max(0, rc * aliqICMS - (p.comprasComCredito || 0) * aliqICMS);
  const iss = rs * aliqISS;
  const cpp = Math.max(0, p.folhaAnual || 0) * (0.20 + ratFap(p) + terceiros(p));
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  const observacoes = [`Lucro estimado: ${margemLucro}% do faturamento.`, 'PIS/COFINS não-cumulativo.'];
  if (lucro <= 240000) {
    observacoes.push('Sem adicional de IRPJ: lucro anual ≤ R$ 240k.');
  } else {
    observacoes.push('Adicional de IRPJ de 10% sobre o lucro excedente a R$ 240k.');
  }
  if (margemLucro < 8) {
    observacoes.push('Margem baixa (< 8%): Lucro Real tende a ser mais vantajoso; revise custos e créditos.');
  }
  return {
    regime: 'lucro_real', nome: 'Lucro Real', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    observacoes,
  };
}
