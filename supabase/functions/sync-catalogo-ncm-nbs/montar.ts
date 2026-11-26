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

/** Conjuntos de vigencia lidos do banco antes da carga. */
export interface ConjuntosVigencia {
  /** Codigo com periodo aberto (`fim_vigencia IS NULL`) -> inicio do periodo. */
  abertos: Iterable<readonly [string, string]>;
  /** Codigos com qualquer linha na tabela (aberta ou encerrada). */
  conhecidos: Iterable<string>;
}

export interface LinhasPorVigencia<T> {
  /** Linhas que mantem a data-base do catalogo (`2026-01-01`). */
  base: T[];
  /** Linhas de codigo reativado: abrem periodo novo na data da observacao. */
  reativadas: T[];
  /** Periodos abertos fora da data-base: reativados numa carga anterior. */
  reabertas: T[];
}

/**
 * Separa as linhas da carga entre o periodo base e os periodos novos.
 *
 * A chave primaria e (codigo, inicio_vigencia): gravar um codigo que estava
 * encerrado com o inicio do periodo base nao cria linha nova — ela colide com a
 * linha encerrada e o upsert zera o `fim_vigencia`, apagando o encerramento. O
 * catalogo passaria a considerar o codigo valido no intervalo em que ele esteve
 * fora da lista.
 *
 * Codigo reativado recebe `inicio_vigencia = dataObservacao`, entao ocupa uma
 * chave propria e o periodo encerrado continua no historico. Codigo nunca visto
 * segue na data-base: nao ha periodo anterior para preservar.
 *
 * Reativado numa carga anterior continua fora da data-base nas cargas seguintes:
 * o periodo aberto dele comeca na data daquela reativacao. Voltar a gravar a
 * data-base nao so colidiria com a linha encerrada como tambem deixaria o codigo
 * com dois periodos abertos (o antigo reaberto e o novo). O periodo novo e
 * atualizado no inicio que ele ja tem.
 */
export function separarReativados<T extends { inicio_vigencia: string }>(
  linhas: readonly T[],
  codigoDe: (linha: T) => string,
  conjuntos: ConjuntosVigencia,
  dataObservacao: string,
  base: string = VIGENCIA_BASE_CATALOGO
): LinhasPorVigencia<T> {
  // Sem data posterior a base nao existe periodo novo: inicio = data colidiria
  // com a linha encerrada e a reabriria, que e exatamente o que se quer evitar.
  if (!(dataObservacao > base)) return { base: [...linhas], reativadas: [], reabertas: [] };

  const abertos = new Map(conjuntos.abertos);
  const reativados = new Set([...conjuntos.conhecidos].filter((codigo) => !abertos.has(codigo)));

  const baseLinhas: T[] = [];
  const reativadas: T[] = [];
  const reabertas: T[] = [];
  for (const linha of linhas) {
    const codigo = String(codigoDe(linha) ?? '').trim();
    if (reativados.has(codigo)) {
      reativadas.push({ ...linha, inicio_vigencia: dataObservacao });
      continue;
    }
    const inicioAberto = abertos.get(codigo);
    if (inicioAberto !== undefined && inicioAberto !== base) {
      reabertas.push({ ...linha, inicio_vigencia: inicioAberto });
      continue;
    }
    baseLinhas.push(linha);
  }
  return { base: baseLinhas, reativadas, reabertas };
}

/**
 * Linha pronta para o `upsert`, sem `fim_vigencia`.
 *
 * Encerrar vigencia e trabalho do passo de encerramento, que so roda depois das
 * guardas; mandar `fim_vigencia: null` no payload faria o `ON CONFLICT DO UPDATE`
 * zerar o encerramento de uma linha ja fechada na mesma chave (codigo,
 * inicio_vigencia) - o codigo encerrado voltaria a valer.
 */
export function semFimVigencia<T extends object>(linha: T): Omit<T, 'fim_vigencia'> {
  const copia = { ...linha } as Record<string, unknown>;
  delete copia.fim_vigencia;
  return copia as Omit<T, 'fim_vigencia'>;
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

/**
 * Dia civil anterior a `data` (`YYYY-MM-DD`), calculado em UTC para nao depender
 * do fuso do processo.
 *
 * `fim_vigencia` e lido como ultimo dia vigente, inclusive (`vigenteEm`). Quem
 * encerra uma linha precisa gravar o dia anterior ao recorte, nao o dia do
 * recorte: com o dia do recorte o codigo seguiria vigente no dia em que ja saiu
 * da lista oficial, e a nota emitida nesse dia passaria sem alerta.
 */
export function diaAnterior(data: string): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
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
