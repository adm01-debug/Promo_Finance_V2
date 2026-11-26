/**
 * Mapeamento das aliquotas de referencia da API de dados abertos da RFB para
 * `catalogo_aliquota_referencia` (etapa 81 do plano RT/RFB).
 *
 * Modulo puro: sem I/O, sem banco. O que ele garante e a unidade do numero — a
 * API publica **pontos percentuais** (CBS 0.9 = 0,9%) e a tabela guarda fracao
 * (`numeric(5,4)`, 0.0090), a mesma convencao dos `p_red_*` do resto do sistema.
 * Trocar de unidade aqui e o que evita 0,9% virar 0,9 no documento.
 */

/** Resposta das rotas `/aliquota-uniao`, `/aliquota-uf` e `/aliquota-municipio`. */
export interface AliquotaApi {
  aliquotaReferencia?: number | string | null;
  aliquotaPropria?: number | string | null;
  formaAplicacao?: string | null;
}

export type TributoAliquota = 'cbs' | 'ibs_uf' | 'ibs_mun';

export interface LinhaAliquota {
  ano: number;
  tributo: TributoAliquota;
  uf: string | null;
  municipio_ibge: string | null;
  aliquota: number;
}

/** UFs do Brasil: `/ufs` tem que devolver a lista completa, senao nao da para resolver sigla. */
export const MIN_UFS = 27;

/** Escala de `catalogo_aliquota_referencia.aliquota`. */
const CASAS = 4;
/** Teto de `numeric(5,4)`: fracao >= 10 nao cabe na coluna. */
const MAX_FRACAO = 10;

/**
 * Converte pontos percentuais em fracao com 4 casas. `null` para valor ausente
 * ou fora da coluna — quem chama decide o que fazer, mas nunca grava `NaN` nem
 * `Infinity`.
 *
 * `0` e valor valido (municipio sem aliquota propria em 2026): a checagem e de
 * tipo, nunca de veracidade.
 */
export function paraFracao(percentual: number | string | null | undefined): number | null {
  if (percentual === null || percentual === undefined) return null;
  const texto = typeof percentual === 'number' ? '' : String(percentual).trim();
  // `Number('')` e `0`: string vazia e ausencia de dado, nunca aliquota zero.
  if (typeof percentual !== 'number' && texto === '') return null;
  const numero = typeof percentual === 'number' ? percentual : Number(texto.replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0) return null;
  const fracao = Number((numero / 100).toFixed(CASAS));
  return fracao >= MAX_FRACAO ? null : fracao;
}

function linha(
  ano: number,
  tributo: TributoAliquota,
  chave: { uf?: string | null; municipio_ibge?: string | null },
  resposta: AliquotaApi | null | undefined
): LinhaAliquota | null {
  const aliquota = paraFracao(resposta?.aliquotaReferencia);
  if (aliquota === null) return null;
  return {
    ano,
    tributo,
    uf: chave.uf ?? null,
    municipio_ibge: chave.municipio_ibge ?? null,
    aliquota,
  };
}

/** `/aliquota-uniao` grava CBS nacional: sem UF e sem municipio. */
export function montarUniao(
  resposta: AliquotaApi | null | undefined,
  ano: number
): LinhaAliquota | null {
  return linha(ano, 'cbs', {}, resposta);
}

/** `/aliquota-uf` grava IBS estadual. `uf` guarda a **sigla**, como no resto do banco. */
export function montarUf(
  sigla: string | null | undefined,
  resposta: AliquotaApi | null | undefined,
  ano: number
): LinhaAliquota | null {
  const normalizada = String(sigla ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizada)) return null;
  return linha(ano, 'ibs_uf', { uf: normalizada }, resposta);
}

/** `/aliquota-municipio` grava IBS municipal. A API exige o codigo IBGE de 7 digitos. */
export function montarMunicipio(
  codigo: string | number | null | undefined,
  sigla: string | null | undefined,
  resposta: AliquotaApi | null | undefined,
  ano: number
): LinhaAliquota | null {
  const codigoLimpo = String(codigo ?? '').trim();
  if (!/^\d{7}$/.test(codigoLimpo)) return null;
  const normalizada = String(sigla ?? '')
    .trim()
    .toUpperCase();
  return linha(
    ano,
    'ibs_mun',
    { uf: /^[A-Z]{2}$/.test(normalizada) ? normalizada : null, municipio_ibge: codigoLimpo },
    resposta
  );
}

/**
 * `codigo` IBGE da UF -> sigla, a partir de `/ufs`. A rota `/aliquota-uf` so
 * aceita o codigo IBGE e a coluna `uf` guarda a sigla: o mapa e a unica ponte
 * entre os dois, entao ele e construido a cada execucao em vez de cravado.
 */
export function extrairUfs(payload: unknown): Map<string, string> {
  const mapa = new Map<string, string>();
  if (!Array.isArray(payload)) return mapa;
  for (const item of payload as Array<Record<string, unknown>>) {
    const codigo = String(item?.codigo ?? '').trim();
    const sigla = String(item?.sigla ?? '')
      .trim()
      .toUpperCase();
    if (/^\d{2}$/.test(codigo) && /^[A-Z]{2}$/.test(sigla) && !mapa.has(codigo)) {
      mapa.set(codigo, sigla);
    }
  }
  return mapa;
}

/**
 * Ordena os alvos de uma rodada: primeiro o que ainda nao existe para o ano,
 * depois o resto, cortado em `limite`.
 *
 * A API publica bloqueia por taxa (~30 requisicoes seguidas) e uma varredura
 * completa de UFs e municipios nao cabe numa execucao. Priorizando o que falta,
 * a tabela converge em poucas rodadas mesmo quando o sync e interrompido no
 * meio — e, quando nada falta, a mesma lista vira rotina de atualizacao.
 */
export function ordenarPorPendencia(
  chaves: readonly (string | number | null | undefined)[],
  gravados: ReadonlySet<string>,
  limite: number
): { alvos: string[]; pendentes: number } {
  const unicas: string[] = [];
  for (const bruta of chaves) {
    const chave = String(bruta ?? '').trim();
    if (chave && !unicas.includes(chave)) unicas.push(chave);
  }
  const faltando = unicas.filter((chave) => !gravados.has(chave));
  const resto = unicas.filter((chave) => gravados.has(chave));
  const teto = Number.isFinite(limite) && limite > 0 ? Math.floor(limite) : 0;
  return { alvos: [...faltando, ...resto].slice(0, teto), pendentes: faltando.length };
}
