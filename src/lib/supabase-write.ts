/**
 * Garantia de êxito para escritas no Supabase (PostgREST).
 *
 * O cliente do Supabase **nunca lança**: `insert`/`update`/`delete`/`upsert`/`rpc`
 * resolvem para `{ data, error }`. Um `await supabase.from(...).update(...)` cujo
 * resultado é descartado, portanto, prossegue exatamente igual em caso de falha —
 * e o `toast.success` logo abaixo dispara sobre um estado parcial. Foi assim que
 * o incidente "PGRST204 silencioso" aconteceu neste repositório: a coluna havia
 * sido removida da tabela, o PostgREST devolveu erro, e a UI reportou sucesso.
 *
 * Este módulo expõe as duas — e apenas duas — formas legítimas de consumir uma
 * escrita, para que a escolha fique explícita no call site:
 *
 *  - `mustSucceed(consulta, contexto)`  → propaga a falha. O padrão.
 *  - `bestEffort(consulta, contexto)`   → engole a falha, mas **registra**.
 *                                          Só para efeitos colaterais acessórios
 *                                          (telemetria, auditoria, log) em que
 *                                          derrubar o fluxo principal seria pior
 *                                          que perder o registro.
 *
 * A regra ESLint `no-floating-supabase-write` obriga uma das duas.
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Forma estrutural da resposta do PostgREST. Declarada como união (e não como
 * `{ data: T | null; error: E | null }`) porque é assim que o supabase-js tipa:
 * só a união permite ao TypeScript estreitar `data` para `T` depois do
 * `if (error)`, preservando o tipo de `data` no retorno.
 */
export type RespostaSupabase<T> =
  | { data: T; error: null; count?: number | null; status?: number }
  | { data: null; error: PostgrestError; count?: number | null; status?: number };

/** Qualquer resposta no formato do PostgREST, sem amarrar o tipo de `data`. */
export interface RespostaPostgrest {
  data: unknown;
  error: PostgrestError | null;
  count?: number | null;
  status?: number;
}

/**
 * Tipo de `data` no ramo de sucesso da resposta.
 *
 * Inferir `T` diretamente de `RespostaSupabase<T>` não funciona: o TypeScript
 * coleta candidatos dos **dois** ramos da união e conclui `T | null`, de modo
 * que um `.single()` — cujo `data` é não-nulo quando `error` é `null` — voltaria
 * anulável e obrigaria um `!` em todo call site. Extrair o ramo de sucesso
 * devolve exatamente o tipo que o supabase-js declara.
 *
 * O `[Extract<…>] extends [never]` cobre quem passa uma resposta já achatada
 * (`{ data: T | null; error: PostgrestError | null }`), que não é união
 * discriminada: nesse caso não há ramo a extrair e cai-se em `R['data']`.
 */
export type DadosDaResposta<R extends RespostaPostgrest> = [Extract<R, { error: null }>] extends [
  never,
]
  ? R['data']
  : Extract<R, { error: null }>['data'];

/**
 * Mensagens acionáveis para os códigos que de fato aparecem neste sistema.
 * Espelha o estilo de `DEFAULT_MESSAGES` em `edge-function-error.ts`.
 */
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  // O incidente que originou este módulo: o código envia um campo que não
  // existe mais na tabela. Falha 100% das vezes, em toda linha.
  PGRST204: 'Campo inexistente na tabela — o código envia uma coluna que não existe mais.',
  PGRST116: 'A consulta esperava exatamente uma linha e obteve zero ou várias.',
  PGRST301: 'Sessão expirada ou token inválido.',
  '23502': 'Campo obrigatório não informado.',
  '23503': 'Registro relacionado inexistente ou ainda referenciado por outro.',
  '23505': 'Já existe um registro com esses dados.',
  '23514': 'Os dados violam uma regra de validação da tabela.',
  '42501': 'Sem permissão para esta operação (política RLS).',
  '42703': 'Coluna inexistente na tabela.',
  '42P01': 'Tabela ou view inexistente.',
};

/** Erro lançado por `mustSucceed`. Carrega o contexto de negócio da operação. */
export class SupabaseWriteError extends Error {
  readonly operacao: string;
  readonly code: string;
  readonly details: string | null;
  readonly hint: string | null;
  readonly status: number | null;
  readonly cause?: unknown;

