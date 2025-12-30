import { test, expect } from '@playwright/test';

test.describe('Notas Fiscais', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/notas-fiscais');
  });

  test('deve emitir NFe', async ({ page }) => {
    await page.click('button:has-text("Emitir NFe")');
    await page.fill('[name="cliente"]', 'Cliente Teste');
    await page.fill('[name="valor"]', '10000');
    await page.click('button:has-text("Emitir")');
    await expect(page.locator('text=/nfe.*emitida/i')).toBeVisible({ timeout: 10000 });
  });

  test('deve cancelar NFe', async ({ page }) => {
    await page.click('table tr:first-child button:has-text("Cancelar")');
    await page.fill('[name="justificativa"]', 'Erro na emissão');
    await page.click('button:has-text("Confirmar")');
    await expect(page.locator('text=/cancelada/i')).toBeVisible();
  });

  test('deve consultar status SEFAZ', async ({ page }) => {
    await page.click('table tr:first-child button:has-text("Status")');
    await expect(page.locator('text=/autorizada|rejeitada|processando/i')).toBeVisible();
  });
});
