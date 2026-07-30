// MOTOR DE FOLHA — Tabelas oficiais (FPAS/Terceiros, RAT por CNAE, limites do FAP)

import type { CodigoFpas, GrauRisco } from './types';

/** Limites legais do FAP — Lei 10.666/03, art. 10 e Decreto 6.042/07. */
export const FAP_MINIMO = 0.5;
export const FAP_MAXIMO = 2.0;

/** RAT ajustado não pode ficar fora destes limites (RAT 1%..3% × FAP 0,5..2,0). */
export const RAT_AJUSTADO_MINIMO = 0.005;
export const RAT_AJUSTADO_MAXIMO = 0.06;

/** Alíquota padrão de FGTS sobre a remuneração do empregado (Lei 8.036/90). */
export const ALIQUOTA_FGTS = 0.08;

/** Contribuição previdenciária patronal básica (Lei 8.212/91, art. 22, I). */
export const ALIQUOTA_CPP = 0.20;

/**
 * Códigos FPAS mais usuais e o respectivo pacote de Terceiros.
 * Fonte: Instrução Normativa RFB 2.110/2022, Anexo II.
 */
export const TABELA_FPAS: CodigoFpas[] = [
  {
    fpas: '507',
    descricao: 'Indústria em geral',
    aliquotaTerceiros: 0.058,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAI: 0.01, SESI: 0.015, SEBRAE: 0.006 },
  },
  {
    fpas: '515',
    descricao: 'Comércio atacadista e varejista',
    aliquotaTerceiros: 0.058,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAC: 0.01, SESC: 0.015, SEBRAE: 0.006 },
  },
  {
    fpas: '520',
    descricao: 'Transporte rodoviário de cargas e passageiros',
    aliquotaTerceiros: 0.058,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAT: 0.01, SEST: 0.015, SEBRAE: 0.006 },
  },
  {
    fpas: '523',
    descricao: 'Prestação de serviços (estabelecimentos de serviços em geral)',
    aliquotaTerceiros: 0.058,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAC: 0.01, SESC: 0.015, SEBRAE: 0.006 },
  },
  {
    fpas: '566',
    descricao: 'Entidades sem fins lucrativos / serviços sociais',
    aliquotaTerceiros: 0.03,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SEBRAE: 0.003 },
  },
  {
    fpas: '582',
    descricao: 'Construção civil',
    aliquotaTerceiros: 0.055,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAI: 0.01, SESI: 0.015, SEBRAE: 0.003 },
  },
  {
    fpas: '787',
    descricao: 'Educação básica e superior',
    aliquotaTerceiros: 0.058,
    composicao: { 'Salário-Educação': 0.025, INCRA: 0.002, SENAC: 0.01, SESC: 0.015, SEBRAE: 0.006 },
  },
];

export const FPAS_PADRAO = '515';

export function buscarFpas(codigo?: string): CodigoFpas {
  const alvo = (codigo ?? FPAS_PADRAO).trim();
  return TABELA_FPAS.find((f) => f.fpas === alvo)
    ?? TABELA_FPAS.find((f) => f.fpas === FPAS_PADRAO)!;
}

/**
 * Grau de risco por prefixo de CNAE (divisão — 2 primeiros dígitos).
 * Aproximação operacional do Anexo V do Decreto 3.048/99: o CNAE completo
 * pode divergir, por isso o override explícito (`aliquotaRat`) sempre prevalece.
 */
const GRAU_POR_DIVISAO_CNAE: Record<string, GrauRisco> = {
  '01': 'medio', '02': 'grave', '03': 'grave',
  '05': 'grave', '06': 'grave', '07': 'grave', '08': 'grave', '09': 'grave',
  '10': 'medio', '11': 'medio', '12': 'medio', '13': 'medio', '14': 'leve',
  '15': 'medio', '16': 'grave', '17': 'grave', '18': 'medio', '19': 'grave',
  '20': 'grave', '21': 'medio', '22': 'medio', '23': 'grave', '24': 'grave',
  '25': 'grave', '26': 'medio', '27': 'medio', '28': 'medio', '29': 'medio',
  '30': 'grave', '31': 'medio', '32': 'medio', '33': 'medio',
  '35': 'medio', '36': 'medio', '37': 'grave', '38': 'grave', '39': 'grave',
  '41': 'grave', '42': 'grave', '43': 'grave',
  '45': 'medio', '46': 'leve', '47': 'leve',
  '49': 'grave', '50': 'grave', '51': 'medio', '52': 'medio', '53': 'medio',
  '55': 'leve', '56': 'leve',
  '58': 'leve', '59': 'leve', '60': 'leve', '61': 'leve', '62': 'leve', '63': 'leve',
  '64': 'leve', '65': 'leve', '66': 'leve',
  '68': 'leve', '69': 'leve', '70': 'leve', '71': 'leve', '72': 'leve', '73': 'leve',
  '74': 'leve', '75': 'leve', '77': 'leve', '78': 'medio', '79': 'leve',
  '80': 'grave', '81': 'medio', '82': 'leve',
  '84': 'leve', '85': 'leve', '86': 'medio', '87': 'medio', '88': 'leve',
  '90': 'leve', '91': 'leve', '92': 'medio', '93': 'medio',
  '94': 'leve', '95': 'leve', '96': 'leve', '97': 'leve', '99': 'leve',
};

/** Extrai o grau de risco a partir de um CNAE em qualquer formato (0000-0/00). */
export function grauRiscoPorCnae(cnae?: string | null): GrauRisco | undefined {
  if (!cnae) return undefined;
  const digitos = cnae.replace(/\D/g, '');
  if (digitos.length < 2) return undefined;
  return GRAU_POR_DIVISAO_CNAE[digitos.slice(0, 2)];
}

/** Alíquotas de CPRB usuais (Lei 12.546/11, arts. 7º e 8º). */
export const ALIQUOTAS_CPRB: { setor: string; aliquota: number }[] = [
  { setor: 'TI e TIC', aliquota: 0.045 },
  { setor: 'Call center', aliquota: 0.03 },
  { setor: 'Transporte rodoviário coletivo', aliquota: 0.02 },
  { setor: 'Transporte rodoviário de cargas', aliquota: 0.015 },
  { setor: 'Construção civil', aliquota: 0.045 },
  { setor: 'Indústria (produtos do Anexo I)', aliquota: 0.025 },
];
