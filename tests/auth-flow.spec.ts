import { test, expect } from '@playwright/test';

// Use environment variables for credentials if available, otherwise use defaults for dev/CI
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password123!';

test.describe('Critical Auth and Navigation Flow', () => {
  
  test('unauthenticated user is redirected to /auth', async ({ page }) => {
    await page.goto('/');
    // Check if we are on /auth page
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator('h2')).toContainText('Promo Finance');
  });

  test('login failure with invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill login form
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Check for error toast or message
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });

  test('protected routes block unauthorized access', async ({ page }) => {
    const protectedPaths = ['/contas-pagar', '/relatorios', '/usuarios'];
    
    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  // This test demonstrates a full flow but requires valid credentials
  test('full auth and navigation flow', async ({ page }) => {
    // 1. Login
    await page.goto('/auth');
    await page.fill('input[id="login-email"]', TEST_USER_EMAIL);
    await page.fill('input[id="login-password"]', TEST_USER_PASSWORD);
    await page.click('button:has-text("Acessar Plataforma")');

    // Wait for navigation to dashboard - check URL or a dashboard element
    await expect(page).toHaveURL(/\/($|dashboard)/, { timeout: 15000 });
    
    // 2. Navigation between pages
    const routes = [
      { path: '/contas-pagar', title: 'Contas a Pagar' },
      { path: '/fluxo-caixa', title: 'Fluxo de Caixa' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));
    }

    // 3. Logout flow
    // The initials in the header are based on the user's email or name
    const initials = TEST_USER_EMAIL.slice(0, 2).toUpperCase();
    const userMenuTrigger = page.locator(`button:has-text("${initials}")`).first();
    
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
      await page.click('text=Sair');
      await expect(page).toHaveURL(/\/auth/);
    }
  });

});

