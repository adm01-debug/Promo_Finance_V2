import type { AliquotaUf, OrigemMercadoria, RegiaoFiscal, UF } from './types';

/** Alíquota interestadual reduzida (S/SE → N/NE/CO/ES). RSF 22/1989, art. 1º, II. */
export const ALIQUOTA_INTERESTADUAL_REDUZIDA = 0.07;
/** Alíquota interestadual geral. RSF 22/1989, art. 1º, caput. */
export const ALIQUOTA_INTERESTADUAL_GERAL = 0.12;
/** Alíquota interestadual para mercadoria importada. RSF 13/2012, art. 1º. */
export const ALIQUOTA_INTERESTADUAL_IMPORTADO = 0.04;

/** Origens da Tabela A que caracterizam mercadoria importada para a RSF 13/2012. */
export const ORIGENS_IMPORTADAS: readonly OrigemMercadoria[] = [1, 2, 3, 6, 7, 8];

/**
 * Alíquotas modais internas e adicional de FCP por UF (vigência 2025/2026).
 * Valores modais: operações com produtos específicos podem ter alíquota própria
 * e devem ser informadas via override em `aliquotaInternaDestino`.
 */
export const ALIQUOTAS_UF: Record<UF, AliquotaUf> = {
  AC: { interna: 0.19, fcp: 0.02, regiao: 'N', nome: 'Acre' },
  AL: { interna: 0.20, fcp: 0.01, regiao: 'NE', nome: 'Alagoas' },
  AP: { interna: 0.18, fcp: 0.00, regiao: 'N', nome: 'Amapá' },
  AM: { interna: 0.20, fcp: 0.02, regiao: 'N', nome: 'Amazonas' },
  BA: { interna: 0.205, fcp: 0.02, regiao: 'NE', nome: 'Bahia' },
  CE: { interna: 0.20, fcp: 0.02, regiao: 'NE', nome: 'Ceará' },
  DF: { interna: 0.20, fcp: 0.02, regiao: 'CO', nome: 'Distrito Federal' },
  ES: { interna: 0.17, fcp: 0.02, regiao: 'SE', nome: 'Espírito Santo' },
  GO: { interna: 0.19, fcp: 0.02, regiao: 'CO', nome: 'Goiás' },
  MA: { interna: 0.23, fcp: 0.02, regiao: 'NE', nome: 'Maranhão' },
  MT: { interna: 0.17, fcp: 0.02, regiao: 'CO', nome: 'Mato Grosso' },
  MS: { interna: 0.17, fcp: 0.02, regiao: 'CO', nome: 'Mato Grosso do Sul' },
  MG: { interna: 0.18, fcp: 0.02, regiao: 'SE', nome: 'Minas Gerais' },
  PA: { interna: 0.19, fcp: 0.00, regiao: 'N', nome: 'Pará' },
  PB: { interna: 0.20, fcp: 0.02, regiao: 'NE', nome: 'Paraíba' },
  PR: { interna: 0.195, fcp: 0.02, regiao: 'S', nome: 'Paraná' },
  PE: { interna: 0.205, fcp: 0.02, regiao: 'NE', nome: 'Pernambuco' },
  PI: { interna: 0.225, fcp: 0.02, regiao: 'NE', nome: 'Piauí' },
  RJ: { interna: 0.20, fcp: 0.02, regiao: 'SE', nome: 'Rio de Janeiro' },
  RN: { interna: 0.20, fcp: 0.02, regiao: 'NE', nome: 'Rio Grande do Norte' },
  RS: { interna: 0.17, fcp: 0.02, regiao: 'S', nome: 'Rio Grande do Sul' },
  RO: { interna: 0.195, fcp: 0.02, regiao: 'N', nome: 'Rondônia' },
  RR: { interna: 0.20, fcp: 0.02, regiao: 'N', nome: 'Roraima' },
  SC: { interna: 0.17, fcp: 0.00, regiao: 'S', nome: 'Santa Catarina' },
  SP: { interna: 0.18, fcp: 0.02, regiao: 'SE', nome: 'São Paulo' },
  SE: { interna: 0.20, fcp: 0.02, regiao: 'NE', nome: 'Sergipe' },
  TO: { interna: 0.20, fcp: 0.02, regiao: 'N', nome: 'Tocantins' },
};

