import { test, expect } from '@playwright/test';

test.describe('Fluxo de Caixa', () => {
  test('deve acessar página de fluxo de caixa', async ({ page }) => {
    await page.goto('/fluxo-caixa');
    await expect(page.locator('h1')).toContainText('Fluxo de Caixa');
  });

  test('deve visualizar projeções', async ({ page }) => {
    await page.goto('/fluxo-caixa');
    await page.click('text=Projeções');
    await expect(page.locator('[data-testid="chart"]')).toBeVisible();
  });

  test('deve exportar relatório', async ({ page }) => {
    await page.goto('/fluxo-caixa');
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Exportar');
    await downloadPromise;
  });
});
