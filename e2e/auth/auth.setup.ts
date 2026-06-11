import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth');

  // Wait for the login form to be visible
  await expect(page.getByRole('heading', { name: /promo finance/i })).toBeVisible();

  // Fill in credentials
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
  await page.getByLabel(/senha/i).fill(process.env.E2E_USER_PASSWORD || 'Test@123456');

  // Click login button
  await page.getByRole('button', { name: /acessar plataforma/i }).click();

  // Wait for redirect to the authenticated area (login navigates to "/")
  await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 15000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
