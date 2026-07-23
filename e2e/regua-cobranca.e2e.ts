import { test, expect } from '@playwright/test';

test.describe('Régua de cobrança', () => {
  test('carrega e mostra etapas', async ({ page }) => {
    await page.goto('/cobrancas');
    await expect(page.getByRole('heading', { name: /cobran[çc]a/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
