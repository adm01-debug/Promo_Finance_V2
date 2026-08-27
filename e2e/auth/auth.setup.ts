import { test as setup, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
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
  const tokenResponse = page.waitForResponse(
    (response) => response.url().includes('/auth/v1/token') && response.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByRole('button', { name: /Acessar Plataforma/i }).click();

  const response = await tokenResponse;
  if (!response.ok()) {
    throw new Error(
      `Autenticação E2E rejeitada pelo Supabase Auth (HTTP ${response.status()}). `
      + 'Verifique E2E_USER_EMAIL, E2E_USER_PASSWORD, confirmação e bloqueio do usuário de teste.',
    );
  }

  // Wait for redirect off /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
