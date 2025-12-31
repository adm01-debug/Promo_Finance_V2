import { test, expect } from '@playwright/test';

test.describe('Relatórios Agendados', () => {
  test('deve agendar relatório', async ({ page }) => {
    await page.goto('/relatorios');
    await page.click('text=Agendar');
    await page.select('[name="tipo"]', 'fluxo-caixa');
    await page.select('[name="periodicidade"]', 'mensal');
    await page.click('text=Salvar');
    await expect(page.locator('text=Agendado')).toBeVisible();
  });

  test('deve executar relatório manualmente', async ({ page }) => {
    await page.goto('/relatorios');
    await page.click('[data-testid="execute-now"]');
    await expect(page.locator('text=Executando')).toBeVisible();
  });
});
