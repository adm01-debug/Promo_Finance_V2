import { test, expect, type Page, type Route } from '@playwright/test';
import { mockEdgeFunctions } from '../fixtures/edge';
import {
  contaPagarConciliavel,
  makeTransacaoBancaria,
  mockConciliacao,
} from '../fixtures/financeiro';
import { autenticarOffline } from '../fixtures/sessao';

/**
 * Gate offline da Conciliação Bancária (Etapa 31).
 *
 * Conciliar é a operação de dinheiro menos reversível da tela: baixa a conta,
 * marca a transação e grava a trilha de auditoria numa transação só, via
 * `conciliacao-proxy`. O que estes testes prendem não é o layout — é a
 * CARDINALIDADE da chamada. Um retry cego de mutation (o default do TanStack
 * Query, corrigido na Etapa 31) transforma um 500 momentâneo em duas baixas, e
 * nenhum teste de unidade da tela pegaria isso: o segundo disparo nasce no
 * queryClient, fora do componente.
 *
 * Sem segredos e sem banco: `autenticarOffline` semeia a sessão e intercepta a
 * rede, então o veredito depende só do código da aplicação.
 */

/**
 * Data fixa em vez de "hoje": o deslocamento de fuso que este gate persegue
 * some quando as duas datas comparadas são calculadas do mesmo jeito. Aqui o
 * valor esperado é escrito à mão, então só passa se a UI formatar certo.
 */
const DATA_EXTRATO = '2026-03-10';
const DATA_EXTRATO_EXIBIDA = '10/03/2026';

/** Corpo que a UI enviou ao proxy, na ordem em que os disparos aconteceram. */
type ChamadaProxy = {
  action: string;
  transacaoId: string;
  contaPagarId: string | null;
  contaReceberId: string | null;
};

async function interceptarProxy(page: Page, resposta: { status: number; body: unknown }) {
  const chamadas: ChamadaProxy[] = [];
  await mockEdgeFunctions(page, {
    'conciliacao-proxy': async (route: Route) => {
      chamadas.push(route.request().postDataJSON() as ChamadaProxy);
      await route.fulfill({
        status: resposta.status,
        contentType: 'application/json',
        body: JSON.stringify(resposta.body),
      });
    },
  });
  return chamadas;
}

/** Abre a Conciliação Manual da primeira transação pendente e escolhe o lançamento. */
async function escolherLancamento(page: Page, descricaoLancamento: string) {
  await page
    .getByRole('button', { name: /^conciliar$/i })
    .first()
    .click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /conciliação manual/i })).toBeVisible();
  // Se o diálogo abrisse vazio, o clique abaixo falharia — é o que garante que
  // a asserção de cardinalidade não passe por nunca ter disparado nada.
  await dialog.getByText(descricaoLancamento).click();

  const confirmar = dialog.getByRole('button', { name: /confirmar conciliação/i });
  await expect(confirmar).toBeEnabled();
  return { dialog, confirmar };
}

