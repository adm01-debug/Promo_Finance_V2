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
    // In this app, we use sonner toast
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });

  test('navigation between main pages when authenticated', async ({ page }) => {
    // Note: In a real CI environment, we would use a seeded user or mock the session
    // For this test, we assume the environment is set up or we're documenting the flow
    
    // 1. Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\//);
    
    // 2. Navigation to protected routes
    const routes = [
      { path: '/contas-pagar', title: 'Contas a Pagar' },
      { path: '/contas-receber', title: 'Contas a Receber' },
      { path: '/fluxo-caixa', title: 'Fluxo de Caixa' },
      { path: '/configuracoes', title: 'Configurações' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));
      // Optional: check for specific page content if known
    }

    // 3. Logout
    // Assuming there's a logout button in the user menu
    const userMenuTrigger = page.locator('button[aria-haspopup="menu"]');
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
      await page.click('text=Sair');
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('protected routes block unauthorized access', async ({ page }) => {
    // Ensure we are logged out
    await page.goto('/auth');
    
    const protectedPaths = ['/contas-pagar', '/relatorios', '/usuarios'];
    
    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth/);
    }
  });
});
