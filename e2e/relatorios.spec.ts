import { test, expect } from '@playwright/test';

test.describe('Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/relatorios');
  });

  test('deve gerar relatório de fluxo de caixa', async ({ page }) => {
    await page.click('button:has-text("Fluxo de Caixa")');
    await page.fill('[name="data_inicio"]', '2025-01-01');
    await page.fill('[name="data_fim"]', '2025-01-31');
    await page.click('button:has-text("Gerar")');
    await expect(page.locator('canvas, svg')).toBeVisible();
  });

  test('deve exportar para Excel', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Exportar")');
    await page.click('text=/excel/i');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });
});
