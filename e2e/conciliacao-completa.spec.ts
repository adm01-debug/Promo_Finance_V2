import { test, expect } from '@playwright/test';

test.describe('Conciliação Bancária', () => {
  test('deve fazer upload de OFX', async ({ page }) => {
    await page.goto('/conciliacao');
    await page.setInputFiles('input[type="file"]', 'test-fixtures/extrato.ofx');
    await expect(page.locator('text=Arquivo carregado')).toBeVisible();
  });

  test('deve sugerir matches com IA', async ({ page }) => {
    await page.goto('/conciliacao');
    await page.click('text=Analisar com IA');
    await expect(page.locator('[data-testid="suggestions"]')).toBeVisible();
  });

  test('deve confirmar conciliação', async ({ page }) => {
    await page.goto('/conciliacao');
    await page.click('[data-testid="confirm-match"]');
    await expect(page.locator('text=Conciliado')).toBeVisible();
  });
});
