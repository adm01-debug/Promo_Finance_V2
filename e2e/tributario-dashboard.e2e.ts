import { test, expect } from '@playwright/test';

test.describe('Dashboard tributário', () => {
  test('carrega dashboard e widgets', async ({ page }) => {
    await page.goto('/tributario/dashboard');
    await expect(page.getByRole('heading', { name: /tribut[áa]rio|dashboard/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
