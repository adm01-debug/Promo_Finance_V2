import { test, expect } from '@playwright/test';

// These tests run without auth state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('heading', { name: /entrar|login/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/senha/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    });

    test('shows validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('button', { name: /entrar/i }).click();
      
      await expect(page.getByText(/email.*obrigatório|email é obrigatório/i)).toBeVisible();
      await expect(page.getByText(/senha.*obrigatória|senha é obrigatória/i)).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/senha/i).fill('Test@123456');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      await expect(page.getByText(/email.*inválido|formato.*email/i)).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/senha/i).fill('WrongPassword123');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      await expect(page.getByText(/credenciais.*inválidas|usuário.*não encontrado|senha.*incorreta/i)).toBeVisible({ timeout: 10000 });
    });

    test('successful login redirects to dashboard', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
      await page.getByLabel(/senha/i).fill(process.env.E2E_USER_PASSWORD || 'Test@123456');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('remembers email when checkbox is checked', async ({ page }) => {
      await page.goto('/login');
      
      const email = 'remember@example.com';
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/lembrar|remember/i).check();
      
      // Reload page
      await page.reload();
      
      // Email should be prefilled
      await expect(page.getByLabel(/email/i)).toHaveValue(email);
    });

    test('shows/hides password', async ({ page }) => {
      await page.goto('/login');
      
      const passwordInput = page.getByLabel(/senha/i);
      const toggleButton = page.getByRole('button', { name: /mostrar|exibir|show/i });
      
      await passwordInput.fill('MyPassword123');
      
      // Initially password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle
      await toggleButton.click();
      
      // Should be text type now
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again
      await toggleButton.click();
      
      // Back to password
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('navigates to forgot password', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('link', { name: /esqueceu.*senha|forgot/i }).click();
      
      await expect(page).toHaveURL(/forgot-password|recuperar/);
    });

    test('navigates to register', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('link', { name: /criar.*conta|cadastrar|register/i }).click();
      
      await expect(page).toHaveURL(/register|cadastro/);
    });

    test('shows loading state during login', async ({ page }) => {
      await page.goto('/login');
      
      // Mock slow response
      await page.route('**/auth/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('Test@123456');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      // Should show loading indicator
      await expect(page.getByRole('button', { name: /entrar/i })).toBeDisabled();
    });
  });

  test.describe('Register', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto('/register');
      
      await expect(page.getByRole('heading', { name: /criar.*conta|cadastro|register/i })).toBeVisible();
      await expect(page.getByLabel(/nome/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^senha$/i)).toBeVisible();
      await expect(page.getByLabel(/confirmar.*senha|confirm/i)).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByRole('button', { name: /cadastrar|criar|registrar/i }).click();
      
      await expect(page.getByText(/nome.*obrigatório/i)).toBeVisible();
      await expect(page.getByText(/email.*obrigatório/i)).toBeVisible();
    });

    test('validates password requirements', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByLabel(/^senha$/i).fill('weak');
      await page.getByRole('button', { name: /cadastrar|criar|registrar/i }).click();
      
      await expect(page.getByText(/senha.*caracteres|password.*characters|mínimo/i)).toBeVisible();
    });

    test('validates password confirmation', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByLabel(/^senha$/i).fill('StrongPass@123');
      await page.getByLabel(/confirmar.*senha|confirm/i).fill('DifferentPass@123');
      await page.getByRole('button', { name: /cadastrar|criar|registrar/i }).click();
      
      await expect(page.getByText(/senhas.*não.*coincidem|passwords.*match/i)).toBeVisible();
    });

    test('shows password strength indicator', async ({ page }) => {
      await page.goto('/register');
      
      const passwordInput = page.getByLabel(/^senha$/i);
      
      // Weak password
      await passwordInput.fill('weak');
      await expect(page.getByText(/fraca|weak/i)).toBeVisible();
      
      // Medium password
      await passwordInput.fill('Medium123');
      await expect(page.getByText(/média|medium/i)).toBeVisible();
      
      // Strong password
      await passwordInput.fill('StrongP@ss123!');
      await expect(page.getByText(/forte|strong/i)).toBeVisible();
    });

    test('successful registration shows confirmation', async ({ page }) => {
      await page.goto('/register');
      
      // Generate unique email
      const uniqueEmail = `test_${Date.now()}@example.com`;
      
      await page.getByLabel(/nome/i).fill('Test User');
      await page.getByLabel(/empresa/i).fill('Test Company');
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/^senha$/i).fill('StrongP@ss123!');
      await page.getByLabel(/confirmar.*senha|confirm/i).fill('StrongP@ss123!');
      
      // Accept terms if checkbox exists
      const termsCheckbox = page.getByLabel(/termos|terms/i);
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }
      
      await page.getByRole('button', { name: /cadastrar|criar|registrar/i }).click();
      
      // Should show confirmation or redirect
      await expect(
        page.getByText(/verificar.*email|confirmar.*email|conta.*criada/i)
          .or(page.locator('[data-testid="success-message"]'))
      ).toBeVisible({ timeout: 10000 });
    });

    test('navigates back to login', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByRole('link', { name: /já.*conta|login|entrar/i }).click();
      
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Forgot Password', () => {
    test('displays forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await expect(page.getByRole('heading', { name: /recuperar|esqueceu|reset/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /enviar|recuperar|reset/i })).toBeVisible();
    });

    test('validates email', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByRole('button', { name: /enviar|recuperar|reset/i }).click();
      
      await expect(page.getByText(/email.*obrigatório/i)).toBeVisible();
    });

    test('sends reset email', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByRole('button', { name: /enviar|recuperar|reset/i }).click();
      
      // Should show success message
      await expect(page.getByText(/enviado|instruções|check.*email/i)).toBeVisible({ timeout: 10000 });
    });

    test('navigates back to login', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByRole('link', { name: /voltar|back|login/i }).click();
      
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL(/login/);
    });

    test('redirects to login for all protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/contas-pagar',
        '/contas-receber',
        '/clientes',
        '/fornecedores',
        '/relatorios',
        '/configuracoes',
      ];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/login/, { timeout: 5000 });
      }
    });

    test('preserves intended destination after login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/relatorios');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
      
      // Login
      await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
      await page.getByLabel(/senha/i).fill(process.env.E2E_USER_PASSWORD || 'Test@123456');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      // Should redirect to originally intended route
      await expect(page).toHaveURL(/relatorios/, { timeout: 10000 });
    });
  });
});
