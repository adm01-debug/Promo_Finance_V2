import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for the login form to be visible
  await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
  
  // Fill in credentials
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
  await page.getByLabel(/senha/i).fill(process.env.E2E_USER_PASSWORD || 'Test@123456');
  
  // Click login button
  await page.getByRole('button', { name: /entrar/i }).click();
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  
  // Verify we're logged in
  await expect(page.getByText(/dashboard/i)).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup.describe('setup verification', () => {
  setup('can access protected routes after auth', async ({ page }) => {
    // Load saved auth state
    await page.goto('/dashboard');
    
    // Should be able to access dashboard without redirect to login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/bem-vindo/i)).toBeVisible();
  });
});
