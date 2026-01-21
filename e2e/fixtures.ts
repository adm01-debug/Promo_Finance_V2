import { test as base, expect } from '@playwright/test';

// Custom types for fixtures
interface TestData {
  conta: {
    descricao: string;
    valor: number;
    dataVencimento: string;
    categoria: string;
  };
  cliente: {
    nome: string;
    email: string;
    cpfCnpj: string;
    telefone: string;
  };
  fornecedor: {
    razaoSocial: string;
    cnpj: string;
    email: string;
    categoria: string;
  };
}

interface TestHelpers {
  waitForTableLoad: () => Promise<void>;
  waitForModalClose: () => Promise<void>;
  waitForSuccessMessage: () => Promise<void>;
  fillCurrencyInput: (label: string, value: number) => Promise<void>;
  selectOption: (label: string, optionText: string) => Promise<void>;
  clearAndType: (label: string, text: string) => Promise<void>;
}

// Extend base test with custom fixtures
export const test = base.extend<{
  testData: TestData;
  helpers: TestHelpers;
}>({
  testData: async ({}, use) => {
    const testData: TestData = {
      conta: {
        descricao: `Conta Teste ${Date.now()}`,
        valor: 1500.50,
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoria: 'Operacional',
      },
      cliente: {
        nome: `Cliente Teste ${Date.now()}`,
        email: `cliente_${Date.now()}@test.com`,
        cpfCnpj: '123.456.789-00',
        telefone: '11999998888',
      },
      fornecedor: {
        razaoSocial: `Fornecedor Teste ${Date.now()} Ltda`,
        cnpj: '12.345.678/0001-90',
        email: `fornecedor_${Date.now()}@test.com`,
        categoria: 'Serviços',
      },
    };
    
    await use(testData);
  },

  helpers: async ({ page }, use) => {
    const helpers: TestHelpers = {
      waitForTableLoad: async () => {
        await page.waitForSelector('table', { state: 'visible' });
        await page.waitForSelector('[data-loading="false"]', { state: 'attached', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(500); // Small buffer for animations
      },

      waitForModalClose: async () => {
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      },

      waitForSuccessMessage: async () => {
        await expect(
          page.getByText(/sucesso|criado|atualizado|excluído/i)
            .or(page.locator('[data-testid="success-toast"]'))
        ).toBeVisible({ timeout: 5000 });
      },

      fillCurrencyInput: async (label: string, value: number) => {
        const input = page.getByLabel(new RegExp(label, 'i'));
        await input.clear();
        // Format as Brazilian currency input expects
        const formattedValue = value.toFixed(2).replace('.', ',');
        await input.fill(formattedValue);
      },

      selectOption: async (label: string, optionText: string) => {
        await page.getByRole('combobox', { name: new RegExp(label, 'i') }).click();
        await page.getByRole('option', { name: new RegExp(optionText, 'i') }).click();
      },

      clearAndType: async (label: string, text: string) => {
        const input = page.getByLabel(new RegExp(label, 'i'));
        await input.clear();
        await input.fill(text);
      },
    };

    await use(helpers);
  },
});

export { expect };

// Page object models for common pages
export class DashboardPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await expect(this.page.getByTestId('stats-cards')).toBeVisible({ timeout: 10000 });
  }

  getStatsCard(name: string) {
    return this.page.getByTestId('stats-cards').getByText(new RegExp(name, 'i'));
  }

  async changePeriod(period: string) {
    await this.page.getByRole('combobox', { name: /período/i }).click();
    await this.page.getByRole('option', { name: new RegExp(period, 'i') }).click();
  }
}

export class ContasPagarPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/contas-pagar');
  }

  async waitForLoad() {
    await expect(this.page.getByRole('table')).toBeVisible({ timeout: 10000 });
  }

  async openCreateModal() {
    await this.page.getByRole('button', { name: /nova conta/i }).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async fillContaForm(data: { descricao: string; valor: number; dataVencimento: string }) {
    await this.page.getByLabel(/descrição/i).fill(data.descricao);
    await this.page.getByLabel(/valor/i).fill(data.valor.toString());
    await this.page.getByLabel(/vencimento/i).fill(data.dataVencimento);
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /salvar/i }).click();
  }

  async filterByStatus(status: string) {
    await this.page.getByRole('combobox', { name: /status/i }).click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
  }

  async search(term: string) {
    await this.page.getByPlaceholder(/buscar/i).fill(term);
  }

  getRow(text: string) {
    return this.page.locator('tr').filter({ hasText: text });
  }
}

export class ClientesPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/clientes');
  }

  async waitForLoad() {
    await expect(this.page.getByRole('table')).toBeVisible({ timeout: 10000 });
  }

  async openCreateModal() {
    await this.page.getByRole('button', { name: /novo cliente/i }).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async fillClienteForm(data: { nome: string; email: string; cpfCnpj?: string }) {
    await this.page.getByLabel(/nome/i).fill(data.nome);
    await this.page.getByLabel(/email/i).fill(data.email);
    if (data.cpfCnpj) {
      await this.page.getByLabel(/cpf|cnpj/i).fill(data.cpfCnpj);
    }
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /salvar/i }).click();
  }
}

export class FornecedoresPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/fornecedores');
  }

  async waitForLoad() {
    await expect(this.page.getByRole('table')).toBeVisible({ timeout: 10000 });
  }

  async openCreateModal() {
    await this.page.getByRole('button', { name: /novo fornecedor/i }).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async fillFornecedorForm(data: { razaoSocial: string; cnpj: string; email: string }) {
    await this.page.getByLabel(/razão social/i).fill(data.razaoSocial);
    await this.page.getByLabel(/cnpj/i).fill(data.cnpj);
    await this.page.getByLabel(/email/i).fill(data.email);
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /salvar/i }).click();
  }
}

// API mocking helpers
export async function mockApiSuccess(page: any, pattern: string, data: any) {
  await page.route(new RegExp(pattern), (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

export async function mockApiError(page: any, pattern: string, status = 500, message = 'Internal Server Error') {
  await page.route(new RegExp(pattern), (route: any) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  });
}

export async function mockApiDelay(page: any, pattern: string, delay: number, data: any) {
  await page.route(new RegExp(pattern), async (route: any) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

// Data generators
export function generateCPF(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 9 }, random);
  
  // Calculate first digit
  let d1 = n.reduce((sum, num, i) => sum + num * (10 - i), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  n.push(d1);
  
  // Calculate second digit
  let d2 = n.reduce((sum, num, i) => sum + num * (11 - i), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  n.push(d2);
  
  return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${n.slice(9).join('')}`;
}

export function generateCNPJ(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 8 }, random);
  n.push(0, 0, 0, 1); // Standard suffix
  
  // Calculate first digit
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d1 = n.reduce((sum, num, i) => sum + num * w1[i], 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  n.push(d1);
  
  // Calculate second digit
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d2 = n.reduce((sum, num, i) => sum + num * w2[i], 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  n.push(d2);
  
  return `${n.slice(0, 2).join('')}.${n.slice(2, 5).join('')}.${n.slice(5, 8).join('')}/${n.slice(8, 12).join('')}-${n.slice(12).join('')}`;
}

export function generateEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}@example.com`;
}

export function generatePhone(): string {
  const ddd = ['11', '21', '31', '41', '51'][Math.floor(Math.random() * 5)];
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `${ddd}${number}`;
}
