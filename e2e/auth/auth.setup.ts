import { test as setup, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const authFile = 'playwright/.auth/user.json';

/**
 * Authenticate the default test user and persist storageState.
 * If E2E_USER_EMAIL/E2E_USER_PASSWORD are not provided, writes an empty
 * storage state so dependent projects can still execute their
 * unauthenticated-scenario tests without failing the whole suite.
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  mkdirSync(dirname(authFile), { recursive: true });

  if (!email || !password) {
    // No credentials: emit empty storage so dependent projects don't fail
    // on missing file or accidentally reuse a stale authenticated session.
    // Authenticated tests should `test.skip()` themselves when credentials
    // are absent.
    writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, 'E2E_USER_EMAIL/PASSWORD not set — skipping real login');
    return;
  }

  await page.goto('/auth');
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });

  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /Acessar Plataforma/i }).click();

  // Wait for redirect off /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
