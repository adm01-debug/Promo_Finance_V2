/**
 * Funções puras de normalização, vigência e fallback hierárquico usadas pelo
 * endpoint `consulta-tributaria`.
 *
 * Ficam isoladas de I/O para permitir testes determinísticos em Deno
 * (`index.test.ts`) sem tocar no banco.
 */

/** Estratégia de correspondência aplicada na busca. */
export type MatchInfo = { estrategia: string; exato: boolean; detalhe?: string };

/** Remove pontuação de códigos (NCM "2202.10.00" → "22021000"). */
export const somenteDigitos = (valor: string): string => valor.replace(/\D+/g, '');

/** Data de hoje em ISO (usada para filtrar vigência). */
export const hoje = (): string => new Date().toISOString().slice(0, 10);

export interface ComVigencia {
  vigente_de?: string | null;
  vigente_ate?: string | null;
}

/**
 * Verifica se um registro está vigente na data de referência.
 * Campos nulos são tratados como "sem limite" (vigência aberta).
 */
export function vigenteEm(registro: ComVigencia, ref: string): boolean {
  if (registro.vigente_de && registro.vigente_de > ref) return false;
  if (registro.vigente_ate && registro.vigente_ate < ref) return false;
  return true;
}

/** Aplica o filtro de vigência padrão (vigente_de <= ref < vigente_ate). */
export function vigentes<T>(rows: readonly unknown[] | null, ref: string = hoje()): T[] {
  return ((rows ?? []) as T[]).filter((r) => vigenteEm(r as ComVigencia, ref));
}

/**
 * Prefixos hierárquicos de um código, do mais específico ao mais genérico.
 * NCM: [8, 6, 4, 2] → item, subposição, posição, capítulo.
 * CNAE: [5, 4, 3, 2] → subclasse, classe, grupo, divisão.
 */
export function prefixosHierarquicos(codigo: string, tamanhos: readonly number[]): string[] {
  const digitos = somenteDigitos(codigo);
  return tamanhos.filter((t) => digitos.length >= t).map((t) => digitos.slice(0, t));
}

const CATEGORIAS_GERAIS = ['GERAL', 'PADRAO', 'PADRÃO'];

export interface AliquotaInterna {
  categoria_produto: string | null;
  [k: string]: unknown;
}

/**
 * Fallback da alíquota interna por UF:
 * categoria exata → GERAL/PADRÃO → primeira disponível → sem correspondência.
 */
export function escolherAliquotaInterna<T extends AliquotaInterna>(
  internas: readonly T[],
  categoria?: string | null,
  uf?: string | null,
): { escolhida: T | null; match: MatchInfo } {
  const alvo = categoria?.toUpperCase() ?? null;
  const exata = alvo
    ? internas.find((i) => (i.categoria_produto ?? '').toUpperCase() === alvo) ?? null
    : null;
  if (exata) return { escolhida: exata, match: { estrategia: 'categoria_exata', exato: true } };

  const geral =
    internas.find((i) => CATEGORIAS_GERAIS.includes((i.categoria_produto ?? '').toUpperCase())) ??
    null;
  if (geral) {
    return {
      escolhida: geral,
      match: {
        estrategia: 'fallback_categoria_geral',
        exato: false,
        detalhe: alvo ? `Categoria "${alvo}" não cadastrada para ${uf ?? '—'}` : 'Categoria não informada',
      },
    };
  }

  if (internas.length > 0) {
    return { escolhida: internas[0], match: { estrategia: 'fallback_primeira_disponivel', exato: false } };
  }
  return { escolhida: null, match: { estrategia: 'sem_correspondencia', exato: false } };
}

/**
 * Classifica a estratégia do cenário de ST considerando a aderência das UFs.
 * Quando existe protocolo para o NCM mas nenhuma UF alvo aderiu, sinaliza
 * `fallback_sem_adesao_uf` em vez de esconder o vínculo.
 */
export function classificarCenarioST<T extends { protocolo?: { ufs?: { uf: string }[] } | null }>(
  vinculos: readonly T[],
  ufsAlvo: readonly string[],
  estrategiaBase: 'exato' | 'fallback_prefixo',
): { vinculos: T[]; estrategia: string } {
  if (ufsAlvo.length === 0) return { vinculos: [...vinculos], estrategia: estrategiaBase };
  const filtrados = vinculos.filter((v) =>
    (v.protocolo?.ufs ?? []).some((u) => ufsAlvo.includes(u.uf)),
  );
  if (filtrados.length > 0) return { vinculos: filtrados, estrategia: estrategiaBase };
  if (vinculos.length > 0) return { vinculos: [...vinculos], estrategia: 'fallback_sem_adesao_uf' };
  return { vinculos: [], estrategia: estrategiaBase };
}
