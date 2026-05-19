import { test, expect } from '@playwright/test';

test.describe('Freight Quest - Error States & Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful auth for all tests
    await page.goto('/auth');
    // Assuming we have a way to skip real auth or use a test account
  });

  test('should show validation errors on invalid form submission', async ({ page }) => {
    await page.goto('/dashboard/contas-receber');
    await page.click('button:has-text("Novo Lançamento")');
    
    // Submit empty form
    await page.click('button:has-text("Salvar")');
    
    // Check for required field errors (adjusting based on actual UI)
    const errorMessages = page.locator('.text-red-500, .text-destructive');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should handle 404 page correctly', async ({ page }) => {
    await page.goto('/página-que-não-existe');
    await expect(page.locator('text=404')).toBeVisible();
    await page.click('text=Voltar para o Início');
    await expect(page).toHaveURL('/');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and fail them
    await page.route('**/functions/v1/**', route => route.abort('failed'));
    
    await page.goto('/dashboard');
    // Check if an error toast or message appears
    await expect(page.locator('text=erro|falha|error|failed').first()).toBeVisible();
  });
});
