import { test, expect } from '@playwright/test';

test.describe('Aprovações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/aprovacoes');
  });

  test('deve listar pendentes', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /aprovações/i })).toBeVisible();
  });

  test('deve aprovar item', async ({ page }) => {
    await page.click('table tr:first-child button:has-text("Aprovar")');
    await page.click('button:has-text("Confirmar")');
    await expect(page.locator('text=/aprovado/i')).toBeVisible();
  });

  test('deve rejeitar com motivo', async ({ page }) => {
    await page.click('table tr:first-child button:has-text("Rejeitar")');
    await page.fill('[name="motivo"]', 'Valor incorreto');
    await page.click('button:has-text("Confirmar")');
    await expect(page.locator('text=/rejeitado/i')).toBeVisible();
  });
});