  constructor(params: {
    operacao: string;
    code: string;
    message: string;
    details?: string | null;
    hint?: string | null;
    status?: number | null;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'SupabaseWriteError';
    this.operacao = params.operacao;
    this.code = params.code;
    this.details = params.details ?? null;
    this.hint = params.hint ?? null;
    this.status = params.status ?? null;
    this.cause = params.cause;
  }

  /** Falha de esquema: o código está fora de sincronia com o banco. */
  get isSchemaError(): boolean {
    return ['PGRST204', '42703', '42P01'].includes(this.code);
  }

  /** Bloqueio por política de acesso. */
  get isPermissionError(): boolean {
    return this.code === '42501';
  }

  /** A escrita foi aceita, mas não atingiu nenhuma linha. */
  get isNenhumaLinha(): boolean {
    return this.code === 'NENHUMA_LINHA';
  }
}

function mensagemAmigavel(operacao: string, erro: PostgrestError): string {
  const especifica = MENSAGENS_POR_CODIGO[erro.code];
  const detalhe = especifica ?? erro.message ?? 'Falha desconhecida.';
  return `Falha ao ${operacao}: ${detalhe}`;
}

export interface OpcoesMustSucceed {
  /**
   * Falha também quando a escrita foi aceita mas não atingiu **nenhuma linha**
   * — um `update().eq('id', inexistente)` devolve `error: null` e é, na prática,
   * um no-op silencioso. Use em operações cuja ausência de efeito é um bug
   * (aprovar, conciliar, baixar, quitar).
   *
   * Exige uma resposta que permita contar linhas: encadeie `.select('id')` ou
   * passe `{ count: 'exact' }`. Sem isso, lança um erro de programação em vez de
   * fingir que verificou.
   *
   * Ressalva: o `RETURNING` do `.select()` passa pela política de SELECT da
   * tabela. Se a RLS permite escrever mas não ler a linha, a escrita é real e
   * mesmo assim volta vazia. Nas tabelas deste sistema quem escreve também lê,
   * mas vale conferir a policy antes de usar esta opção em tabela nova.
   */
  exigirLinhas?: boolean;
}

/**
 * Consome uma escrita do Supabase propagando a falha. Retorna `data` com o tipo
 * original preservado.
 *
 * @param consulta Builder do PostgREST (é `PromiseLike`, não precisa de `await`).
 * @param contexto Frase no infinitivo que completa "Falha ao ___".
 *                 Ex.: `'aprovar o pagamento'`, `'vincular a transação'`.
 *
 * @example
 * await mustSucceed(
 *   supabase.from('contas_pagar').update({ aprovado_por: user.id }).eq('id', id).select('id'),
 *   'registrar o aprovador no contas a pagar',
 *   { exigirLinhas: true },
 * );
 *
 * Não reporta ao `errorTracker`: quem trata o erro decide se é esperado
 * (conflito de unicidade exibido ao usuário) ou se merece Sentry. Reportar aqui
 * duplicaria todo erro já capturado no `catch` do chamador.
 */
export async function mustSucceed<R extends RespostaPostgrest>(
  consulta: PromiseLike<R>,
  contexto: string,
  opcoes: OpcoesMustSucceed = {}
): Promise<DadosDaResposta<R>> {
  const resposta = await consulta;

  if (resposta.error) {
    throw new SupabaseWriteError({
      operacao: contexto,
      code: resposta.error.code ?? 'DESCONHECIDO',
      message: mensagemAmigavel(contexto, resposta.error),
      details: resposta.error.details,
      hint: resposta.error.hint,
      status: resposta.status ?? null,
      cause: resposta.error,
    });
  }

  if (opcoes.exigirLinhas) {
    const linhas = contaLinhas(resposta);
    if (linhas === null) {
      // Erro de programação, não de runtime do usuário: a resposta não permite
      // contar linhas, então `exigirLinhas` não tem como ser honrado.
      throw new SupabaseWriteError({
        operacao: contexto,
        code: 'CONTAGEM_INDISPONIVEL',
        message:
          `Falha ao ${contexto}: exigirLinhas foi pedido, mas a resposta não permite ` +
          `contar linhas. Encadeie .select('id') ou passe { count: 'exact' } na escrita.`,
      });
    }
    if (linhas === 0) {
      throw new SupabaseWriteError({
        operacao: contexto,
        code: 'NENHUMA_LINHA',
        message: `Falha ao ${contexto}: nenhuma linha foi afetada.`,
        hint: 'O registro pode ter sido removido, já alterado por outro usuário, ou estar fora do escopo da sua empresa.',
      });
    }
  }

  return resposta.data as DadosDaResposta<R>;
}

/** Quantas linhas a resposta comprova ter atingido. `null` = não verificável. */
function contaLinhas(resposta: RespostaPostgrest): number | null {
  if (typeof resposta.count === 'number') return resposta.count;
  if (Array.isArray(resposta.data)) return resposta.data.length;
  if (resposta.data !== null && resposta.data !== undefined) return 1;
  return null;
}

export interface OpcoesBestEffort {
  /**
   * Envia a falha ao rastreador de erros além do log. Desligado por padrão de
   * propósito: `bestEffort` cobre justamente as escritas de telemetria e log de
   * erro — reportar a falha de um insert em `frontend_error_logs` ao Sentry
   * realimentaria o próprio caminho que falhou.
   */
  reportar?: boolean;
}

/**
 * Consome uma escrita **acessória** cuja falha não deve interromper o fluxo,
 * mas também não deve sumir. Nunca lança.
 *
 * Existe para que "ignorar o erro" seja uma decisão escrita e revisável, em vez
 * do efeito colateral de um `await` solto. Se a escrita importa para a
 * consistência do que o usuário vê, use `mustSucceed`.
 *
 * @returns `true` se a escrita passou, `false` se falhou (a falha já foi logada).
 */
export async function bestEffort(
  consulta: PromiseLike<RespostaPostgrest>,
  contexto: string,
  opcoes: OpcoesBestEffort = {}
): Promise<boolean> {
  try {
    const resposta = await consulta;
    if (resposta.error) {
      registraFalhaAcessoria(contexto, resposta.error, opcoes.reportar);
      return false;
    }
    return true;
  } catch (erro) {
    // Falha de rede/abort: o builder rejeita em vez de resolver com `error`.
    registraFalhaAcessoria(contexto, erro, opcoes.reportar);
    return false;
  }
}

function registraFalhaAcessoria(contexto: string, erro: unknown, reportar = false): void {
  const code = (erro as PostgrestError | null)?.code;
  const message = erro instanceof Error ? erro.message : (erro as PostgrestError)?.message;
  logger.warn('[supabase-write] escrita acessória falhou', { contexto, code, message });

  if (reportar) {
    // Import tardio: mantém `error-tracking` fora do caminho padrão, que é o
    // usado pela própria telemetria.
    void import('@/lib/error-tracking').then(({ errorTracker }) => {
      errorTracker.captureException(
        erro instanceof Error ? erro : new Error(message ?? 'falha desconhecida'),
        { tags: { source: 'supabase_write', contexto, code: code ?? 'DESCONHECIDO' } }
      );
    });
  }
}