test.describe('Conciliação bancária (offline)', () => {
  test('lista transações do extrato com valor, tipo e contadores por status', async ({ page }) => {
    await mockConciliacao(page, {
      transacoes: [
        makeTransacaoBancaria({ data: DATA_EXTRATO }),
        makeTransacaoBancaria({
          id: 'tx-2',
          descricao: 'RECEBIMENTO CLIENTE E2E',
          valor: 900,
          tipo: 'credito',
          conciliada: true,
        }),
      ],
    });
    await autenticarOffline(page);

    await page.goto('/conciliacao');
    await expect(page.getByRole('heading', { name: /conciliação bancária/i })).toBeVisible({
      timeout: 15_000,
    });

    // A aba default é "Pendentes": a conciliada não deve aparecer na lista.
    await expect(page.getByText('PAGAMENTO FORNECEDOR E2E')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('RECEBIMENTO CLIENTE E2E')).toHaveCount(0);

    // Débito é exibido com sinal negativo. Âncora `^…$` porque os matchers do
    // Playwright casam por substring: `/1\.500,50/` passaria dentro de
    // "R$ 91.500,50" — justamente o erro que uma asserção dessas deve pegar.
    await expect(page.getByText(/^-R\$\s*1\.500,50$/)).toBeVisible();

    // A data da transação é a data do extrato, não a véspera.
    // `transacoes_bancarias.data` é uma coluna `DATE`: o PostgREST devolve
    // "2026-03-10" e `new Date` lê isso como meia-noite UTC, que em Brasília é
    // 09/03 às 21h. O extrato inteiro aparecia um dia adiantado — numa tela
    // que casa lançamento com extrato POR DATA, isso desalinha a conciliação.
    // Só é observável com fuso negativo: o gate fixa America/Sao_Paulo.
    await expect(page.getByText(DATA_EXTRATO_EXIBIDA)).toBeVisible();

    // Contadores derivam de `conciliada`, não do tab ativo.
    const abaPendentes = page.getByRole('tab', { name: /pendentes/i });
    const abaConciliadas = page.getByRole('tab', { name: /conciliadas/i });
    await expect(abaPendentes).toContainText('1');
    await expect(abaConciliadas).toContainText('1');
    await expect(page.getByText(/1\/2 transações · 1 pendentes/)).toBeVisible();

    await abaConciliadas.click();
    await expect(page.getByText('RECEBIMENTO CLIENTE E2E')).toBeVisible();
    // Conciliada não oferece "Conciliar" — oferece estorno.
    await expect(page.getByRole('button', { name: /estornar/i })).toBeVisible();
  });

  test('conciliação manual dispara UMA única confirmação no proxy', async ({ page }) => {
    const conta = contaPagarConciliavel();
    await mockConciliacao(page, { contasPagar: [conta] });
    const chamadas = await interceptarProxy(page, { status: 200, body: { data: { ok: true } } });
    await autenticarOffline(page);

    await page.goto('/conciliacao');
    await expect(page.getByText('PAGAMENTO FORNECEDOR E2E')).toBeVisible({ timeout: 15_000 });

    const { confirmar } = await escolherLancamento(page, conta.descricao);
    await confirmar.click();

    // UM toast, não dois: o diálogo e o `onSuccess` da mutation celebravam a
    // mesma conciliação, empilhando dois avisos idênticos e confete em dobro.
    await expect(page.getByText(/conciliação concluída/i)).toHaveCount(1, { timeout: 10_000 });

    // Cardinalidade é o veredito: uma confirmação por clique, nunca duas.
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]).toMatchObject({
      action: 'confirmar',
      transacaoId: 'tx-1',
      contaPagarId: conta.id,
      // Débito casa com conta a PAGAR. Se a tela trocasse o lado, a baixa cairia
      // sobre um recebível — erro que o toast de sucesso esconderia.
      contaReceberId: null,
    });

    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('falha do proxy mostra o motivo, não repete a confirmação e mantém a transação pendente', async ({
    page,
  }) => {
    const conta = contaPagarConciliavel();
    await mockConciliacao(page, { contasPagar: [conta] });
    const chamadas = await interceptarProxy(page, {
      status: 409,
      body: { error: 'Transação já conciliada por outro usuário' },
    });
    await autenticarOffline(page);

    await page.goto('/conciliacao');
    await expect(page.getByText('PAGAMENTO FORNECEDOR E2E')).toBeVisible({ timeout: 15_000 });

    const { dialog, confirmar } = await escolherLancamento(page, conta.descricao);
    await confirmar.click();

    // O motivo devolvido pelo proxy tem de chegar ao usuário: "non-2xx status
    // code" não diz a ele o que fazer a seguir.
    await expect(page.getByText(/já conciliada por outro usuário/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/conciliação concluída/i)).toHaveCount(0);

    // Pino de regressão do `mutations.retry: false`: com o default do TanStack
    // Query esta lista teria DOIS elementos, e a segunda tentativa poderia
    // pegar o servidor já recuperado — dupla baixa sobre a mesma transação.
    expect(chamadas).toHaveLength(1);

    // O diálogo continua aberto para nova tentativa — fechá-lo obrigaria o
    // usuário a reencontrar a transação e reselecionar o lançamento.
    await expect(dialog).toBeVisible();

    // Fechado o diálogo, a transação segue pendente e conciliável. O `getByRole`
    // só enxerga a lista depois disso: o Radix marca o resto da página como
    // `aria-hidden` enquanto o modal está aberto.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('button', { name: /^conciliar$/i }).first()).toBeVisible();
  });
});