export const UFS: UF[] = Object.keys(ALIQUOTAS_UF).sort() as UF[];

/** Regiões cuja origem gera alíquota interestadual reduzida quando o destino difere. */
const REGIOES_ORIGEM_REDUZIDA: readonly RegiaoFiscal[] = ['S', 'SE'];
const REGIOES_DESTINO_REDUZIDA: readonly RegiaoFiscal[] = ['N', 'NE', 'CO'];

/**
 * Tabela efetiva usada em runtime pelo motor. Por padrão é a constante
 * canônica; pode ser substituída pelo overlay validado do catálogo do banco
 * via `definirTabelaUfsEfetiva`. Nunca aceita valores não validados — o
 * chamador deve usar `aplicarOverlayUfs` antes.
 */
let tabelaEfetiva: Record<UF, AliquotaUf> = ALIQUOTAS_UF;

/** Substitui a tabela efetiva (uso exclusivo do carregador de catálogos). */
export function definirTabelaUfsEfetiva(tabela: Record<UF, AliquotaUf>): void {
  tabelaEfetiva = tabela;
}

/** Restaura as constantes canônicas do código. */
export function resetarTabelaUfsEfetiva(): void {
  tabelaEfetiva = ALIQUOTAS_UF;
}

/** Tabela atualmente em uso pelo motor. */
export function obterTabelaUfsEfetiva(): Record<UF, AliquotaUf> {
  return tabelaEfetiva;
}

export function isUF(valor: unknown): valor is UF {
  return typeof valor === 'string' && valor.toUpperCase() in ALIQUOTAS_UF;
}

/** Retorna os parâmetros da UF; lança erro explícito para UF desconhecida. */
export function buscarUf(uf: UF): AliquotaUf {
  const item = tabelaEfetiva[uf] ?? ALIQUOTAS_UF[uf];
  if (!item) throw new Error(`UF desconhecida: ${String(uf)}`);
  return item;
}


export function aliquotaInternaDe(uf: UF): number {
  return buscarUf(uf).interna;
}

export function fcpDe(uf: UF): number {
  return buscarUf(uf).fcp;
}

export function isImportada(origem?: OrigemMercadoria): boolean {
  return origem !== undefined && ORIGENS_IMPORTADAS.includes(origem);
}

/**
 * Resolve a alíquota interestadual da operação.
 *
 * Regras, em ordem de precedência:
 * 1. Operação interna (mesma UF) → alíquota interna da própria UF.
 * 2. Mercadoria importada (origem 1, 2, 3, 6, 7 ou 8) → 4%.
 * 3. Origem S/SE (exceto ES) para destino N/NE/CO/ES → 7%.
 * 4. Demais operações interestaduais → 12%.
 */
export function resolverAliquotaInterestadual(
  ufOrigem: UF,
  ufDestino: UF,
  origem?: OrigemMercadoria,
): number {
  if (ufOrigem === ufDestino) return aliquotaInternaDe(ufOrigem);
  if (isImportada(origem)) return ALIQUOTA_INTERESTADUAL_IMPORTADO;

  const regiaoOrigem = buscarUf(ufOrigem).regiao;
  const regiaoDestino = buscarUf(ufDestino).regiao;

  // O Espírito Santo é equiparado às regiões incentivadas como destino,
  // e excluído do bloco S/SE como origem de alíquota reduzida.
  const origemReduzida = REGIOES_ORIGEM_REDUZIDA.includes(regiaoOrigem) && ufOrigem !== 'ES';
  const destinoReduzido = REGIOES_DESTINO_REDUZIDA.includes(regiaoDestino) || ufDestino === 'ES';

  return origemReduzida && destinoReduzido
    ? ALIQUOTA_INTERESTADUAL_REDUZIDA
    : ALIQUOTA_INTERESTADUAL_GERAL;
}
