import { test, expect } from '@playwright/test';

const hasCalculadoraPrerequisites =
  !!process.env.E2E_USER_EMAIL &&
  !!process.env.E2E_USER_PASSWORD &&
  !!process.env.VITE_SUPABASE_URL &&
  !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
  !!process.env.VITE_SUPABASE_PROJECT_ID;

test.describe('Calculadora Tributária', () => {
  test.skip(!hasCalculadoraPrerequisites, 'E2E da calculadora exige autenticação e envs do Supabase válidos.');

  test('carrega, recalcula em tempo real e alterna regime', async ({ page }) => {
    await page.goto('/tributario/calculadora');

    await expect(page.getByRole('heading', { name: /Calculadora Tributária em Tempo Real/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/comparativo entre regimes/i)).toBeVisible();
    await expect(page.getByText(/memória de cálculo/i)).toBeVisible();
    await expect(page.getByText(/usar dados reais/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /resetar/i })).toBeVisible();

    await expect(page.getByText('Simples Nacional', { exact: true })).toBeVisible();
    await expect(page.getByText('Lucro Presumido')).toBeVisible();
    await expect(page.getByText('Lucro Real', { exact: true })).toBeVisible();
    await expect(page.getByText('CBS').first()).toBeVisible();
    await expect(page.getByText('IBS').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /salvar cenário/i })).toBeVisible();
  });
});
