import type { Page, Route } from '@playwright/test';

/**
 * Mock genérico de Edge Functions (`/functions/v1/**`).
 *
 * Vivia em `fixtures/nfe.ts`, mas não tem nada de NF-e: conciliação, cobrança e
 * split usam o mesmo mecanismo. Ficou aqui para que uma suíte não precise
 * importar o módulo de outro domínio só para interceptar uma função.
 */

export interface EdgeFunctionResponse {
  status?: number;
  body: unknown;
}

export type EdgeFunctionMocks = Record<
  string,
  EdgeFunctionResponse | ((route: Route) => Promise<void> | void)
>;

/**
 * Cada chave do map é o nome (ou fragmento) da função; o valor pode ser uma
 * resposta declarativa `{ status, body }` ou um handler custom.
 * Funções não mapeadas respondem `{"ok":true}`.
 *
 * Retorna um contador de chamadas por função para asserts — é o que permite
 * provar que uma operação de dinheiro foi disparada UMA vez, e não duas.
 */
export async function mockEdgeFunctions(page: Page, mocks: EdgeFunctionMocks = {}) {
  const counts: Record<string, number> = Object.fromEntries(Object.keys(mocks).map((k) => [k, 0]));

  await page.route('**/functions/v1/**', async (route: Route) => {
    const url = route.request().url();
    for (const [name, handler] of Object.entries(mocks)) {
      if (url.includes(name)) {
        counts[name] = (counts[name] ?? 0) + 1;
        if (typeof handler === 'function') return handler(route);
        return route.fulfill({
          status: handler.status ?? 200,
          contentType: 'application/json',
          body: JSON.stringify(handler.body),
        });
      }
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  return counts;
}
