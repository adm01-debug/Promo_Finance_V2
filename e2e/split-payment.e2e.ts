import { test, expect } from '@playwright/test';
import { autenticarOffline } from './fixtures/sessao';

/**
 * Smoke do Split Payment — gate bloqueante desde a Etapa 31.
 * Mesma armadilha da régua de cobrança: sem sessão o teste media o redirect
 * para `/auth`, não a tela. Ver `e2e/fixtures/sessao.ts`.
 */

test.describe('Split Payment', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarOffline(page);
  });

  test('renderiza o dashboard de split autenticado', async ({ page }) => {
    await page.goto('/tributario/split-payment');

    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole('heading', { name: /split/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
