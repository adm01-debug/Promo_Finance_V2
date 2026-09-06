import { test, expect, type Page } from '@playwright/test';

/**
 * Suite focada em:
 *  1. /admin/* bloqueia usuários não autenticados (redirect /auth)
 *  2. Fluxo de login (validação + sucesso)
 *  3. Usuário autenticado SEM role admin é barrado em /admin/* (card "Acesso restrito")
 *
 * Variáveis de ambiente:
 *  - E2E_USER_EMAIL / E2E_USER_PASSWORD       → usuário admin (login em cenários isolados)
 *  - E2E_NONADMIN_EMAIL / E2E_NONADMIN_PASSWORD → usuário sem perfil admin (RBAC negativo)
 *
 * Os blocos que dependem de credenciais usam test.skip() quando ausentes,
 * permitindo que a parte não-autenticada rode em qualquer ambiente (CI sem secrets).
 */

const ADMIN_ONLY_ROUTES = [
  '/admin/telemetria',
  '/admin/edge-health',
  '/admin/system-health',
  '/admin/sso',
  '/admin/sso-jit-events',
  '/admin/scim-audit',
  '/admin/sso-events',
  '/admin/compliance',
  '/admin/filtros-compartilhados',
  '/admin/api',
  '/admin/campos-customizados',
] as const;

const ADMIN_OR_FINANCEIRO_ROUTES = [
  '/admin/insights-ia',
  '/admin/auditoria-ia',
] as const;

const ADMIN_ROUTES = [...ADMIN_ONLY_ROUTES, ...ADMIN_OR_FINANCEIRO_ROUTES] as const;

// --- Helpers ----------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-password').press('Enter');
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });
}

// ============================================================================
// 1) NÃO AUTENTICADO — bloqueio de rotas administrativas
// ============================================================================

test.describe('RBAC › usuário não autenticado', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ADMIN_ROUTES) {
    test(`bloqueia acesso anônimo a ${route} (redireciona para /auth)`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
      await expect(page.locator('#login-email')).toBeVisible();
    });
  }

  test('rotas protegidas (não-admin) também redirecionam para /auth', async ({ page }) => {
    for (const route of ['/dashboard', '/contas-pagar', '/relatorios']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
    }
  });
});

// ============================================================================
// 2) FORM DE LOGIN — validação client-side e erro com credenciais inválidas
// ============================================================================

test.describe('Login › validação do formulário', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('exibe a aba de login por padrão', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Acessar Plataforma/i })).toBeVisible();
  });

  test('credenciais inválidas exibem toast/mensagem de erro', async ({ page }) => {
    await page.goto('/auth');
    await page.locator('#login-email').fill('inexistente@exemplo.com');
    await page.locator('#login-password').fill('SenhaErrada123!');
    // Submit via form (evita overlays do preview interceptarem o click)
    await page.locator('#login-password').press('Enter');

    // Toast (sonner) OU mensagem inline
    const toast = page.locator('li[data-sonner-toast], [role="status"], [role="alert"]');
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    // Continua em /auth
    await expect(page).toHaveURL(/\/auth/);
  });
});

// ============================================================================

// ============================================================================
// 4) RBAC NEGATIVO — usuário autenticado SEM admin é barrado em /admin/*
=======
// 3) RBAC NEGATIVO — usuário autenticado SEM admin é barrado em /admin/*
// ============================================================================

test.describe('RBAC › usuário autenticado sem perfil admin', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // eslint-disable-next-line no-empty-pattern -- Playwright exige destructuring no 1º arg
  test.beforeEach(({}, testInfo) => {
    if (!process.env.E2E_NONADMIN_EMAIL || !process.env.E2E_NONADMIN_PASSWORD) {
      testInfo.skip(true, 'E2E_NONADMIN_EMAIL/PASSWORD não definidos');
    }
  });

  for (const route of ADMIN_ONLY_ROUTES) {
    test(`não-admin é barrado em ${route} com card "Acesso restrito"`, async ({ page }) => {
      await loginAs(page, process.env.E2E_NONADMIN_EMAIL!, process.env.E2E_NONADMIN_PASSWORD!);
      await page.goto(route);
      // Permanece na URL (não é redirect — ProtectedRoute renderiza o card)
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.getByText(/Acesso restrito/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/perfil/i).first()).toBeVisible();
    });
  }
});
