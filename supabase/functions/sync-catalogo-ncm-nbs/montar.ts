/**
 * Etapa 80 do plano RT/RFB — espelho dos catalogos NCM e NBS a partir da API de
 * dados abertos da RFB.
 *
 * A API publica o conjunto vigente na data consultada (`/ncm/vigentes` e
 * `/nbs/lista`), sem dizer desde quando cada codigo vale. Duas consequencias
 * para a tabela:
 *
 *  - `inicio_vigencia` recebe `VIGENCIA_BASE_CATALOGO` pela mesma razao da
 *    etapa 79: uma linha por ano faria `vigenteEm()` casar duas linhas do mesmo
 *    codigo. Quem le (`src/lib/tributario/catalogos/cclasstrib.ts`) recorta por
 *    vigencia e so alerta quando existe cobertura para a data do documento.
 *  - codigo sem descricao e descartado, nunca gravado com descricao suposta: a
 *    coluna e `not null` e uma descricao inventada apareceria para o usuario.
 *
 * Sem I/O neste arquivo: o mapeamento e testavel sem a API no ar.
 */
import { VIGENCIA_BASE_CATALOGO } from '../_shared/rfb-dados-abertos.ts';

export { VIGENCIA_BASE_CATALOGO };

/**
 * Pisos de sanidade. A lista oficial tem ~10 mil NCMs e ~2 mil NBS; o piso e
 * ~10% disso, o bastante para barrar resposta truncada sem impedir um catalogo
 * legitimamente reduzido de ser gravado.
 */
export const MIN_NCM_API = 1000;
export const MIN_NBS_API = 200;

/** NCM e sempre 8 digitos (`NcmVigenciaOutput` no repositorio oficial). */
const NCM_8 = /^\d{8}$/;
/** NBS publicada em ate 9 digitos; a lista oficial usa 7 (`1010100`). */
const NBS_2_9 = /^\d{2,9}$/;

/**
 * Linha crua dos dois endpoints de lista. `/ncm/vigentes` usa `ncm` e
 * `/nbs/lista` usa `codigo`; os demais campos sao iguais.
 */
export interface ItemListaApi {
  ncm?: string | null;
  codigo?: string | null;
  descricao?: string | null;
}
export interface LinhaNcm {
  ncm: string;
  descricao: string;
  inicio_vigencia: string;
  fim_vigencia: null;
}

export interface LinhaNbs {
  nbs: string;
  descricao: string;
  inicio_vigencia: string;
  fim_vigencia: null;
}

export interface Mapeamento<T> {
  linhas: T[];
  /**
   * Codigos validos e unicos que a API publicou, com ou sem descricao. E isto —
   * nao `linhas` — que decide quem sumiu do catalogo: um codigo publicado sem
   * descricao continua na Receita e nao pode ser encerrado por falha nossa.
   */
  presentes: string[];
  /** Codigos publicados que nao viraram linha (invalido, vazio, sem descricao). */
  ignoradas: string[];
}

function mapear<T>(
  itens: ReadonlyArray<ItemListaApi> | null | undefined,
  extrairCodigo: (item: ItemListaApi) => string,
  valido: (codigo: string) => boolean,
  montarLinha: (codigo: string, descricao: string, inicioVigencia: string) => T,
  inicioVigencia: string
): Mapeamento<T> {
  const linhas: T[] = [];
  const presentes: string[] = [];
  const apareceram = new Set<string>();
  const vistos = new Set<string>();
  const decididos = new Set<string>();

  for (const item of itens ?? []) {
    const codigo = String(extrairCodigo(item) ?? '').trim();
    if (!codigo) continue;
    apareceram.add(codigo);
    if (!valido(codigo)) continue;
    // Presenca = "a Receita publicou", nao "virou linha": codigo publicado sem
    // descricao segue no catalogo oficial.
    if (!vistos.has(codigo)) {
      vistos.add(codigo);
      presentes.push(codigo);
    }
    const descricao = String(item?.descricao ?? '').trim();
    if (!descricao || decididos.has(codigo)) continue;
    decididos.add(codigo);
    linhas.push(montarLinha(codigo, descricao, inicioVigencia));
  }

  // Derivado, nao acumulado na leitura: assim o resumo nao depende da ordem das
  // ocorrencias e duplicata com e sem descricao e tratada igual.
  const ignoradas = [...apareceram].filter((codigo) => !decididos.has(codigo));

  return { linhas, presentes, ignoradas };
}

export function montarNcms(
  itens: ReadonlyArray<ItemListaApi> | null | undefined,
  inicioVigencia: string = VIGENCIA_BASE_CATALOGO
): Mapeamento<LinhaNcm> {
  return mapear(
    itens,
    (item) => String(item?.ncm ?? item?.codigo ?? ''),
    (codigo) => NCM_8.test(codigo),
    (codigo, descricao, inicio) => ({
      ncm: codigo,
      descricao,
      inicio_vigencia: inicio,
      fim_vigencia: null,
    }),
    inicioVigencia
  );
}

export function montarNbs(
  itens: ReadonlyArray<ItemListaApi> | null | undefined,
  inicioVigencia: string = VIGENCIA_BASE_CATALOGO
): Mapeamento<LinhaNbs> {
  return mapear(
    itens,
    (item) => String(item?.codigo ?? ''),
    (codigo) => NBS_2_9.test(codigo),
    (codigo, descricao, inicio) => ({
      nbs: codigo,
      descricao,
      inicio_vigencia: inicio,
      fim_vigencia: null,
    }),
    inicioVigencia
  );
}
