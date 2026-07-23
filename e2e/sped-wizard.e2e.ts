import { test, expect } from '@playwright/test';

test.describe('SPED Wizard', () => {
  test('carrega tela de SPED', async ({ page }) => {
    await page.goto('/tributario/sped');
    await expect(page.getByRole('heading', { name: /sped/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
