import { test, expect } from '@playwright/test';

test.describe('SEFAZ Observabilidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tributario/sefaz-observabilidade');
  });

  test('exibe título e KPIs do painel', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /observabilidade sefaz/i }),
    ).toBeVisible({ timeout: 15_000 });
    // KPIs (cards)
    await expect(page.getByText(/cursores ativos/i)).toBeVisible();
    await expect(page.getByText(/alertas abertos/i)).toBeVisible();
  });

  test('permite atualizar dados via botão de refresh', async ({ page }) => {
    const refresh = page.getByRole('button', { name: /atualizar/i }).first();
    await expect(refresh).toBeVisible();
    await refresh.click();
    // Não deve quebrar a UI
    await expect(
      page.getByRole('heading', { name: /observabilidade sefaz/i }),
    ).toBeVisible();
  });

  test('tabela de cursores renderiza cabeçalho', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /cnpj/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /nsu/i }).first()).toBeVisible();
  });

  test('lista de alertas exibe estado (vazio ou com ação resolver)', async ({ page }) => {
    // Ou aparece mensagem de "nenhum alerta" ou botão Resolver disponível
    const empty = page.getByText(/nenhum alerta/i);
    const resolveBtn = page.getByRole('button', { name: /resolver/i }).first();
    await expect(empty.or(resolveBtn)).toBeVisible({ timeout: 15_000 });
  });
});
