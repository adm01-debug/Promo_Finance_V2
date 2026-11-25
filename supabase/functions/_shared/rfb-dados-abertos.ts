/**
 * Cliente comum da API publica de dados abertos da calculadora RT da RFB.
 *
 * Compartilhado pelos jobs de sincronizacao de catalogo (etapas 79-82). O que
 * justifica o modulo nao e economizar linhas, e concentrar o tratamento de
 * falha: o WAF do piloto responde **HTTP 200 com HTML** `Request Rejected`
 * quando bloqueia o IP, e nao 403. Um sync que tratasse esse corpo como lista
 * vazia encerraria a vigencia de todo o catalogo espelhado de uma vez. Aqui
 * isso e erro explicito, nunca resposta valida.
 *
 * Nao ha acesso a banco nem mapeamento de payload neste arquivo: quem monta
 * linhas sao os `montar.ts` de cada funcao, testaveis sem a API no ar.
 */

/** Base fixa: URL publica da calculadora oficial, sem segredo nem parametro. */
export const BASE_DADOS_ABERTOS =
  'https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos';

/**
 * Vigencia inicial dos catalogos CBS/IBS no banco oficial
 * (`TRIBUTO.TBTO_INICIO_VIGENCIA`). A API nao publica desde quando um codigo
 * vale; gravar uma linha por ano faria `vigenteEm()` casar duas linhas do mesmo
 * codigo e o validador compararia o item com a linha errada.
 */
export const VIGENCIA_BASE_CATALOGO = '2026-01-01';

const TIMEOUT_MS = 30_000;

/** Resposta de `/versao`: versao da base oficial, sem necessidade de token. */
export interface VersaoApi {
  ambiente?: string | null;
  dataVersaoDb?: string | null;
  versaoDb?: string | null;
  descricaoVersaoDb?: string | null;
}

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
 * Compara versoes `V0073` numericamente. Retorna < 0 quando `a` e anterior a
 * `b`. Versao ilegivel vale 0, que libera a escrita em vez de travar o sync
 * para sempre.
 */
export function compararVersao(a: string | null | undefined, b: string | null | undefined): number {
  const numero = (v: string | null | undefined) => {
    const digitos = String(v ?? '').replace(/\D/g, '');
    return digitos ? Number(digitos) : 0;
  };
  return numero(a) - numero(b);
}

/**
 * `GET` na API de dados abertos com guarda de contrato.
 *
 * A guarda central e a de JSON: o WAF responde 200 com HTML, e sem ela o sync
 * morreria num erro de parse sem dizer o motivo — ou, pior, um HTML curto
 * passaria pelos pisos de contagem e seria lido como "catalogo vazio".
 *
 * `buscar` e injetavel para o teste do caminho de rejeicao sem rede.
 */
export async function buscarDadosAbertos<T>(
  caminho: string,
  buscar: typeof fetch = fetch
): Promise<T> {
  const resposta = await buscar(`${BASE_DADOS_ABERTOS}/${caminho}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!resposta.ok) throw new Error(`dados_abertos_http_${resposta.status}`);
  const corpo = await resposta.text();
  try {
    return JSON.parse(corpo) as T;
  } catch {
    const inicio = corpo.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`dados_abertos_nao_json: ${inicio}`);
  }
}

export interface DecisaoEncerramento {
  ausentes: string[];
  bloqueado: boolean;
  motivo?: 'resposta_insuficiente' | 'ausentes_acima_do_limite';
}

/**
 * Decide o que encerrar. Duas guardas antes de escrever `fim_vigencia`:
 *
 *  1. resposta curta (abaixo de `minimoRecebido`) nao encerra nada — uma falha
 *     parcial da API fecharia a vigencia de dezenas de codigos;
 *  2. desaparecimento acima de `maxPctAusentes` do universo aberto, idem.
 *
 * Sem as guardas, um 200 truncado apagaria o catalogo e faria o validador
 * acusar "codigo fora do catalogo" em documento correto.
 */
export function decidirEncerramentos(
  abertos: readonly string[],
  recebidos: readonly string[],
  minimoRecebido: number,
  maxPctAusentes = 10
): DecisaoEncerramento {
  const recebidosSet = new Set(recebidos.map((c) => String(c).trim()));
  const ausentes = abertos.map((c) => String(c).trim()).filter((c) => c && !recebidosSet.has(c));

  if (recebidosSet.size < minimoRecebido) {
    return { ausentes, bloqueado: true, motivo: 'resposta_insuficiente' };
  }
  if (abertos.length > 0 && ausentes.length * 100 > abertos.length * maxPctAusentes) {
    return { ausentes, bloqueado: true, motivo: 'ausentes_acima_do_limite' };
  }
  return { ausentes, bloqueado: false };
}
