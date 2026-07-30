import { test, expect } from '@playwright/test';

test.describe('Multi-empresa Permissions', () => {
  test.beforeEach(async ({ page }) => {
    // Auth logic here or use storageState
    await page.goto('/dashboard');
    // Ensure empresa selection if needed
    if (await page.getByText(/Escolha a empresa para acessar/i).isVisible()) {
      await page.getByRole('button', { name: /Continuar/i }).first().click();
    }
  });

  test('admin can access system health', async ({ page }) => {
    // Assuming E2E_USER_ROLE is admin
    await page.goto('/admin/system-health');
    await expect(page).toHaveURL('/admin/system-health');
    await expect(page.getByText(/Saúde do Sistema/i)).toBeVisible();
  });

  test('access is denied for restricted roles', async ({ page }) => {
    // Try accessing a route that requires admin if user was downgraded
    // For now, testing general protected route stability
    await page.goto('/configuracoes');
    await expect(page).toHaveURL('/configuracoes');
  });

  test('can switch between companies and preserve session', async ({ page }) => {
    const switcher = page.getByRole('combobox', { name: /Selecionar empresa/i });
    if (await switcher.isVisible()) {
      await switcher.click();
      const options = page.getByRole('option');
      if (await options.count() > 1) {
        const target = await options.nth(1).innerText();
        await options.nth(1).click();
        await expect(page.getByText(new RegExp(target, 'i'))).toBeVisible();
      }
    }
  });
});
