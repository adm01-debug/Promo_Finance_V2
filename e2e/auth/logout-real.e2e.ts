import { test, expect, type Page } from '@playwright/test';

/**
 * Fluxo destrutivo de login/logout real.
 *
 * Revoga a sessão do usuário de teste e precisa rodar sozinho, fora dos shards
 * e das suítes padrão com storageState compartilhado.
 */

test.describe.configure({ mode: 'serial' });

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-password').press('Enter');
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });
}

async function logout(page: Page) {
  const userMenu = page.getByTestId('user-menu');
  await expect(userMenu).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 15_000 });

  const skipTour = page.locator('[data-action="skip"]');
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
    await expect(page.locator('.react-joyride__overlay')).toHaveCount(0);
  }

  await userMenu.focus();
  await userMenu.press('Enter');
  const logoutItem = page.getByRole('menuitem', { name: /^sair$/i });
  await expect(logoutItem).toBeVisible();
  await logoutItem.press('Enter');
}

test.describe('Login/Logout › fluxo real com admin (isolado)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // eslint-disable-next-line no-empty-pattern -- Playwright exige destructuring no 1º arg
  test.beforeEach(({}, testInfo) => {
    if (!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD) {
      testInfo.skip(true, 'E2E_USER_EMAIL/PASSWORD não definidos');
    }
  });

  test('login com sucesso redireciona para fora de /auth', async ({ page }) => {
    await loginAs(page, process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('admin acessa /admin/system-health após login', async ({ page }) => {
    await loginAs(page, process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
    await page.goto('/admin/system-health');
    await expect(page).toHaveURL(/\/admin\/system-health/);
    await expect(page.getByText(/Acesso restrito/i)).toHaveCount(0);
  });

  test('logout retorna para /auth e limpa sessão', async ({ page }) => {
    await loginAs(page, process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
    await logout(page);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });

    await page.evaluate(() => window.location.assign('/dashboard'));
    await expect(page).toHaveURL(/\/auth/);
  });
});
