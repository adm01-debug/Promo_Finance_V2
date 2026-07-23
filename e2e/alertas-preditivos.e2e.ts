import { test, expect } from '@playwright/test';

test.describe('Alertas preditivos', () => {
  test('carrega tela de alertas', async ({ page }) => {
    await page.goto('/alertas');
    await expect(page.getByRole('heading', { name: /alerta/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
