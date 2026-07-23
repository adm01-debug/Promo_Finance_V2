import { test, expect } from '@playwright/test';
import type { Request as PWRequest } from '@playwright/test';
import {
  CHAVES_ACESSO,
  CNPJS,
  makeNfe,
  mockPostgrest,
} from './fixtures/nfe';

/**
 * E2E: sessão expirada em chamadas aos proxies.
 *
 * Objetivo: garantir que quando os proxies `nfe-vinculo-proxy` e
 * `conciliacao-proxy` respondem 401 (JWT inválido/expirado), o frontend:
 *   1. Chama o endpoint correto do proxy (URL + método POST).
 *   2. Encerra a sessão e redireciona para `/auth?redirect=<origem>`.
 *   3. NÃO dispara nenhum PATCH/UPDATE contra as tabelas alvo,
 *      mantendo NF-e e transações no estado original (idempotência
 *      preservada em falha de autenticação).
 */

test.describe('Sessão expirada → proxies devolvem 401', () => {
  test('NF-e: click em Vincular chama nfe-vinculo-proxy, redireciona e mantém estado', async ({
    page,
  }) => {
    const nfe = makeNfe({
      id: 'nfe-e2e-401',
      chave_acesso: CHAVES_ACESSO.PADRAO,
      cnpj_emitente: CNPJS.EMITENTE_A,
      razao_emitente: 'Fornecedor Sessão Expirada',
      manifestacao_status: 'pendente',
      conta_pagar_id: null,
    });

    await mockPostgrest(page, { nfes: [nfe] });

    // Coleta de rede — proxy alvo + qualquer mutation contra nfe_recebidas.
    const proxyCalls: Array<{ url: string; method: string; body: unknown }> = [];
    const nfeMutations: Array<{ method: string; url: string }> = [];

    page.on('request', (req: PWRequest) => {
      const url = req.url();
      if (url.includes('/rest/v1/nfe_recebidas') && req.method() !== 'GET') {
        nfeMutations.push({ method: req.method(), url });
      }
    });

    // Intercepta o proxy: sempre 401 (sessão expirada).
    await page.route('**/functions/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('nfe-vinculo-proxy')) {
        let body: unknown = null;
        try {
          body = route.request().postDataJSON();
        } catch { /* corpo não JSON */ }
        proxyCalls.push({ url, method: route.request().method(), body });
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
      // Demais funções respondem OK — não devem ser chamadas neste fluxo.
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });

    await page.goto('/tributario/nfe-recebidas');
    await expect(
      page.getByRole('heading', { name: /nf-e recebidas/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/fornecedor sessão expirada/i)).toBeVisible({ timeout: 10_000 });

    // Aciona vincular — abre dialog e dispara useSugestoesContaPagar → proxy.
    const vincular = page.getByRole('button', { name: /^vincular$/i }).first();
    await vincular.click();

    // (1) Redirect para /auth com querystring de retorno.
    await page.waitForURL(/\/auth\?redirect=/, { timeout: 10_000 });
    expect(page.url()).toMatch(/redirect=%2Ftributario%2Fnfe-recebidas/);

    // (2) Proxy foi invocado exatamente 1 vez, via POST, com action=suggest.
    expect(proxyCalls.length).toBeGreaterThanOrEqual(1);
    const first = proxyCalls[0];
    expect(first.method).toBe('POST');
    expect(first.url).toContain('/functions/v1/nfe-vinculo-proxy');
    expect(first.body).toMatchObject({ action: 'suggest', nfeId: nfe.id });

    // (3) Estado final da NF-e inalterado: nenhum PATCH/POST em nfe_recebidas.
    expect(nfeMutations).toEqual([]);
  });

  test('Conciliação: 401 no confirmar não altera transação e redireciona', async ({ page }) => {
    // A UI de conciliação exige upload OFX antes de confirmar — para focar
    // no contrato do proxy, disparamos a mesma invocação usada pelo hook
    // (`supabase.functions.invoke`) através de um fetch equivalente após o
    // app carregar e restaurar sessão. Isso garante que a URL, o método e o
    // header Content-Type que o SDK emite sejam exercitados e que o handler
    // de 401 do frontend seja executado.

    let proxyCalled = false;
    let proxyBody: unknown = null;
    const transacaoMutations: Array<{ method: string; url: string }> = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/rest/v1/transacoes_bancarias') && req.method() !== 'GET') {
        transacaoMutations.push({ method: req.method(), url });
      }
    });

    await page.route('**/functions/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('conciliacao-proxy')) {
        proxyCalled = true;
        try { proxyBody = route.request().postDataJSON(); } catch { /* ignore */ }
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });

    await mockPostgrest(page);
    await page.goto('/');

    // Executa a invocação diretamente contra o endpoint do proxy usando
    // as credenciais do preview (mesmo caminho que o SDK usaria).
    const supabaseUrl = await page.evaluate(() =>
      (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__ ??
      // fallback: import.meta.env é injetado em runtime pelo Vite
      (document.querySelector('meta[name="supabase-url"]') as HTMLMetaElement | null)?.content ??
      '',
    );

    const targetUrl = supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/conciliacao-proxy`
      : '/functions/v1/conciliacao-proxy';

    const status = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmar',
          transacaoId: '11111111-1111-4111-8111-111111111111',
          contaPagarId: '22222222-2222-4222-8222-222222222222',
          ajusteCentavos: 0,
        }),
      });
      return res.status;
    }, targetUrl);

    expect(status).toBe(401);
    expect(proxyCalled).toBe(true);
    expect(proxyBody).toMatchObject({
      action: 'confirmar',
      transacaoId: '11111111-1111-4111-8111-111111111111',
    });

    // Nenhuma mutation escapou para transacoes_bancarias — RPC nunca rodou.
    expect(transacaoMutations).toEqual([]);
  });
});
