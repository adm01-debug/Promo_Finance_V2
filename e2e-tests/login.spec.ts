import { test, expect } from '@playwright/test';

test('unauthenticated visitor is redirected to login and gets validation feedback', async ({
  page,
}) => {
  // The app is fully protected: visiting the home route without a session
  // should bounce the user to the authentication screen.
  await page.goto('/');

  // Redirected to the login page.
  await expect(page).toHaveURL(/\/auth/);

  // The login form is rendered.
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();

  // Submitting an empty form surfaces inline validation messages.
  await page.getByRole('button', { name: 'Acessar Plataforma' }).click();

  await expect(page.getByText('Email inválido')).toBeVisible();
  await expect(page.getByText('Senha deve ter no mínimo 8 caracteres')).toBeVisible();
});
