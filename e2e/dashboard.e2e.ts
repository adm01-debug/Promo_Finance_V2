import { test, expect, type Page } from '@playwright/test';

const hasDashboardPrerequisites =
  !!process.env.E2E_USER_EMAIL &&
  !!process.env.E2E_USER_PASSWORD &&
  !!process.env.VITE_SUPABASE_URL &&
  !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
  !!process.env.VITE_SUPABASE_PROJECT_ID;

async function abrirDashboard(page: Page) {
  await page.goto('/dashboard');
  const skipTour = page.getByRole('button', { name: /pular tour/i });
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click();
  await expect(page.getByRole('heading', { name: /bom dia|boa tarde|boa noite/i })).toBeVisible();
}

test.describe('Dashboard', () => {
  test.skip(!hasDashboardPrerequisites, 'E2E do dashboard exige autenticação e envs do Supabase válidos.');

  test.beforeEach(async ({ page }) => {
    await abrirDashboard(page);
  });

  test('exibe cabeçalho e KPIs executivos reais', async ({ page }) => {
    await expect(page.getByText('Saldo Consolidado', { exact: true })).toBeVisible();
    await expect(page.getByText('Previsão de Recebimento', { exact: true })).toBeVisible();
    await expect(page.getByText('Compromissos a Pagar', { exact: true })).toBeVisible();
    await expect(page.getByText('Índice de Inadimplência', { exact: true })).toBeVisible();
  });

  test('renderiza os widgets configurados no dashboard', async ({ page }) => {
    await expect(page.locator('#fluxo-caixa')).toBeVisible();
    await expect(page.locator('#composicao')).toBeVisible();
    await expect(page.locator('#vencimentos')).toBeVisible();
    await expect(page.locator('#fluxo-caixa').getByRole('heading', { name: /fluxo de caixa/i })).toBeVisible();
  });

  test('abre a personalização do dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /personalizar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Personalizar Dashboard', { exact: true })).toBeVisible();
  });

  test('alertas apresentam conteúdo ou estado vazio explícito', async ({ page }) => {
    const painel = page.locator('#alertas-preditivos');
    await expect(painel).toBeVisible();
    await expect(
      painel.getByText(/nenhum alerta preditivo no momento|alertas preditivos/i).first(),
    ).toBeVisible();
  });

  test('gráfico de fluxo de caixa possui visualização SVG', async ({ page }) => {
    const fluxo = page.locator('#fluxo-caixa');
    await expect(fluxo).toBeVisible();
    await expect(fluxo.locator('svg').first()).toBeVisible();
  });

  test('navega para contas a pagar por um link real', async ({ page }) => {
    await page.getByRole('link', { name: /compromissos a pagar/i }).click();
    await expect(page).toHaveURL(/contas-pagar/);
  });
});

test.describe('Dashboard responsivo', () => {
  test.skip(!hasDashboardPrerequisites, 'E2E do dashboard exige autenticação e envs do Supabase válidos.');
  test.use({ viewport: { width: 375, height: 667 } });

  test('carrega os KPIs desde o primeiro paint mobile', async ({ page }) => {
    await abrirDashboard(page);
    await expect(page.getByText('Saldo Consolidado', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /personalizar/i })).toBeVisible();
  });
});
