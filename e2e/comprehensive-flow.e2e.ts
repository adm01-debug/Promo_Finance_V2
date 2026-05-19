import { test, expect } from '@playwright/test';

test.describe('Freight Quest - Full User Journey', () => {
  test('should complete a full business cycle', async ({ page }) => {
    // 1. Login
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Dashboard Access
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 3. Create Invoice / Conta a Receber
    await page.click('nav >> text=Contas a Receber');
    await page.click('button:has-text("Novo Lançamento")');
    await page.fill('input[name="description"]', 'Fatura de Teste E2E');
    await page.fill('input[name="amount"]', '1500');
    await page.click('button:has-text("Salvar")');
    
    // 4. Verify in List
    await expect(page.locator('text=Fatura de Teste E2E')).toBeVisible();
    
    // 5. Reports
    await page.click('nav >> text=Relatórios');
    await expect(page.locator('h1')).toContainText('Relatórios');
  });

  test('should handle invalid login states', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'wrong@user.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });
});
