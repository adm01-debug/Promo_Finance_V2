import { test, expect, type Page } from '@playwright/test';

/**
 * Fluxo DESTRUTIVO de login/logout real — projeto `chromium-destructive`.
 *
 * O logout do app (src/hooks/AuthProvider.tsx) revoga a sessão no Auth e marca
 * `user_sessions.revoked = true` no banco. Como os shards do CI compartilham o
 * MESMO usuário de teste (E2E_USER_EMAIL), esse fluxo invalida sessões
 * concorrentes e provoca falhas em cascata quando roda em paralelo.
 *
 * Por isso este arquivo:
 *  - é excluído dos shards (testIgnore no projeto `chromium`);
 *  - roda isolado, por último, no job serial `e2e-destructive` do CI
 *    (needs: [e2e]), sem paralelismo com qualquer outro teste;
 *  - usa `mode: 'serial'` internamente e contexto limpo (nunca o storageState
 *    compartilhado).
 *
 * Variáveis de ambiente:
 *  - E2E_USER_EMAIL / E2E_USER_PASSWORD → usuário admin (login/logout)
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
  // O redirect do login ocorre antes de o layout terminar de montar. Aguarda
  // explicitamente o menu estável do header para não disputar essa renderização.
  const userMenu = page.getByTestId('user-menu');
  await expect(userMenu).toBeVisible({ timeout: 15_000 });
  // O toast de login ocupa o canto do header e intercepta o clique enquanto
  // está visível. O teste deve exercitar um clique real, sem force.
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 15_000 });
  // O tour consulta o progresso de forma assíncrona e pode montar depois do
  // header. Neste ponto a consulta já assentou; encerra a primeira experiência.
  const skipTour = page.locator('[data-action="skip"]');
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
    await expect(page.locator('.react-joyride__overlay')).toHaveCount(0);
  }
  // A navegação por teclado é parte do contrato acessível do menu e não é
  // bloqueada por overlays visuais de fluxos independentes.
  await userMenu.focus();
  await userMenu.press('Enter');
  const logoutItem = page.getByRole('menuitem', { name: /^sair$/i });
  await expect(logoutItem).toBeVisible();
  await logoutItem.press('Enter');
}

test.describe('Login/Logout › fluxo real com admin (estágio destrutivo serial)', () => {
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
    // Não deve ver "Acesso restrito"
    await expect(page.getByText(/Acesso restrito/i)).toHaveCount(0);
  });

  test('logout retorna para /auth e limpa sessão', async ({ page }) => {
    await loginAs(page, process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
    await logout(page);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });

    // Tentar voltar para uma rota protegida deve redirecionar de novo para /auth
    // O guard redireciona imediatamente e pode abortar a navegação iniciada
    // por page.goto no Chromium. Disparar pelo browser evita falso negativo.
    await page.evaluate(() => window.location.assign('/dashboard'));
    await expect(page).toHaveURL(/\/auth/);
  });
});
