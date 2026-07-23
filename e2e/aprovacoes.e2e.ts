import { test, expect } from '@playwright/test';

test.describe('Aprovações multi-nível', () => {
  test('renderiza fila de aprovações', async ({ page }) => {
    await page.goto('/aprovacoes');
    await expect(page.getByRole('heading', { name: /aprova[çc][ãa]o/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
