import { test, expect } from '@playwright/test';

test.describe('Boletos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/boletos');
  });

  test('deve gerar boleto', async ({ page }) => {
    await page.click('button:has-text("Gerar Boleto")');
    await page.fill('[name="valor"]', '1500');
    await page.fill('[name="vencimento"]', '2025-02-15');
    await page.click('button:has-text("Gerar")');
    await expect(page.locator('text=/boleto.*gerado/i')).toBeVisible();
  });

  test('deve visualizar linha digitável', async ({ page }) => {
    await page.click('table tr:first-child button:has-text("Ver")');
    await expect(page.locator('[data-testid="linha-digitavel"]')).toBeVisible();
  });

  test('deve baixar PDF', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('table tr:first-child button:has-text("PDF")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/boleto.*\.pdf/i);
  });
});
