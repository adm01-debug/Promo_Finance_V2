import { expect, test } from '@playwright/test';

const EMPTY_STORAGE = { cookies: [], origins: [] };
const HAS_E2E_CREDENTIALS = Boolean(
  process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD,
);

test.use({ storageState: EMPTY_STORAGE });

test.describe('Autenticação', () => {
  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth');
    });

    test('exibe o formulário atual de acesso', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'Acessar' })).toHaveAttribute('data-state', 'active');
      await expect(page.locator('#login-email')).toBeVisible();
      await expect(page.locator('#login-password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Acessar Plataforma' })).toBeVisible();
    });

    test('valida campos vazios sem chamar o backend', async ({ page }) => {
      await page.getByRole('button', { name: 'Acessar Plataforma' }).click();

      await expect(page.getByText('Email inválido')).toBeVisible();
      await expect(page.getByText('Senha deve ter no mínimo 8 caracteres')).toBeVisible();
    });

    test('valida a obrigatoriedade de caractere especial', async ({ page }) => {
      await page.locator('#login-email').fill('usuario@example.com');
      await page.locator('#login-password').fill('SenhaSemEspecial123');
      await page.getByRole('button', { name: 'Acessar Plataforma' }).click();

      await expect(page.getByText('Senha deve conter caractere especial')).toBeVisible();
    });

    test('alterna a visibilidade da senha', async ({ page }) => {
      const password = page.locator('#login-password');
      await password.fill('MinhaSenha@123');
      await expect(password).toHaveAttribute('type', 'password');

      await page.getByRole('button', { name: 'Mostrar senha' }).click();
      await expect(password).toHaveAttribute('type', 'text');

      await page.getByRole('button', { name: 'Esconder senha' }).click();
      await expect(password).toHaveAttribute('type', 'password');
    });

    test('autentica no ambiente canônico e sai de /auth', async ({ page }, testInfo) => {
      testInfo.skip(!HAS_E2E_CREDENTIALS, 'Credenciais E2E não configuradas');

      await page.locator('#login-email').fill(process.env.E2E_USER_EMAIL!);
      await page.locator('#login-password').fill(process.env.E2E_USER_PASSWORD!);
      await page.getByRole('button', { name: 'Acessar Plataforma' }).click();

      await expect(page).not.toHaveURL(/\/auth(?:\?|$)/, { timeout: 20_000 });
    });
  });

  test.describe('Cadastro', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth');
      await page.getByRole('tab', { name: 'Criar Conta' }).click();
    });

    test('exibe os campos e o indicador de força atuais', async ({ page }) => {
      await expect(page.locator('#register-name')).toBeVisible();
      await expect(page.locator('#register-email')).toBeVisible();
      await expect(page.locator('#register-password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Criar Conta Premium' })).toBeVisible();

      await page.locator('#register-password').fill('fraca');
      await expect(page.getByText('Fraca', { exact: true })).toBeVisible();

      await page.locator('#register-password').fill('SenhaForte@123');
      await expect(page.getByText('Forte', { exact: true })).toBeVisible();
    });

    test('valida os campos obrigatórios', async ({ page }) => {
      await page.getByRole('button', { name: 'Criar Conta Premium' }).click();

      await expect(page.getByText('Nome completo é obrigatório')).toBeVisible();
      await expect(page.getByText('Email inválido')).toBeVisible();
      await expect(page.getByText('Senha deve ter no mínimo 8 caracteres')).toBeVisible();
    });

    test('retorna ao login pela aba de acesso', async ({ page }) => {
      await page.getByRole('tab', { name: 'Acessar' }).click();

      await expect(page.locator('#login-email')).toBeVisible();
      await expect(page.locator('#register-name')).toBeHidden();
      await expect(page).toHaveURL(/\/auth$/);
    });
  });

  test.describe('Recuperação de senha', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth');
      await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    });

    test('abre o formulário dentro da rota /auth', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Recuperar Senha' })).toBeVisible();
      await expect(page.locator('#forgot-email')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Solicitar Recuperação' })).toBeVisible();
      await expect(page).toHaveURL(/\/auth$/);
    });

    test('valida email vazio', async ({ page }) => {
      await page.getByRole('button', { name: 'Solicitar Recuperação' }).click();
      await expect(page.getByText('Email inválido')).toBeVisible();
    });

    test('confirma uma solicitação aceita pelo backend', async ({ page }) => {
      await page.route('**/rest/v1/password_reset_requests*', (route) =>
        route.fulfill({ status: 201, contentType: 'application/json', body: '[]' }),
      );

      await page.locator('#forgot-email').fill('usuario@example.com');
      await page.getByRole('button', { name: 'Solicitar Recuperação' }).click();

      await expect(page.getByRole('heading', { name: 'Solicitação Enviada!' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Voltar ao Login' })).toBeVisible();
    });

    test('volta ao formulário de acesso', async ({ page }) => {
      await page.getByRole('button', { name: 'Voltar ao Login' }).click();
      await expect(page.locator('#login-email')).toBeVisible();
      await expect(page).toHaveURL(/\/auth$/);
    });
  });

  test.describe('Rotas protegidas', () => {
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
      test(`${route} redireciona visitantes para /auth`, async ({ page }) => {
        await page.goto(route);
        await expect(page).toHaveURL(/\/auth$/, { timeout: 10_000 });
        await expect(page.locator('#login-email')).toBeVisible();
      });
    }
  });
});
