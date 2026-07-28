// DERIVAÇÃO DE ATIVIDADE PRESUMIDA A PARTIR DO CNAE
// Base legal: Lei 9.249/95, arts. 15 e 20 (percentuais de presunção) combinada
// com a estrutura de divisões da CNAE 2.3 (IBGE/CONCLA).
//
// O objetivo é eliminar o erro humano na seleção manual da atividade no
// simulador: informado o CNAE preponderante, o motor deriva a atividade e,
// por consequência, os percentuais legais de presunção de IRPJ e CSLL.

import type { AtividadePresumido } from './types';

/** Normaliza CNAE em qualquer formato (0000-0/00, 00.00-0-00, 0000000) para 7 dígitos. */
export function normalizarCnae(cnae: string | null | undefined): string | null {
  if (typeof cnae !== 'string') return null;
  const digitos = cnae.replace(/\D/g, '');
  if (digitos.length < 5) return null;
  return digitos.slice(0, 7).padEnd(7, '0');
}

export interface AtividadeDerivada {
  atividade: AtividadePresumido;
  /** Percentual de presunção de IRPJ aplicável (decimal). */
  presuncaoIrpj: number;
  /** Percentual de presunção de CSLL aplicável (decimal). */
  presuncaoCsll: number;
  /** Origem da derivação — usada na memória de cálculo e na UI. */
  origem: 'subclasse' | 'divisao' | 'secao' | 'fallback';
  fundamento: string;
}

const PRESUNCAO: Record<AtividadePresumido, [number, number]> = {
  comercio: [0.08, 0.12],
  industria: [0.08, 0.12],
  servicos_geral: [0.32, 0.32],
  servicos_profissionais: [0.32, 0.32],
  transporte_cargas: [0.08, 0.12],
  transporte_passageiros: [0.16, 0.12],
  servicos_hospitalares: [0.08, 0.12],
};

/**
 * Subclasses específicas que fogem do comportamento da divisão.
 * Chave = prefixo do CNAE normalizado (7 dígitos).
 */
const SUBCLASSES: ReadonlyArray<readonly [string, AtividadePresumido, string]> = [
  // Transporte rodoviário: 4930 = cargas; 4921/4922/4923/4924/4929 = passageiros
  ['4930', 'transporte_cargas', 'CNAE 4930 — transporte rodoviário de carga'],
  ['4921', 'transporte_passageiros', 'CNAE 4921 — transporte coletivo urbano'],
  ['4922', 'transporte_passageiros', 'CNAE 4922 — transporte rodoviário coletivo'],
  ['4923', 'transporte_passageiros', 'CNAE 4923 — táxi'],
  ['4924', 'transporte_passageiros', 'CNAE 4924 — transporte escolar'],
  ['4929', 'transporte_passageiros', 'CNAE 4929 — outros transportes de passageiros'],
  ['5011', 'transporte_passageiros', 'CNAE 5011 — navegação de passageiros'],
  ['5012', 'transporte_cargas', 'CNAE 5012 — navegação de carga'],
  ['5021', 'transporte_passageiros', 'CNAE 5021 — navegação interior de passageiros'],
  ['5022', 'transporte_cargas', 'CNAE 5022 — navegação interior de carga'],
  ['5111', 'transporte_passageiros', 'CNAE 5111 — transporte aéreo de passageiros'],
  ['5112', 'transporte_cargas', 'CNAE 5112 — transporte aéreo de carga'],
  ['5120', 'transporte_cargas', 'CNAE 5120 — transporte aéreo de carga'],
  ['4911', 'transporte_passageiros', 'CNAE 4911 — transporte ferroviário de passageiros'],
  ['4912', 'transporte_cargas', 'CNAE 4912 — transporte ferroviário de carga'],
  // Serviços hospitalares (8%/12% exige estrutura hospitalar — IN RFB 1.700/17, art. 33)
  ['8610', 'servicos_hospitalares', 'CNAE 8610 — atividades de atendimento hospitalar'],
  ['8621', 'servicos_hospitalares', 'CNAE 8621 — UTI móvel'],
  ['8622', 'servicos_hospitalares', 'CNAE 8622 — atendimento móvel de urgência'],
  ['8630', 'servicos_hospitalares', 'CNAE 8630 — atenção ambulatorial'],
  ['8640', 'servicos_hospitalares', 'CNAE 8640 — serviços de diagnóstico e terapia'],
];

