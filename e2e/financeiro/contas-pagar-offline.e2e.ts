import { test, expect, type Locator, type Page } from '@playwright/test';
import { autenticarOffline } from '../fixtures/sessao';
import { cenarioKpisContasPagar, makeContaPagar, mockContasPagar } from '../fixtures/financeiro';

/**
 * Gate offline de Contas a Pagar (Etapa 31).
 *
 * O que se verifica aqui é aritmética de dinheiro na tela, não que a página
 * "abre": os quatro KPIs saem de quatro ramos diferentes de
 * `useContasPagarLogic` e cada um tem um jeito próprio de errar — somar conta
 * cancelada, contar como vencida uma conta paga em atraso, incluir no "pago no
 * mês" um pagamento de outro mês. O cenário dá a cada ramo um valor distinto,
 * então um ramo trocado muda o número exibido em vez de coincidir com o certo.
 */

/**
 * Valor do KPI: o `StatCard` renderiza `<p>{label}</p>` seguido do
 * `<span>` do `AnimatedNumber`. Ancorar no rótulo evita depender de classe
 * utilitária ou da posição do cartão na grade.
 */
function kpi(page: Page, rotulo: string): Locator {
  return page
    .locator('p', { hasText: new RegExp(`^${rotulo}$`) })
    .locator('xpath=following-sibling::span[1]');
}

test.describe('Contas a Pagar — offline', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarOffline(page);
  });

  test('KPIs somam por status: cancelada fora, vencida contada, paga no mês somada', async ({
    page,
  }) => {
    await mockContasPagar(page);

    await page.goto('/contas-pagar');
    await expect(page.getByRole('heading', { name: /contas a pagar/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // 1000 (pendente) + 500 (vencida). A cancelada de 90.000 fica de fora e a
    // paga de 300 já saiu do saldo devedor.
    //
    // Regex ancorada, não parcial: `/1\.500,00/` casaria dentro de
    // "R$ 91.500,00" — exatamente o valor que a tela exibiria se a conta
    // cancelada voltasse a ser somada. `\s` cobre o espaço rígido que o
    // `Intl.NumberFormat` pt-BR põe depois de "R$".
    await expect(kpi(page, 'Total a Pagar')).toHaveText(/^R\$\s*1\.500,00$/);
    await expect(kpi(page, 'Vencido')).toHaveText(/^R\$\s*500,00$/);
    await expect(kpi(page, 'Pago no Mês')).toHaveText(/^R\$\s*300,00$/);
    await expect(kpi(page, 'Vence Hoje')).toHaveText('1');
  });

  test('lista as contas do período com fornecedor e valor', async ({ page }) => {
    await mockContasPagar(page);

    await page.goto('/contas-pagar');
    await expect(page.getByText(/energia — vence hoje/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/aluguel — em atraso/i)).toBeVisible();
    await expect(page.getByText(/imobiliária central/i)).toBeVisible();
  });

  test('sem contas, os KPIs zeram em vez de sumir ou exibir NaN', async ({ page }) => {
    await mockContasPagar(page, { contas: [] });

    await page.goto('/contas-pagar');
    await expect(page.getByRole('heading', { name: /contas a pagar/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(kpi(page, 'Total a Pagar')).toHaveText(/^R\$\s*0,00$/);
    await expect(kpi(page, 'Vencido')).toHaveText(/^R\$\s*0,00$/);
    await expect(kpi(page, 'Vence Hoje')).toHaveText('0');
    // `formatCurrency(NaN)` devolveria "R$ 0,00", mas uma divisão por zero no
    // delta de mês vazava "NaN%" para o cartão de Pago no Mês.
    await expect(page.getByText(/NaN/)).toHaveCount(0);
  });

  test('o formulário de nova conta exige descrição, valor e vencimento', async ({ page }) => {
    await mockContasPagar(page, { contas: [] });

    // Submeter em branco não pode gravar nada: o teste falha se qualquer POST
    // escapar para `contas_pagar`. Registrado antes do `goto` para não perder
    // nenhuma requisição do carregamento.
    const gravacoes: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/rest/v1/contas_pagar')) {
        gravacoes.push(req.url());
      }
    });

    await page.goto('/contas-pagar');
    // O atalho do menu lateral tem o mesmo rótulo do botão do cabeçalho; o
    // escopo em `#main-content` desfaz a ambiguidade sem recorrer a `.first()`,
    // que dependeria da ordem no DOM.
    const conteudo = page.locator('#main-content');
    await conteudo.getByRole('button', { name: /novo registro/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('button', { name: /salvar|cadastrar|criar/i })
      .last()
      .click();
    await expect(dialog).toBeVisible();
    expect(gravacoes).toEqual([]);
  });

  test('a conta destacada por deep-link aparece na lista', async ({ page }) => {
    await mockContasPagar(page, {
      contas: [makeContaPagar({ id: 'cp-destaque', descricao: 'Conta destacada por URL' })],
    });

    await page.goto('/contas-pagar?highlight=cp-destaque');
    await expect(page.getByText(/conta destacada por url/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Contas a Pagar — cenário de KPI', () => {
  test('o cenário cobre um representante de cada status', () => {
    const status = cenarioKpisContasPagar()
      .map((c) => c.status)
      .sort();
    expect(status).toEqual(['cancelado', 'pago', 'pendente', 'vencido']);
  });
});
