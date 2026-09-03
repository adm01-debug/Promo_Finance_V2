import { test, expect, type Page } from '@playwright/test';

/**
 * Fluxo destrutivo de login/logout real.
 *
 * Revoga a sessão do usuário de teste e precisa rodar sozinho, fora dos shards
 * e das suítes padrão com storageState compartilhado.
 */

test.describe.configure({ mode: 'serial' });

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value) return value;

  if (process.env.CI) {
    throw new Error(
      `Pré-flight do logout destrutivo falhou: variável obrigatória ausente (${name}).`
    );
  }

  test.skip(true, `${name} não definido fora do CI`);
  return '';
}

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

  test('login -> admin -> logout -> rota protegida redireciona para /auth', async ({ page }) => {
    const email = readRequiredEnv('E2E_USER_EMAIL');
    const password = readRequiredEnv('E2E_USER_PASSWORD');

    await loginAs(page, email, password);

    await page.goto('/admin/system-health');
    await expect(page).toHaveURL(/\/admin\/system-health/);
    await expect(page.getByText(/Acesso restrito/i)).toHaveCount(0);

    // AdminSystemHealth renderiza fora do MainLayout (src/pages/AdminSystemHealth.tsx),
    // então essa rota não monta <Header> nem [data-testid="user-menu"]. O menu do
    // usuário só existe em rotas com layout — volta ao dashboard antes do logout.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await logout(page);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });

    await page.evaluate(() => window.location.assign('/dashboard'));
    await expect(page).toHaveURL(/\/auth/);
  });
});