/** Divisões (2 primeiros dígitos) → atividade preponderante. */
const DIVISOES: Readonly<Record<string, AtividadePresumido>> = {
  // Agropecuária e extrativa equiparadas a indústria para fins de presunção
  '01': 'industria', '02': 'industria', '03': 'industria',
  '05': 'industria', '06': 'industria', '07': 'industria', '08': 'industria', '09': 'industria',
  // Indústria de transformação (10..33)
  ...Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => [String(10 + i).padStart(2, '0'), 'industria' as const]),
  ),
  // Utilidades e construção
  '35': 'industria', '36': 'industria', '37': 'industria', '38': 'industria', '39': 'industria',
  '41': 'industria', '42': 'industria', '43': 'industria',
  // Comércio
  '45': 'comercio', '46': 'comercio', '47': 'comercio',
  // Transporte / armazenagem / correio
  '49': 'transporte_cargas', '50': 'transporte_cargas', '51': 'transporte_cargas',
  '52': 'servicos_geral', '53': 'servicos_geral',
  // Serviços em geral
  '55': 'servicos_geral', '56': 'servicos_geral',
  '58': 'servicos_geral', '59': 'servicos_geral', '60': 'servicos_geral',
  '61': 'servicos_geral', '62': 'servicos_geral', '63': 'servicos_geral',
  '64': 'servicos_geral', '65': 'servicos_geral', '66': 'servicos_geral',
  '68': 'servicos_geral',
  // Serviços profissionais, científicos e técnicos
  '69': 'servicos_profissionais', '70': 'servicos_profissionais',
  '71': 'servicos_profissionais', '72': 'servicos_profissionais',
  '73': 'servicos_profissionais', '74': 'servicos_profissionais',
  '75': 'servicos_profissionais',
  // Administrativos e complementares
  '77': 'servicos_geral', '78': 'servicos_geral', '79': 'servicos_geral',
  '80': 'servicos_geral', '81': 'servicos_geral', '82': 'servicos_geral',
  // Administração pública, educação
  '84': 'servicos_geral', '85': 'servicos_geral',
  // Saúde
  '86': 'servicos_hospitalares', '87': 'servicos_geral', '88': 'servicos_geral',
  // Arte, cultura, esporte, outros serviços
  '90': 'servicos_geral', '91': 'servicos_geral', '92': 'servicos_geral', '93': 'servicos_geral',
  '94': 'servicos_geral', '95': 'servicos_geral', '96': 'servicos_geral',
  '97': 'servicos_geral', '99': 'servicos_geral',
};

function montar(
  atividade: AtividadePresumido,
  origem: AtividadeDerivada['origem'],
  fundamento: string,
): AtividadeDerivada {
  const [presuncaoIrpj, presuncaoCsll] = PRESUNCAO[atividade];
  return { atividade, presuncaoIrpj, presuncaoCsll, origem, fundamento };
}

/**
 * Deriva a atividade presumida a partir do CNAE preponderante.
 * Retorna sempre um resultado válido — na ausência de correspondência aplica
 * o fallback conservador de serviços gerais (32%), o mais oneroso, evitando
 * subestimar o tributo devido.
 */
export function derivarAtividadePresumido(cnae: string | null | undefined): AtividadeDerivada {
  const normalizado = normalizarCnae(cnae);
  if (!normalizado) {
    return montar('servicos_geral', 'fallback', 'CNAE não informado — presunção geral de 32%');
  }

  const subclasse = SUBCLASSES.find(([prefixo]) => normalizado.startsWith(prefixo));
  if (subclasse) return montar(subclasse[1], 'subclasse', subclasse[2]);

  const divisao = normalizado.slice(0, 2);
  const porDivisao = DIVISOES[divisao];
  if (porDivisao) {
    return montar(porDivisao, 'divisao', `CNAE divisão ${divisao} — Lei 9.249/95, arts. 15 e 20`);
  }

  return montar(
    'servicos_geral',
    'fallback',
    `CNAE divisão ${divisao} sem mapeamento — presunção geral de 32%`,
  );
}
