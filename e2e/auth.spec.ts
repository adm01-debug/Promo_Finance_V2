import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('deve exibir formulário de login', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/erro|inválid/i')).toBeVisible();
    await expect(page).toHaveURL('/auth');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/obrigatório|required/i')).toBeVisible();
  });

  test('deve validar formato de email', async ({ page }) => {
    await page.fill('input[name="email"]', 'emailinvalido');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/email.*válido|valid.*email/i')).toBeVisible();
  });

  test('deve fazer logout', async ({ page }) => {
    // Primeiro fazer login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Fazer logout
    await page.click('[aria-label*="menu"], [data-testid="user-menu"]');
    await page.click('text=/sair|logout/i');
    
    await expect(page).toHaveURL('/auth');
  });

  test('deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    await expect(page).toHaveURL('/auth');
  });

  test('deve persistir sessão após reload', async ({ page }) => {
    // Fazer login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Reload da página
    await page.reload();
    
    // Deve continuar logado
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
