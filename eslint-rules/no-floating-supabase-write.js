/**
 * Regra ESLint: no-floating-supabase-write
 *
 * O cliente do Supabase não lança. `insert`/`update`/`delete`/`upsert`/`rpc`
 * resolvem para `{ data, error }`, então descartar o resultado faz a falha
 * desaparecer e o fluxo seguir como se a escrita tivesse acontecido — foi assim
 * que este repositório acumulou 45 escritas cujo `toast.success` dispara sobre
 * estado parcial.
 *
 * A regra obriga uma decisão explícita em cada escrita:
 *   - desestruturar `{ error }` e tratar;
 *   - `mustSucceed(...)` para propagar a falha;
 *   - `bestEffort(...)` para engolir registrando (telemetria, auditoria).
 *
 * Duas formas são reportadas:
 *   1. `await supabase.from(x).update(y).eq(...)` em posição de statement —
 *      o resultado, e portanto o erro, é descartado.
 *   2. a mesma cadeia **sem** `await` — o builder do PostgREST só dispara em
 *      `.then()`, logo a escrita sequer chega ao servidor.
 */

const METODOS_DE_ESCRITA = new Set(['insert', 'update', 'delete', 'upsert', 'rpc']);

/**
 * Métodos que já consomem o resultado. `supabase.from(x).update(y).then(cb)`
 * dispara a requisição e entrega `{ data, error }` ao callback — não é uma
 * escrita solta, ainda que não tenha `await`. A regra não julga o corpo do
 * callback, assim como não julga o que se faz com o `error` desestruturado.
 */
const CONSUMIDORES_DE_PROMISE = new Set(['then', 'catch', 'finally']);

/** Remove empacotamentos que não mudam a cadeia (`as`, `!`, parênteses). */
function desembrulha(no) {
  let atual = no;
  for (;;) {
    if (
      atual &&
      (atual.type === 'TSAsExpression' ||
        atual.type === 'TSNonNullExpression' ||
        atual.type === 'TSSatisfiesExpression' ||
        atual.type === 'ChainExpression')
    ) {
      atual = atual.expression;
      continue;
    }
    return atual;
  }
}

/**
 * Percorre a cadeia de chamadas da ponta até a raiz.
 * Devolve o primeiro método de escrita encontrado e o identificador raiz.
 */
function analisaCadeia(expressao) {
  let metodo = null;
  let raiz = null;
  let no = desembrulha(expressao);

  while (no) {
    if (no.type === 'CallExpression') {
      const chamado = desembrulha(no.callee);
      if (chamado && chamado.type === 'MemberExpression' && !chamado.computed) {
        const nome = chamado.property.name;
        // Guarda o método de escrita mais próximo da raiz: em
        // `.update(...).eq(...)` quem importa é `update`.
        if (METODOS_DE_ESCRITA.has(nome)) metodo = nome;
        no = desembrulha(chamado.object);
        continue;
      }
      no = chamado;
      continue;
    }
    if (no.type === 'MemberExpression') {
      no = desembrulha(no.object);
      continue;
    }
    if (no.type === 'Identifier') {
      raiz = no.name;
      break;
    }
    break;
  }

  return { metodo, raiz };
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Exige que o resultado de uma escrita no Supabase seja consumido (mustSucceed, bestEffort ou desestruturação de error).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          /** Regex (string) que reconhece o identificador do client. */
          clientePattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      resultadoDescartado:
        "O resultado de `.{{metodo}}()` é descartado: o Supabase não lança, então a falha some e o fluxo segue como se a escrita tivesse acontecido. Use `mustSucceed(consulta, 'descrição da operação')` para propagar, `bestEffort(...)` se a falha for aceitável (telemetria/auditoria), ou desestruture `{ error }` e trate.",
      semAwait:
        'A cadeia com `.{{metodo}}()` não é aguardada: o builder do PostgREST só dispara em `.then()`, logo esta escrita nunca chega ao servidor. Adicione `await` e consuma o resultado com `mustSucceed` ou `bestEffort`.',
    },
  },

  create(context) {
    const opcoes = context.options[0] || {};
    const padraoCliente = new RegExp(opcoes.clientePattern || '^supabase');

    /** A cadeia termina em `.then()/.catch()/.finally()`? Então foi consumida. */
    function jaConsumida(expressao) {
      const no = desembrulha(expressao);
      if (!no || no.type !== 'CallExpression') return false;
      const chamado = desembrulha(no.callee);
      return (
        chamado &&
        chamado.type === 'MemberExpression' &&
        !chamado.computed &&
        CONSUMIDORES_DE_PROMISE.has(chamado.property.name)
      );
    }

    function verifica(expressao, messageId) {
      if (jaConsumida(expressao)) return;
      const { metodo, raiz } = analisaCadeia(expressao);
      if (!metodo || !raiz || !padraoCliente.test(raiz)) return;
      context.report({ node: expressao, messageId, data: { metodo } });
    }

    return {
      ExpressionStatement(node) {
        const expressao = desembrulha(node.expression);
        if (!expressao) return;

        if (expressao.type === 'AwaitExpression') {
          verifica(expressao.argument, 'resultadoDescartado');
          return;
        }
        // `void supabase...insert()` — intenção de descartar, mas o erro some igual.
        if (expressao.type === 'UnaryExpression' && expressao.operator === 'void') {
          verifica(expressao.argument, 'resultadoDescartado');
          return;
        }
        if (expressao.type === 'CallExpression') {
          verifica(expressao, 'semAwait');
        }
      },
    };
  },
};
