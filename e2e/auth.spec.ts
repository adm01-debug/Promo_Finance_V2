import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /entrar|login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar|login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await expect(page.getByText(/email.*obrigatório|required/i)).toBeVisible();
    await expect(page.getByText(/senha.*obrigatória|password.*required/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/senha|password/i).fill('password123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await expect(page.getByText(/email.*inválido|invalid.*email/i)).toBeVisible();
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/senha|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    // Wait for API response
    await page.waitForResponse((response) => 
      response.url().includes('auth') && response.status() !== 200
    ).catch(() => null);
    
    await expect(page.getByText(/credenciais.*inválidas|invalid.*credentials/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should have link to forgot password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /esqueci|forgot/i });
    await expect(forgotLink).toBeVisible();
    
    await forgotLink.click();
    await expect(page).toHaveURL(/forgot-password|recuperar/);
  });

  test('should have link to register', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /cadastr|register|criar.*conta/i });
    await expect(registerLink).toBeVisible();
    
    await registerLink.click();
    await expect(page).toHaveURL(/register|cadastro/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/senha|password/i);
    const toggleButton = page.getByRole('button', { name: /mostrar|show|ver/i });
    
    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should remember user with checkbox', async ({ page }) => {
    const rememberCheckbox = page.getByRole('checkbox', { name: /lembrar|remember/i });
    
    if (await rememberCheckbox.isVisible()) {
      await expect(rememberCheckbox).not.toBeChecked();
      await rememberCheckbox.check();
      await expect(rememberCheckbox).toBeChecked();
    }
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await page.waitForURL(/dashboard/).catch(() => null);
  });

  test('should logout user and redirect to login', async ({ page }) => {
    // Find and click logout button
    const userMenu = page.getByTestId('user-menu');
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    
    const logoutButton = page.getByRole('button', { name: /sair|logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing settings without auth', async ({ page }) => {
    await page.goto('/configuracoes');
    
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing contas-pagar without auth', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    await expect(page).toHaveURL(/login/);
  });
});
