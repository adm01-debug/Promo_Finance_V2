import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('deve exibir métricas principais', async ({ page }) => {
    await expect(page.locator('text=/total.*receber|a receber/i')).toBeVisible();
    await expect(page.locator('text=/total.*pagar|a pagar/i')).toBeVisible();
    await expect(page.locator('text=/saldo|fluxo.*caixa/i')).toBeVisible();
  });

  test('deve exibir gráficos', async ({ page }) => {
    await expect(page.locator('canvas, svg').first()).toBeVisible();
  });

  test('deve filtrar por período', async ({ page }) => {
    await page.click('button:has-text("Mês"), select[name="periodo"]');
    await page.click('text=/ano|year/i');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('canvas, svg').first()).toBeVisible();
  });

  test('deve exibir transações recentes', async ({ page }) => {
    await expect(page.locator('text=/transações.*recentes|recent.*transactions/i')).toBeVisible();
  });

  test('deve navegar para detalhes ao clicar em métrica', async ({ page }) => {
    await page.click('text=/total.*receber/i');
    await expect(page).toHaveURL(/contas-receber/);
  });
});
