import { test, expect } from '@playwright/test';

test.describe('Split Payment', () => {
  test('carrega dashboard de split', async ({ page }) => {
    await page.goto('/tributario/split-payment');
    await expect(page.getByRole('heading', { name: /split/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
