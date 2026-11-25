/**
 * Etapa 79 do plano RT/RFB — espelho do catalogo cClassTrib a partir da API de
 * dados abertos da RFB.
 *
 * A API publica o catalogo vigente, mas nao publica duas coisas que a tabela
 * `catalogo_cclasstrib` exige:
 *
 *  - `inicio_vigencia`: o endpoint devolve o MESMO conteudo para qualquer
 *    `data` consultada (2026-11-24 e 2027-06-01 devolvem os mesmos 170
 *    codigos, conferido em 2026-11-24). No banco oficial o catalogo CBS/IBS
 *    inteiro nasce em 2026-01-01 (TRIBUTO CBS/IBSUF/IBSMun
 *    `TBTO_INICIO_VIGENCIA`). O sync grava nessa vigencia em vez de inventar
 *    uma linha por ano: em 2027-01-01 o Imposto Seletivo tem 29
 *    classificacoes proprias que reusam 14 codigos do catalogo CBS/IBS, entao
 *    uma linha anual faria `vigenteEm()` casar duas linhas para o mesmo codigo
 *    e o validador compararia o item com a linha errada (REG-011 falso).
 *  - `cst`: nao existe no corpo da classificacao; vem do endpoint de situacoes
 *    tributarias, que aninha as classificacoes de cada CST. Classificacao sem
 *    CST conhecido e descartada, nunca gravada com CST suposto —
 *    `src/lib/tributario/catalogos/cclasstrib.ts` compara o CST do XML com o do
 *    catalogo, e um CST inventado vira divergencia em cima de nota correta.
 *
 * Sem I/O neste arquivo: o mapeamento e testavel sem a API no ar.
 */

/** Vigencia do catalogo CBS/IBS no banco oficial (TRIBUTO.TBTO_INICIO_VIGENCIA). */
export const VIGENCIA_BASE_CATALOGO = '2026-01-01';

/** Piso de sanidade: hoje o endpoint devolve 170. Abaixo disso nao se escreve. */
export const MIN_CLASSIFICACOES_API = 100;

/** Teto de desaparecimento tolerado no mesmo exercicio antes de encerrar vigencia. */
export const MAX_PCT_AUSENTES = 10;

export interface ClassificacaoApi {
  codigo?: string | null;
  descricao?: string | null;
  percentualReducaoCbs?: number | null;
  percentualReducaoIbsUf?: number | null;
  percentualReducaoIbsMun?: number | null;
}

export interface SituacaoApi {
  codigo?: string | null;
  descricao?: string | null;
  id?: number | null;
  classificacoesTributarias?: ReadonlyArray<{
    codigo?: string | null;
    descricao?: string | null;
  }> | null;
}

export interface LinhaCatalogo {
  cclasstrib: string;
  cst: string;
  descricao: string;
  p_red_cbs: number;
  p_red_ibs_uf: number;
  p_red_ibs_mun: number;
  versao_it: string;
  inicio_vigencia: string;
  fim_vigencia: string | null;
}

export interface Mapeamento {
  linhas: LinhaCatalogo[];
  /**
   * Codigos validos e unicos que a resposta oficial publicou, com ou sem CST.
   * E isto - nao `linhas` - que decide quem sumiu do catalogo: um codigo
   * publicado cujo vinculo de CST falhou continua na Receita e nao pode ser
   * encerrado por falha nossa.
   */
  presentes: string[];
  /** Codigos validos que nenhuma situacao tributaria reivindica. */
  sem_cst: string[];
  /**
   * Codigos que a resposta publicou e que nao foram aproveitados de nenhuma
   * forma: invalidos, vazios, sem descricao ou repetidos quando nenhuma
   * ocorrencia virou linha nem entrou em `sem_cst`.
   */
  ignoradas: string[];
  /** Codigos que duas situacoes diferentes reivindicam — descartados. */
  ambiguas: string[];
}

export interface Encerramento {
  cclasstrib: string;
  fim_vigencia: string;
}

export interface DecisaoEncerramento {
  encerrar: Encerramento[];
  ausentes: string[];
  bloqueado: boolean;
  motivo?: 'resposta_insuficiente' | 'ausentes_acima_do_limite';
}

const CC_6 = /^\d{6}$/;
const CC_3 = /^\d{3}$/;

/** Data civil no fuso de Brasilia (`en-CA` devolve `YYYY-MM-DD`). */
export function hojeBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/**
 * Normaliza a data de consulta. A API exige `data` e devolve 400 sem ela; data
 * malformada cai para hoje em Brasilia em vez de virar 400 na virada do dia.
 */
export function normalizarData(entrada?: string | null, agora: Date = new Date()): string {
  const valor = String(entrada ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const d = new Date(`${valor}T12:00:00Z`);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor) return valor;
  }
  return hojeBrasilia(agora);
}

/**
 * `percentualReducao*` vem em pontos percentuais (60.0 = 60%) e a coluna
 * `p_red_*` guarda fracao (0-1) — mesmo padrao das etapas 33-34. Valor ausente
 * e `0`, nunca `null`: a coluna e `not null`.
 */
export function fracaoReducao(percentual: unknown): number {
  const n = typeof percentual === 'number' ? percentual : Number(percentual);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(1, Math.round((n / 100) * 1e4) / 1e4);
}

