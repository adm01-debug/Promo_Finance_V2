import { test, expect } from '@playwright/test';

test.describe('Cobrança Automática', () => {
  test('deve configurar régua de cobrança', async ({ page }) => {
    await page.goto('/cobrancas');
    await page.click('text=Nova Régua');
    await page.fill('[name="nome"]', 'Padrão');
    await page.click('text=Adicionar Etapa');
    await page.click('text=Salvar');
    await expect(page.locator('text=Régua criada')).toBeVisible();
  });

  test('deve enviar cobrança', async ({ page }) => {
    await page.goto('/cobrancas');
    await page.click('[data-testid="send-cobranca"]');
    await expect(page.locator('text=Cobrança enviada')).toBeVisible();
  });
});
