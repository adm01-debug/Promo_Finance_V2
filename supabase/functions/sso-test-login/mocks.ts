/**
 * Helpers de mock para isolar dependências externas nos testes do `sso-test-login`.
 *
 * - `installFetchMock` substitui `globalThis.fetch` por um handler in-memory que
 *   intercepta chamadas a APIs externas (Supabase REST, ipapi, etc) e responde
 *   com payloads determinísticos.
 * - `makeUserLookup` produz um `userLookup` síncrono baseado em um Set de e-mails
 *   considerados "existentes", eliminando a necessidade de chamar
 *   `auth.admin.listUsers()`.
 * - `MockMatcher` permite registrar respostas por (method, urlPattern).
 */

export interface MockMatcher {
  method?: string;
  /** Substring ou RegExp testada contra a URL. */
  urlPattern: string | RegExp;
  /** Resposta — pode ser objeto JSON, string, ou função que recebe a Request. */
  response:
    | { status?: number; body?: unknown; headers?: Record<string, string> }
    | ((req: Request) => Promise<Response> | Response);
}

export interface FetchMockHandle {
  /** Quantas vezes cada matcher foi chamado, na ordem de registro. */
  callCounts: number[];
  /** Histórico cronológico de requisições interceptadas. */
  calls: Array<{ url: string; method: string; body: string | null }>;
  /** Restaura o `globalThis.fetch` original. */
  restore: () => void;
  /** Registra um matcher adicional em runtime. */
  add: (matcher: MockMatcher) => void;
}

export function installFetchMock(initial: MockMatcher[] = []): FetchMockHandle {
  const original = globalThis.fetch;
  const matchers: MockMatcher[] = [...initial];
  const callCounts: number[] = matchers.map(() => 0);
  const calls: FetchMockHandle["calls"] = [];

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = req.url;
    const method = req.method.toUpperCase();
    let bodyText: string | null = null;
    try {
      bodyText = await req.clone().text();
    } catch {
      bodyText = null;
    }
    calls.push({ url, method, body: bodyText });

    for (let i = 0; i < matchers.length; i++) {
      const m = matchers[i];
      if (m.method && m.method.toUpperCase() !== method) continue;
      const matches =
        typeof m.urlPattern === "string"
          ? url.includes(m.urlPattern)
          : m.urlPattern.test(url);
      if (!matches) continue;
      callCounts[i]++;
      if (typeof m.response === "function") {
        return await m.response(req);
      }
      const status = m.response.status ?? 200;
      const body =
        typeof m.response.body === "string"
          ? m.response.body
          : JSON.stringify(m.response.body ?? {});
      const headers = {
        "Content-Type": "application/json",
        ...(m.response.headers ?? {}),
      };
      return new Response(body, { status, headers });
    }

    throw new Error(
      `[fetch-mock] Nenhum matcher para ${method} ${url}. ` +
        `Registre um matcher antes do teste para evitar requisições reais.`,
    );
  }) as typeof fetch;

  return {
    callCounts,
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
    add: (matcher) => {
      matchers.push(matcher);
      callCounts.push(0);
    },
  };
}

/**
 * Cria uma função `userLookup` determinística baseada em um conjunto de e-mails
 * considerados existentes. Compatível com a assinatura usada por `evaluateClaims`.
 */
export function makeUserLookup(existingEmails: Iterable<string> = []) {
  const set = new Set(
    Array.from(existingEmails).map((e) => e.toLowerCase()),
  );
  return async (email: string): Promise<boolean> => {
    return set.has(email.toLowerCase());
  };
}

/**
 * `userLookup` que sempre simula falha de rede (retorna `null`),
 * útil para testar resiliência quando a API admin está indisponível.
 */
export const failingUserLookup = async (): Promise<null> => null;
