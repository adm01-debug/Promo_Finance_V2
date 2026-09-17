import { test, expect } from '@playwright/test';
import { autenticarOffline } from './fixtures/sessao';

/**
 * Smoke da régua de cobrança — gate bloqueante desde a Etapa 31.
 *
 * Antes da Etapa 31 esta spec vivia na quarentena e, sem credenciais, passava
 * pelo motivo errado: o `/cobrancas` redirecionava para `/auth` e o heading
 * que ela procura nunca chegava a ser avaliado contra a tela real. Com a
 * sessão offline a rota protegida é de fato renderizada.
 */

test.describe('Régua de cobrança', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarOffline(page);
  });

  test('renderiza a tela de cobranças autenticada', async ({ page }) => {
    await page.goto('/cobrancas');

    // Não basta o heading: sem sessão o app cai em `/auth`, e é justamente
    // esse falso verde que a promoção ao gate precisa impedir.
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole('heading', { name: /cobran[çc]a/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
