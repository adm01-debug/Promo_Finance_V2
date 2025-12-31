import { test, expect } from '@playwright/test';

test.describe('Expert AI Workflow', () => {
  test('deve executar análise expert', async ({ page }) => {
    await page.goto('/expert');
    await page.click('text=Analisar Finanças');
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
  });

  test('deve aplicar sugestão', async ({ page }) => {
    await page.goto('/expert');
    await page.click('[data-testid="apply-suggestion"]');
    await expect(page.locator('text=Aplicado')).toBeVisible();
  });
});
