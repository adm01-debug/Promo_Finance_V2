// MOTOR DE TRIBUTAÇÃO DA PESSOA FÍSICA VINCULADA — Lei 15.270/2025
//
// Modelo anual do sócio, cobrindo os três eixos criados/alterados pela lei:
//   1. IRPF progressivo sobre pró-labore (tabela 2026 com isenção ampliada até R$ 5.000);
//   2. IRRF de 10% sobre dividendos quando o pagamento mensal da mesma fonte excede R$ 50.000;
//   3. IRPFM (Imposto de Renda Pessoa Física Mínimo) — alíquota LINEAR de 0% a 10% para renda
//      total anual entre R$ 600.000 e R$ 1.200.000, e 10% acima disso, com o IR já pago no ano
//      (IRPF + IRRF) abatido; a diferença é recolhida como complemento na DAA.
//
// Observação importante: este módulo é a fonte de verdade para a simulação ANUAL do sócio.
// O módulo `irpfm.ts` mantém a visão mensal legada de distribuição de dividendos.

/** Teto mensal de dividendos por fonte pagadora sem IRRF (Lei 15.270/2025, art. 6º-A). */
export const PF_LIMITE_IRRF_DIVIDENDOS_MENSAL = 50_000;
/** Alíquota do IRRF sobre dividendos acima do limite mensal. */
export const PF_ALIQUOTA_IRRF_DIVIDENDOS = 0.1;
/** Piso da renda total anual a partir do qual o IRPFM começa a incidir. */
export const PF_IRPFM_PISO_ANUAL = 600_000;
/** Teto da faixa linear: acima disso a alíquota mínima é fixa em 10%. */
export const PF_IRPFM_TETO_ANUAL = 1_200_000;
/** Alíquota máxima do IRPFM. */
export const PF_IRPFM_ALIQUOTA_MAXIMA = 0.1;
/** Faixa de isenção mensal do IRPF a partir de 2026. */
export const PF_IRPF_ISENCAO_MENSAL = 5_000;
/** Limite superior do desconto redutor da isenção ampliada. */
export const PF_IRPF_LIMITE_REDUTOR_MENSAL = 7_350;
/** Teto mensal aproximado da contribuição previdenciária do contribuinte individual (2026). */
export const PF_INSS_TETO_MENSAL = 908;
/** Alíquota conservadora aplicada a "outras rendas" (ganho de capital padrão). */
export const PF_ALIQUOTA_OUTRAS_RENDAS = 0.15;

export type SeveridadeAlertaPF = 'alta' | 'media' | 'baixa';

export interface AlertaPF {
  tipo: 'PRO_LABORE_BAIXO' | 'IRRF_10' | 'IRPFM' | 'SEM_PRO_LABORE';
  severidade: SeveridadeAlertaPF;
  mensagem: string;
}

export interface ParametrosSimulacaoPF {
  /** Pró-labore bruto mensal (R$). */
  proLaboreMensal: number;
  /** Dividendos distribuídos por mês pela mesma fonte pagadora (R$). */
  dividendosMensais: number;
  /** Demais rendimentos anuais do sócio (aluguéis, ganho de capital etc.). */
  outrasRendasAnuais?: number;
}

export interface DetalheIRPFM {
  aplicavel: boolean;
  /** Alíquota mínima efetiva (0 a 0,10). */
  aliquotaMinima: number;
  baseCalculo: number;
  impostoMinimo: number;
  /** IRPF + IRRF já recolhidos no ano-calendário. */
  irJaPago: number;
  /** Complemento a recolher na Declaração de Ajuste Anual. */
  complementarDaa: number;
}

export interface ResultadoSimulacaoPF {
  rendaTotalAnual: number;
  proLaboreAnual: number;
  dividendosAnuais: number;
  outrasRendasAnuais: number;

  irpfProLabore: number;
  irrfDividendos: number;
  outrasRendasTributadas: number;
  inss: number;

  irpfm: DetalheIRPFM;

