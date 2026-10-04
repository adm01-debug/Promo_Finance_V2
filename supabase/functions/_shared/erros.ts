/**
 * Normalizacao de erros capturados.
 *
 * Em `catch (e)` o TypeScript tipa `e` como `unknown` (comportamento correto:
 * JavaScript permite lancar qualquer valor, nao so `Error`). Acessar
 * `e.message` direto quebra o type-check e, em runtime, produz `undefined`
 * quando o que foi lancado e uma string, um objeto do Postgrest ou um
 * `AggregateError` de rede — justamente os casos em que a mensagem importa.
 */
export function mensagemErro(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const registro = e as Record<string, unknown>;
    // Erros do Postgrest/supabase-js nao herdam de Error mas expoem `message`.
    if (typeof registro.message === 'string') return registro.message;
    try {
      return JSON.stringify(e);
    } catch {
      return 'Erro nao serializavel';
    }
  }
  return String(e);
}

/**
 * Detalhe estruturado de uma exceção para o campo `context` dos logs:
 * preserva stack e cause, que `mensagemErro` reduz a uma única linha.
 */
export function contextoErro(e: unknown): Record<string, unknown> {
  if (e instanceof Error) {
    return {
      stack: e.stack,
      ...(e.cause !== undefined ? { cause: mensagemErro(e.cause) } : {}),
    };
  }
  return {};
}
