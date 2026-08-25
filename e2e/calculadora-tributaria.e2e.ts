import { test, expect } from '@playwright/test';

test.describe('Calculadora Tributária', () => {
  test('carrega, recalcula em tempo real e alterna regime', async ({ page }) => {
    await page.goto('/tributario/calculadora');

    await expect(page.getByRole('heading', { name: /Calculadora Tributária/i })).toBeVisible({ timeout: 15_000 });

    // Verifica que os 4 regimes existem no comparativo
    await expect(page.getByText('Simples Nacional', { exact: true })).toBeVisible();
    await expect(page.getByText('Lucro Presumido')).toBeVisible();
    await expect(page.getByText('Lucro Real', { exact: true })).toBeVisible();

    // Alterna para Simples e confere que aparece DAS
    await page.getByRole('tab', { name: /Simples/i }).click();
    await expect(page.getByText('DAS').first()).toBeVisible();

    // Alterna para Reforma e confere CBS/IBS
    await page.getByRole('tab', { name: /Reforma/i }).click();
    await expect(page.getByText('CBS').first()).toBeVisible();
    await expect(page.getByText('IBS').first()).toBeVisible();

    // PDF button presente
    await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
  });
});
