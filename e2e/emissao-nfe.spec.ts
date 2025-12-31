import { test, expect } from '@playwright/test';

test.describe('Emissão de NF-e', () => {
  test('deve criar nova NFe', async ({ page }) => {
    await page.goto('/notas-fiscais');
    await page.click('text=Nova NFe');
    await page.fill('[name="numero"]', '12345');
    await page.fill('[name="valor"]', '1000');
    await page.click('text=Emitir');
    await expect(page.locator('text=NFe emitida')).toBeVisible();
  });

  test('deve download XML', async ({ page }) => {
    await page.goto('/notas-fiscais');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-xml"]');
    await downloadPromise;
  });
});