  totalTributadoAnual: number;
  percentualDaRenda: number;
  rendaLiquidaAnual: number;

  alertas: AlertaPF[];
  baseLegal: string;
}

function sanitizar(valor: number | undefined | null): number {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * IRPF mensal sobre o pró-labore conforme a tabela vigente a partir de 2026.
 *
 * Até R$ 5.000 há isenção integral. Entre R$ 5.000 e R$ 7.350 aplica-se um redutor
 * decrescente e linear que zera na fronteira superior, evitando salto de carga.
 */
export function calcularIrpfMensal(baseMensal: number): number {
  const base = sanitizar(baseMensal);
  if (base <= PF_IRPF_ISENCAO_MENSAL) return 0;

  const bruto = base * 0.275 - 908.73;

  if (base <= PF_IRPF_LIMITE_REDUTOR_MENSAL) {
    const amplitude = PF_IRPF_LIMITE_REDUTOR_MENSAL - PF_IRPF_ISENCAO_MENSAL;
    const progresso = (base - PF_IRPF_ISENCAO_MENSAL) / amplitude;
    const reducao = Math.max(0, 312.89 * (1 - progresso));
    return Math.max(0, bruto - reducao);
  }

  return Math.max(0, bruto);
}

/**
 * Alíquota mínima do IRPFM em função da renda total anual.
 *
 * Progressão linear: 0% em R$ 600.000 → 10% em R$ 1.200.000 (1 p.p. a cada R$ 60.000).
 */
export function calcularAliquotaIrpfm(rendaTotalAnual: number): number {
  const renda = sanitizar(rendaTotalAnual);
  if (renda > PF_IRPFM_TETO_ANUAL) return PF_IRPFM_ALIQUOTA_MAXIMA;
  if (renda > PF_IRPFM_PISO_ANUAL) {
    return ((renda - PF_IRPFM_PISO_ANUAL) / 60_000) * 0.01;
  }
  return 0;
}

function gerarAlertasPF(
  proLaboreMensal: number,
  dividendosMensais: number,
  rendaTotalAnual: number,
): AlertaPF[] {
  const alertas: AlertaPF[] = [];

  if (proLaboreMensal <= 0 && rendaTotalAnual > 0) {
    alertas.push({
      tipo: 'SEM_PRO_LABORE',
      severidade: 'alta',
      mensagem:
        'Sócio administrador sem pró-labore. A ausência de remuneração configura risco de autuação previdenciária.',
    });
  } else if (proLaboreMensal < 3_000 && rendaTotalAnual > 200_000) {
    alertas.push({
      tipo: 'PRO_LABORE_BAIXO',
      severidade: 'alta',
      mensagem:
        'Pró-labore muito baixo para o volume distribuído. Risco fiscal de desconsideração (pejotização).',
    });
  }

  if (dividendosMensais > PF_LIMITE_IRRF_DIVIDENDOS_MENSAL) {
    alertas.push({
      tipo: 'IRRF_10',
      severidade: 'media',
      mensagem:
        'Dividendos acima de R$ 50.000/mês da mesma fonte pagadora sofrem IRRF de 10% na distribuição.',
    });
  }

  if (rendaTotalAnual > PF_IRPFM_PISO_ANUAL) {
    alertas.push({
      tipo: 'IRPFM',
      severidade: rendaTotalAnual > PF_IRPFM_TETO_ANUAL ? 'alta' : 'media',
      mensagem:
        'Renda total anual acima de R$ 600.000 sujeita o sócio ao IRPFM (alíquota mínima de até 10%).',
    });
  }

  return alertas;
}

/**
 * Simula a carga tributária anual da pessoa física vinculada à empresa.
 *
 * @param params - Pró-labore e dividendos mensais + outras rendas anuais do sócio.
 * @returns Composição completa da carga (IRPF, IRRF, IRPFM, INSS) com alertas acionáveis.
 */
export function simularPessoaFisica(params: ParametrosSimulacaoPF): ResultadoSimulacaoPF {
  const proLaboreMensal = sanitizar(params.proLaboreMensal);
  const dividendosMensais = sanitizar(params.dividendosMensais);
  const outrasRendasAnuais = sanitizar(params.outrasRendasAnuais);

  const proLaboreAnual = proLaboreMensal * 12;
  const dividendosAnuais = dividendosMensais * 12;
  const rendaTotalAnual = proLaboreAnual + dividendosAnuais + outrasRendasAnuais;

  // IRRF 10% incide sobre o valor integral quando o pagamento mensal supera o limite.
  const irrfDividendosMensal =
    dividendosMensais > PF_LIMITE_IRRF_DIVIDENDOS_MENSAL
      ? dividendosMensais * PF_ALIQUOTA_IRRF_DIVIDENDOS
      : 0;
  const irrfDividendos = irrfDividendosMensal * 12;

  const irpfProLabore = calcularIrpfMensal(proLaboreMensal) * 12;
  const outrasRendasTributadas = outrasRendasAnuais * PF_ALIQUOTA_OUTRAS_RENDAS;
  const inss = Math.min(proLaboreMensal * 0.11, PF_INSS_TETO_MENSAL) * 12;

  const aliquotaMinima = calcularAliquotaIrpfm(rendaTotalAnual);
  const impostoMinimo = rendaTotalAnual * aliquotaMinima;
  const irJaPago = irpfProLabore + irrfDividendos;
  const complementarDaa = Math.max(0, impostoMinimo - irJaPago);

  const totalTributadoAnual =
    irpfProLabore + irrfDividendos + complementarDaa + outrasRendasTributadas + inss;

  return {
    rendaTotalAnual,
    proLaboreAnual,
    dividendosAnuais,
    outrasRendasAnuais,

    irpfProLabore,
    irrfDividendos,
    outrasRendasTributadas,
    inss,

    irpfm: {
      aplicavel: aliquotaMinima > 0,
      aliquotaMinima,
      baseCalculo: rendaTotalAnual,
      impostoMinimo,
      irJaPago,
      complementarDaa,
    },

    totalTributadoAnual,
    percentualDaRenda: rendaTotalAnual > 0 ? (totalTributadoAnual / rendaTotalAnual) * 100 : 0,
    rendaLiquidaAnual: rendaTotalAnual - totalTributadoAnual,

    alertas: gerarAlertasPF(proLaboreMensal, dividendosMensais, rendaTotalAnual),
    baseLegal: 'Lei 15.270/2025',
  };
}

/**
 * Varre combinações de pró-labore para encontrar o ponto de menor carga total do sócio,
 * mantendo constante a remuneração bruta (pró-labore + dividendos).
 */
export function otimizarProLabore(
  params: ParametrosSimulacaoPF,
  passo = 1_000,
): { melhorProLaboreMensal: number; melhorCarga: number; cargaAtual: number; economia: number } {
  const proLaboreMensal = sanitizar(params.proLaboreMensal);
  const dividendosMensais = sanitizar(params.dividendosMensais);
  const remuneracaoMensal = proLaboreMensal + dividendosMensais;

  const atual = simularPessoaFisica(params);
  let melhorProLaboreMensal = proLaboreMensal;
  let melhorCarga = atual.totalTributadoAnual;

  const incremento = Math.max(500, passo);
  for (let pl = 0; pl <= remuneracaoMensal; pl += incremento) {
    const cenario = simularPessoaFisica({
      proLaboreMensal: pl,
      dividendosMensais: remuneracaoMensal - pl,
      outrasRendasAnuais: params.outrasRendasAnuais,
    });
    if (cenario.totalTributadoAnual < melhorCarga - 0.01) {
      melhorCarga = cenario.totalTributadoAnual;
      melhorProLaboreMensal = pl;
    }
  }

  return {
    melhorProLaboreMensal,
    melhorCarga,
    cargaAtual: atual.totalTributadoAnual,
    economia: Math.max(0, atual.totalTributadoAnual - melhorCarga),
  };
}