/** CST de cada classificacao, tirado das situacoes que a reivindicam. */
export function mapearCst(situacoes: readonly SituacaoApi[]): {
  porCclasstrib: Map<string, string>;
  ambiguas: string[];
} {
  const porCclasstrib = new Map<string, string>();
  const ambiguas = new Set<string>();

  for (const situacao of situacoes ?? []) {
    const cst = String(situacao?.codigo ?? '').trim();
    if (!CC_3.test(cst)) continue;
    for (const classificacao of situacao?.classificacoesTributarias ?? []) {
      const codigo = String(classificacao?.codigo ?? '').trim();
      if (!CC_6.test(codigo)) continue;
      // `ambiguas` barra toda ocorrencia seguinte: sem isto, uma terceira
      // situacao reivindicando o codigo o reinsere no mapa e a linha e gravada
      // com um CST escolhido no meio de uma contradicao.
      if (ambiguas.has(codigo)) continue;
      const anterior = porCclasstrib.get(codigo);
      if (anterior === undefined) {
        porCclasstrib.set(codigo, cst);
      } else if (anterior !== cst) {
        porCclasstrib.delete(codigo);
        ambiguas.add(codigo);
      }
    }
  }

  return { porCclasstrib, ambiguas: [...ambiguas] };
}

export function montarLinhas(
  classificacoes: readonly ClassificacaoApi[],
  situacoes: readonly SituacaoApi[],
  versaoIt: string,
  inicioVigencia: string = VIGENCIA_BASE_CATALOGO
): Mapeamento {
  const { porCclasstrib, ambiguas } = mapearCst(situacoes);
  const linhas: LinhaCatalogo[] = [];
  const presentes: string[] = [];
  const sem_cst: string[] = [];
  const vistos = new Set<string>();
  // Uma ocorrencia sem descricao nao pode consumir o codigo: a Receita manda o
  // mesmo codigo primeiro sem descricao e depois completo, e e a segunda
  // ocorrencia que vira linha. `decididos` guarda quem produziu linha ou entrou
  // em `sem_cst`; `apareceram` guarda todo codigo que veio na resposta.
  const decididos = new Set<string>();
  const apareceram = new Set<string>();

  for (const classificacao of classificacoes ?? []) {
    const codigo = String(classificacao?.codigo ?? '').trim();
    const descricao = String(classificacao?.descricao ?? '').trim();
    apareceram.add(codigo);
    if (!CC_6.test(codigo)) {
      continue;
    }
    // Presenca = "a Receita publicou", nao "virou linha": o contrato de
    // `presentes` inclui codigo sem CST, e vale igual para codigo publicado sem
    // descricao. Antes do fix ele entrava so em `ignoradas` e o encerramento de
    // vigencia fechava um codigo que segue no catalogo oficial.
    if (!vistos.has(codigo)) {
      vistos.add(codigo);
      presentes.push(codigo);
    }
    if (!descricao) {
      continue;
    }
    if (decididos.has(codigo)) {
      continue;
    }
    decididos.add(codigo);
    const cst = porCclasstrib.get(codigo);
    if (!cst) {
      sem_cst.push(codigo);
      continue;
    }
    linhas.push({
      cclasstrib: codigo,
      cst,
      descricao,
      p_red_cbs: fracaoReducao(classificacao.percentualReducaoCbs),
      p_red_ibs_uf: fracaoReducao(classificacao.percentualReducaoIbsUf),
      p_red_ibs_mun: fracaoReducao(classificacao.percentualReducaoIbsMun),
      versao_it: versaoIt,
      inicio_vigencia: inicioVigencia,
      fim_vigencia: null,
    });
  }

  // Derivado, nao acumulado na leitura: todo codigo que a resposta publicou e que
  // nao gerou linha nem entrada em `sem_cst`. Acumular fazia o resumo depender da
  // ordem das ocorrencias e tratava duplicata com e sem descricao de forma
  // diferente (achado do Devin Review na #549).
  const ignoradas = [...apareceram].filter((codigo) => !decididos.has(codigo));

  return { linhas, presentes, sem_cst, ignoradas, ambiguas: [...ambiguas] };
}

/**
 * Decide o que encerrar. Duas guardas antes de escrever `fim_vigencia`:
 *
 *  1. resposta curta (abaixo de `MIN_CLASSIFICACOES_API`) nao encerra nada —
 *     uma falha parcial da API fecharia a vigencia de dezenas de codigos;
 *  2. desaparecimento acima de `MAX_PCT_AUSENTES` do universo aberto idem.
 *
 * Sem a guarda, um 200 com lista truncada apagaria o catalogo e faria o
 * validador acusar "cClassTrib fora do catalogo" em nota correta.
 */
export function decidirEncerramentos(
  abertos: readonly string[],
  recebidos: readonly string[],
  dataReferencia: string
): DecisaoEncerramento {
  const recebidosSet = new Set(recebidos.map((c) => String(c).trim()));
  const ausentes = abertos.map((c) => String(c).trim()).filter((c) => c && !recebidosSet.has(c));

  if (recebidosSet.size < MIN_CLASSIFICACOES_API) {
    return { encerrar: [], ausentes, bloqueado: true, motivo: 'resposta_insuficiente' };
  }
  if (abertos.length > 0 && ausentes.length * 100 > abertos.length * MAX_PCT_AUSENTES) {
    return { encerrar: [], ausentes, bloqueado: true, motivo: 'ausentes_acima_do_limite' };
  }
  return {
    encerrar: ausentes.map((cclasstrib) => ({ cclasstrib, fim_vigencia: dataReferencia })),
    ausentes,
    bloqueado: false,
  };
}

/**
 * Compara versoes `V0073` numericamente. Retorna < 0 quando `a` e anterior a
 * `b`. Versao ilegivel vale 0, que faz a guarda liberar a escrita em vez de
 * travar o sync para sempre.
 */
export function compararVersao(a: string | null | undefined, b: string | null | undefined): number {
  const numero = (v: string | null | undefined) => {
    const digitos = String(v ?? '').replace(/\D/g, '');
    return digitos ? Number(digitos) : 0;
  };
  return numero(a) - numero(b);
}
