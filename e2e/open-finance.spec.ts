import { test, expect } from '@playwright/test';

test.describe('Open Finance', () => {
  test('deve conectar banco', async ({ page }) => {
    await page.goto('/open-finance');
    await page.click('text=Conectar Banco');
    await page.fill('[name="agencia"]', '1234');
    await page.fill('[name="conta"]', '56789-0');
    await page.click('text=Autorizar');
    await expect(page.locator('text=Conectado')).toBeVisible();
  });
});
