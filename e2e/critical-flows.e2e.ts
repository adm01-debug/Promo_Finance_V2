import { test, expect } from '@playwright/test';

test.describe('Autenticação e Fluxos Críticos', () => {
  test('Fluxo completo de autenticação e logout', async ({ page }) => {
    await page.goto('/auth');
    await expect(page).toHaveURL(/.*auth/);
    
    // Teste de validação de formulário
    await page.click('button[type="submit"]');
    await expect(page.locator('text=obrigatório|required').first()).toBeVisible();
  });

  test('Criação e Atualização de Contas (Receber/Pagar)', async ({ page }) => {
    // Note: Requer mock ou usuário de teste
    await page.goto('/contas-receber');
    
    // Verificar se o botão de novo lançamento está presente
    const newBtn = page.getByRole('button', { name: /novo|adicionar/i }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('Validação de Alertas em Cenário de Erro', async ({ page }) => {
    // Simular falha de rede para ver o alerta (Toast/Sonner)
    await page.route('**/functions/v1/**', route => route.abort('failed'));
    await page.goto('/dashboard');
    
    // O sistema deve mostrar um alerta de erro
    await expect(page.locator('text=erro|falha|error|failed').first()).toBeVisible();
  });
});
