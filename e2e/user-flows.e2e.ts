import { test, expect } from '@playwright/test';

test.describe('Fluxos de Usuário e Estados de Erro', () => {
  test.beforeEach(async ({ page }) => {
    // Usando o estado de autenticação configurado em auth.setup.ts
    await page.goto('/dashboard');
  });

  test('Deve navegar por todos os módulos principais', async ({ page }) => {
    const modules = [
      { name: 'Simulação de Regimes', path: '/simulacao-regimes' },
      { name: 'Contas a Pagar', path: '/contas-pagar' },
      { name: 'Contas a Receber', path: '/contas-receber' },
      { name: 'Conciliação', path: '/conciliacao' },
      { name: 'Relatórios', path: '/relatorios' },
      { name: 'Configurações', path: '/settings' }
    ];

    for (const mod of modules) {
      await page.click(`text=${mod.name}`);
      await expect(page).toHaveURL(new RegExp(mod.path));
      // Validar que a tela carregou (procurando por um título H1 ou H2)
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('Deve validar estados de erro em formulários', async ({ page }) => {
    await page.goto('/contas-pagar');
    await page.click('button:has-text("Nova Conta")');
    
    // Tentar salvar sem preencher
    await page.click('button:has-text("Salvar")');
    
    // Validar mensagens de erro (assumindo que usamos react-hook-form com mensagens padrão)
    const errorMessages = page.locator('text=obrigatório');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('Deve simular falha de rede e verificar resiliência', async ({ page }) => {
    // Abortar requisições para a API do Supabase
    await page.route('**/rest/v1/**', route => route.abort());
    
    await page.goto('/dashboard');
    
    // Verificar se um toast de erro ou estado empty aparece
    await expect(page.locator('text=Erro ao carregar|Falha ao conectar')).toBeVisible();
  });
});
