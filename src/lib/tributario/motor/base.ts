// Motor tributário (front) — Tipos, constantes fiscais (ANEXOS, limites) e cálculos de base (RBT12, folha, anexo, sanitização).
// Espelhado em supabase/functions/_shared/tributario-logic.ts; o drift guard compara os dois lados.
import { normalizar, PALAVRAS_ANEXO_IV } from '../anexos';
import { num, clamp } from '../parametros';

// LOGICA TRIBUTARIA COMPARTILHADA

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Período de apuração de IRPJ/CSLL (Lei 9.430/96). */
export type PeriodicidadeApuracao = 'trimestral' | 'anual';

export interface FaturamentoMes {
  ano: number;
  mes: number;
  receita_bruta: number;
  receita_servicos?: number;
  receita_revenda?: number;
  receita_industria?: number;
  receita_exportacao?: number;
}

export interface FolhaMes {
  ano: number;
  mes: number;
  salarios: number;
  pro_labore: number;
  encargos: number;
  total_folha: number;
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
  /**
   * Percentual (0..100) da receita bruta destinada à EXPORTAÇÃO. Recorte
   * transversal do mix: a parcela exportada é imune a PIS/COFINS
   * (CF/88 art. 149 §2º I), ICMS (art. 155 §2º X "a") e ISS
   * (art. 156 §3º II c/c LC 116/2003 art. 2º I). IRPJ/CSLL continuam devidos.
   */
  percentualExportacao?: number;

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
  /**
   * Valor anual de aquisições de mercadorias/insumos que geram crédito de ICMS.
   * Quando ausente, é derivado de `comprasComCredito` na proporção da receita
   * de mercadorias (serviços não geram crédito de ICMS).
   */
  comprasComCreditoICMS?: number;
  /** Prejuízo fiscal de IRPJ acumulado (positivo). Trava de 30% na compensação. */
  prejuizoFiscalAcumulado?: number;
  /** Base negativa de CSLL acumulada (positivo). Trava de 30% na compensação. */
  baseNegativaCsllAcumulada?: number;
  /** Período de apuração de IRPJ/CSLL no Lucro Real ('anual' por default). */
  periodicidadeApuracao?: PeriodicidadeApuracao;
  /** Lucro real por trimestre (4 posições), quando conhecido. */
  lucroTrimestral?: number[];
}

export interface ResultadoCenario {
  regime: RegimeTributario;
  nome: string;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp: number;
  icms: number;
  iss: number;
  cbs: number;
  ibs: number;
  totalTributos: number;
  cargaEfetiva: number;
  rbt12?: number;
  fatorR?: number;
  anexoAplicavel?: AnexoSimples;
  faixaAplicavel?: number;
  aliquotaNominal?: number;
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
  /** Crédito de ICMS apropriado sobre aquisições (não-cumulatividade). */
  icmsCredito?: number;
  /** Saldo credor de ICMS transportado para o período seguinte (crédito > débito). */
  icmsSaldoCredor?: number;
  prejuizoFiscalCompensado?: number;
  prejuizoFiscalSaldo?: number;
  baseNegativaCsllCompensada?: number;
  baseNegativaCsllSaldo?: number;
  /** Periodicidade de apuração de IRPJ/CSLL efetivamente aplicada. */
  periodicidadeApuracao?: PeriodicidadeApuracao;
  /** Bases de IRPJ por trimestre (apuração trimestral). */
  irpjBasesTrimestrais?: number[];
  /** Custo extra de IRPJ pela sazonalidade (trimestral − anual equivalente). */
  efeitoSazonalidadeIrpj?: number;
  /** IRPJ+CSLL devido na periodicidade alternativa (comparativo do Lucro Real). */
  irpjCsllPeriodicidadeAlternativa?: number;
  /** Economia estimada ao adotar a periodicidade recomendada no Lucro Real. */
  economiaPeriodicidade?: number;
  observacoes: string[];
}

export const ANEXOS: Record<
  AnexoSimples,
  Array<{ faixa: number; ate: number; aliq: number; pd: number }>
> = {
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
    { faixa: 3, ate: 720000, aliq: 0.1, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.112, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.147, pd: 85500 },
    { faixa: 6, ate: 4800000, aliq: 0.3, pd: 720000 },
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
 * Determina o anexo do Simples Nacional pela atividade PREPONDERANTE.
 * Corrige a simplificação anterior (apenas Anexo I x III/V), que classificava
 * indústrias (Anexo II) como comércio e ignorava o Anexo IV.
 */
export function determinarAnexoSimples(
  p: ParametrosSimulacao,
  fatorR: number
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
  let revenda =
    p.percentualRevenda === undefined || p.percentualRevenda === null
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
    percentualExportacao:
      p.percentualExportacao === undefined || p.percentualExportacao === null
        ? undefined
        : clamp(num(p.percentualExportacao, 0), 0, 100),

    folhaAnual: Math.max(0, num(p.folhaAnual, 0)),
    comprasComCredito: Math.max(0, num(p.comprasComCredito, 0)),
    despesasOperacionais: Math.max(0, num(p.despesasOperacionais, 0)),
    comprasComCreditoICMS:
      p.comprasComCreditoICMS === undefined
        ? undefined
        : Math.max(0, num(p.comprasComCreditoICMS, 0)),

    aliquotaICMS: p.aliquotaICMS === undefined ? undefined : clamp(num(p.aliquotaICMS, 0.18), 0, 1),
    aliquotaISS: p.aliquotaISS === undefined ? undefined : clamp(num(p.aliquotaISS, 0.05), 0, 1),
    aliquotaRAT: p.aliquotaRAT === undefined ? undefined : clamp(num(p.aliquotaRAT, 0.02), 0, 0.06),
    aliquotaTerceiros:
      p.aliquotaTerceiros === undefined
        ? undefined
        : clamp(num(p.aliquotaTerceiros, 0.058), 0, 0.1),
    issRetidoFonte: Math.max(0, num(p.issRetidoFonte, 0)),
    presuncaoIrpjServicos:
      p.presuncaoIrpjServicos === undefined
        ? undefined
        : clamp(num(p.presuncaoIrpjServicos, 0.32), 0.08, 0.32),
    presuncaoCsllServicos:
      p.presuncaoCsllServicos === undefined
        ? undefined
        : clamp(num(p.presuncaoCsllServicos, 0.32), 0.12, 0.32),

    prejuizoFiscalAcumulado: Math.max(0, num(p.prejuizoFiscalAcumulado, 0)),
    baseNegativaCsllAcumulada: Math.max(0, num(p.baseNegativaCsllAcumulada, 0)),
    sublimiteEstadual:
      p.sublimiteEstadual === undefined
        ? undefined
        : Math.max(0, num(p.sublimiteEstadual, 3600000)),
    periodicidadeApuracao:
      p.periodicidadeApuracao === 'trimestral'
        ? 'trimestral'
        : p.periodicidadeApuracao === 'anual'
          ? 'anual'
          : undefined,
    lucroTrimestral:
      Array.isArray(p.lucroTrimestral) && p.lucroTrimestral.length === 4
        ? p.lucroTrimestral.map((v) => num(v, 0))
        : undefined,
  };
}
