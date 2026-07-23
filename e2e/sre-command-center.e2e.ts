import { test, expect } from '@playwright/test';

test.describe('SRE Command Center', () => {
  test('carrega tabs SLO/System/Edge/Telemetry', async ({ page }) => {
    await page.goto('/admin/sre?tab=slo');
    await expect(page.getByRole('heading', { name: /sre|command|observabilidade/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
