import { test, expect } from '@playwright/test';

test.describe('Sincronização Bitrix24', () => {
  test('deve sincronizar dados', async ({ page }) => {
    await page.goto('/bitrix24');
    await page.click('text=Sincronizar');
    await expect(page.locator('text=Sincronizado')).toBeVisible();
  });

  test('deve importar leads', async ({ page }) => {
    await page.goto('/bitrix24');
    await page.click('text=Importar Leads');
    await expect(page.locator('[data-testid="leads-count"]')).toBeVisible();
  });
});
