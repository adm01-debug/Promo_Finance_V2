import { test, expect } from '@playwright/test';

test.describe('Onboarding tributário', () => {
  test('inicia wizard', async ({ page }) => {
    await page.goto('/tributario/onboarding');
    await expect(page.getByRole('heading', { name: /onboarding|regime|configura/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
