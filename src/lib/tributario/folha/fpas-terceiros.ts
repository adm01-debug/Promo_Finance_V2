/**
 * FPAS / Contribuições a Terceiros por atividade (CNAE)
 * ------------------------------------------------------
 * O código FPAS define quais entidades de terceiros incidem sobre a folha de
 * pagamento (Salário-Educação, INCRA, SENAI/SENAC/SENAT/SENAR, SESI/SESC/SEST,
 * SEBRAE). A soma dessas alíquotas é o "percentual de terceiros" somado à CPP
 * patronal (20%) e ao RAT/FAP.
 *
 * Base legal: Lei 8.212/1991 art. 22, Lei 11.457/2007 art. 3º, IN RFB 2.110/2022
 * (Anexo II — Tabela de Códigos FPAS e Terceiros).
 *
 * IMPORTANTE: empresas optantes pelo Simples Nacional são ISENTAS das
 * contribuições a terceiros (LC 123/2006, art. 13, §3º) — exceto quanto ao
 * Anexo IV, que recolhe apenas CPP + RAT, sem terceiros.
 */

export interface FpasInfo {
  /** Código FPAS (IN RFB 2.110/2022). */
  codigo: string;
  /** Descrição da atividade enquadrada. */
  descricao: string;
  /** Código de Terceiros (FPAS/Terceiros). */
  codigoTerceiros: string;
  /** Alíquota total de terceiros (fração, ex.: 0.058 = 5,8%). */
  aliquotaTerceiros: number;
  /** Composição detalhada da alíquota (frações). */
  composicao: {
    salarioEducacao: number;
    incra: number;
    senaiSenacSenatSenar: number;
    sesiSescSest: number;
    sebrae: number;
  };
}

const c = (
  salarioEducacao: number,
  incra: number,
  senaiSenacSenatSenar: number,
  sesiSescSest: number,
  sebrae: number,
): FpasInfo['composicao'] => ({
  salarioEducacao,
  incra,
  senaiSenacSenatSenar,
  sesiSescSest,
  sebrae,
});

const soma = (x: FpasInfo['composicao']): number =>
  Number(
    (
      x.salarioEducacao +
      x.incra +
      x.senaiSenacSenatSenar +
      x.sesiSescSest +
      x.sebrae
    ).toFixed(5),
  );

function fpas(
  codigo: string,
  descricao: string,
  codigoTerceiros: string,
  composicao: FpasInfo['composicao'],
): FpasInfo {
  return {
    codigo,
    descricao,
    codigoTerceiros,
    aliquotaTerceiros: soma(composicao),
    composicao,
  };
}

/** Tabela de códigos FPAS suportados. */
export const TABELA_FPAS: readonly FpasInfo[] = [
  // Indústria: SE 2,5 + INCRA 0,2 + SENAI 1,0 + SESI 1,5 + SEBRAE 0,6 = 5,8%
  fpas('507', 'Indústria e comércio em geral', '0079', c(0.025, 0.002, 0.01, 0.015, 0.006)),
  // Comércio/serviços em geral (SENAC/SESC) — mesma composição de 5,8%
  fpas('515', 'Comércio atacadista/varejista e serviços', '0079', c(0.025, 0.002, 0.01, 0.015, 0.006)),
  // Transporte rodoviário: SENAT 1,0 + SEST 1,5
  fpas('612', 'Transporte rodoviário de cargas e passageiros', '0083', c(0.025, 0.002, 0.01, 0.015, 0.006)),
  // Construção civil: sem SEBRAE adicional? Mantém 5,8% (SENAI/SESI)
  fpas('507-CC', 'Construção civil', '0079', c(0.025, 0.002, 0.01, 0.015, 0.006)),
  // Instituições financeiras: SE 2,5 + INCRA 0,2 + SENAC 1,0 + SESC 1,5 (sem SEBRAE)
  fpas('558', 'Instituições financeiras e equiparadas', '0115', c(0.025, 0.002, 0.01, 0.015, 0)),
  // Agroindústria / produtor rural PJ: SE 2,5 + INCRA 0,2 + SENAR 2,5
  fpas('604', 'Agroindústria e produção rural (PJ)', '0515', c(0.025, 0.002, 0.025, 0, 0)),
  // Ensino/entidades sem SEBRAE nem SENAI
  fpas('574', 'Estabelecimentos de ensino e entidades', '0003', c(0.025, 0.002, 0, 0, 0)),
  // Administração pública / órgãos: apenas salário-educação
  fpas('582', 'Órgãos públicos e autarquias', '0001', c(0.025, 0, 0, 0, 0)),
] as const;

