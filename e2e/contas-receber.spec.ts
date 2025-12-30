import { test, expect } from '@playwright/test';

test.describe('Contas a Receber', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/contas-receber');
  });

  test('deve criar nova conta a receber', async ({ page }) => {
    await page.click('button:has-text("Nova")');
    await page.fill('[name="descricao"]', 'Cliente Teste');
    await page.fill('[name="valor"]', '5000');
    await page.click('button:has-text("Salvar")');
    await expect(page.locator('text=/sucesso/i')).toBeVisible();
  });

  test('deve registrar recebimento', async ({ page }) => {
    await page.click('table tbody tr:first-child button:has-text("Receber")');
    await page.fill('[name="valor_recebido"]', '5000');
    await page.click('button:has-text("Confirmar")');
    await expect(page.locator('text=/recebimento.*registrado/i')).toBeVisible();
  });
});
