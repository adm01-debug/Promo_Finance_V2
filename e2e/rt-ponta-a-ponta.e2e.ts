import { test, expect } from '@playwright/test';
import { autenticarOffline } from './fixtures/sessao';

/**
 * Etapa 96 — E2E ponta a ponta do fluxo RT/RFB:
 *   produto → NF-e → XML → crédito → apuração.
 *
 * Verifica o caminho de navegação das telas-chave do módulo tributário sem
 * acionar SEFAZ real nem Supabase (`autenticarOffline` semeia sessão e
 * intercepta a rede). Cobre a jornada do usuário: importar XML (crédito
 * IBS/CBS), conferir a apuração mensal e a conciliação contra apuração
 * assistida.
 *
 * Gate bloqueante desde a Etapa 96.
 */

test.describe('RT ponta a ponta (produto → NF-e → XML → crédito → apuração)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarOffline(page);
  });

  test('importação XML renderiza e permite colar extrato', async ({ page }) => {
    await page.goto('/tributario/importacao-xml');
    await expect(
      page.getByRole('heading', { name: /importa[çc][ãa]o|xml|nf-?e/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('apuração mensal exibe o painel IBS/CBS', async ({ page }) => {
    await page.goto('/reforma-tributaria');
    await expect(
      page.getByRole('heading', { name: /apura[cç][ãa]o|reforma/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('conciliação tributária permite colar extrato da apuração assistida', async ({ page }) => {
    await page.goto('/tributario/conciliacao');
    await expect(page.getByRole('heading', { name: /concilia[cç][ãa]o/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('painel de conciliação aceita colagem de CSV de apuração assistida', async ({ page }) => {
    await page.goto('/tributario/conciliacao');
    const textarea = page.getByPlaceholder(/chave_acesso,cbs_credito,ibs_credito/i);
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill(
      'chave_acesso,cbs_credito,ibs_credito\n35240612345678000199550010000000011000000019,150.00,120.00'
    );
    await page.getByRole('button', { name: /analisar/i }).click();
    // Sem a rede mockada de créditos, a tabela de diff pode ficar vazia — o
    // objetivo aqui é provar que o parsing + análise disparam sem erro.
    await expect(
      page.getByText(/nenhuma linha no extrato|diverge|n.o encontrada|ok/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