const FPAS_POR_CODIGO = new Map(TABELA_FPAS.map((f) => [f.codigo, f]));

/** FPAS padrão quando a atividade não é reconhecida (indústria/comércio geral). */
export const FPAS_PADRAO = FPAS_POR_CODIGO.get('507')!;

/**
 * Mapa de prefixos de divisão CNAE (2 dígitos) para código FPAS.
 * Ordem de avaliação: divisão (2 dígitos) — a seção do CNAE não é ambígua nesse nível.
 */
const DIVISAO_PARA_FPAS: Readonly<Record<string, string>> = {
  // Seção A — Agricultura, pecuária, produção florestal, pesca (01-03)
  '01': '604', '02': '604', '03': '604',
  // Seções B/C/D/E — Indústria extrativa, transformação, utilidades (05-39)
  '05': '507', '06': '507', '07': '507', '08': '507', '09': '507',
  '10': '507', '11': '507', '12': '507', '13': '507', '14': '507',
  '15': '507', '16': '507', '17': '507', '18': '507', '19': '507',
  '20': '507', '21': '507', '22': '507', '23': '507', '24': '507',
  '25': '507', '26': '507', '27': '507', '28': '507', '29': '507',
  '30': '507', '31': '507', '32': '507', '33': '507', '35': '507',
  '36': '507', '37': '507', '38': '507', '39': '507',
  // Seção F — Construção (41-43)
  '41': '507-CC', '42': '507-CC', '43': '507-CC',
  // Seção G — Comércio (45-47)
  '45': '515', '46': '515', '47': '515',
  // Seção H — Transporte e armazenagem (49-53)
  '49': '612', '50': '612', '51': '612', '52': '612', '53': '612',
  // Seções I/J/L/M/N/R/S — Serviços em geral
  '55': '515', '56': '515', '58': '515', '59': '515', '60': '515',
  '61': '515', '62': '515', '63': '515', '68': '515', '69': '515',
  '70': '515', '71': '515', '72': '515', '73': '515', '74': '515',
  '75': '515', '77': '515', '78': '515', '79': '515', '80': '515',
  '81': '515', '82': '515', '90': '515', '91': '515', '92': '515',
  '93': '515', '94': '515', '95': '515', '96': '515',
  // Seção K — Atividades financeiras e de seguros (64-66)
  '64': '558', '65': '558', '66': '558',
  // Seção P — Educação (85)
  '85': '574',
  // Seção Q — Saúde humana e serviços sociais (86-88)
  '86': '515', '87': '515', '88': '515',
  // Seção O — Administração pública (84)
  '84': '582',
};

/** Extrai a divisão (2 primeiros dígitos) de um CNAE em qualquer formatação. */
export function divisaoCnae(cnae: string | null | undefined): string | null {
  if (!cnae) return null;
  const digitos = String(cnae).replace(/\D/g, '');
  if (digitos.length < 2) return null;
  return digitos.slice(0, 2);
}

/**
 * Resolve o enquadramento FPAS a partir do CNAE principal.
 * Retorna o FPAS padrão (507 — 5,8%) quando o CNAE é inválido ou desconhecido,
 * garantindo comportamento conservador (nunca subestima a carga).
 */
export function resolverFpasPorCnae(cnae: string | null | undefined): FpasInfo {
  const divisao = divisaoCnae(cnae);
  if (!divisao) return FPAS_PADRAO;
  const codigo = DIVISAO_PARA_FPAS[divisao];
  if (!codigo) return FPAS_PADRAO;
  return FPAS_POR_CODIGO.get(codigo) ?? FPAS_PADRAO;
}

/**
 * Alíquota de terceiros (fração) aplicável ao CNAE informado.
 * Simples Nacional é isento (LC 123/2006 art. 13, §3º).
 */
export function aliquotaTerceirosPorCnae(
  cnae: string | null | undefined,
  opcoes?: { simplesNacional?: boolean },
): number {
  if (opcoes?.simplesNacional) return 0;
  return resolverFpasPorCnae(cnae).aliquotaTerceiros;
}

/** Busca um FPAS pelo código exato. */
export function buscarFpas(codigo: string): FpasInfo | null {
  return FPAS_POR_CODIGO.get(codigo) ?? null;
}
