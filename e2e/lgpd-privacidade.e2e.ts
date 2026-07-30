import { test, expect } from '@playwright/test';

test.describe('LGPD & Privacidade', () => {
  test('renderiza página de privacidade', async ({ page }) => {
    await page.goto('/configuracoes/privacidade');
    await expect(page.getByRole('heading', { name: /privacidade|lgpd/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
