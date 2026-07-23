import { test, expect } from '@playwright/test';

test.describe('Importação XML NF-e', () => {
  test('renderiza tela de importação', async ({ page }) => {
    await page.goto('/tributario/importacao-xml');
    await expect(page.getByRole('heading', { name: /importa[çc][ãa]o|xml|nf-?e/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
