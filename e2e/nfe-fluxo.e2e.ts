import { test, expect } from '@playwright/test';
import {
  CHAVES_ACESSO,
  makeNfe,
  makeSugestaoContaPagar,
  makeSugestoesResponse,
  mockEdgeFunctions,
  mockPostgrest,
} from './fixtures/nfe';
import { EMPRESA_OFFLINE, autenticarOffline } from './fixtures/sessao';

/**
 * E2E do fluxo NF-e:
 *  1) Upload do certificado A1 (página CertificadosDigitais)
 *  2) Listagem de NF-e recebidas com filtros
 *  3) Manifestação (abrir menu e disparar evento SEFAZ)
 *  4) Vincular NF-e a conta a pagar
 *
 * Gate bloqueante desde a Etapa 31 (`playwright.financeiro.config.ts`).
 * SEFAZ real não é acionado e nem o Supabase: `autenticarOffline` semeia a
 * sessão e intercepta a rede, então o veredito depende só do código da UI.
 */

test.describe('Fluxo NF-e (upload → manifestar → vincular financeiro)', () => {
  test.beforeEach(async ({ page }) => {
    await mockPostgrest(page, {
      nfes: [
        makeNfe({
          id: 'nfe-1',
          chave_acesso: CHAVES_ACESSO.PADRAO,
          razao_emitente: 'Fornecedor Teste LTDA',
          data_emissao: new Date().toISOString(),
        }),
      ],
    });
    await mockEdgeFunctions(page);
    await autenticarOffline(page);
  });

  test('upload de certificado A1 valida campos obrigatórios', async ({ page }) => {
    await page.goto('/tributario/certificados-digitais');

    // `{ level: 1 }`: a aba renderiza um <h3> "Certificados Digitais A1" além
    // do <h1> da página, e o seletor sem nível casava com os dois.
    await expect(
      page.getByRole('heading', { level: 1, name: /certificados digitais/i })
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /novo certificado/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // São três campos obrigatórios — empresa, arquivo e senha. O teste
    // preenche um de cada vez para provar que nenhum sozinho libera o envio.
    const enviar = dialog.getByRole('button', { name: /enviar/i });
    await expect(enviar).toBeDisabled();

    // Arquivo .pfx in-memory: nenhum upload real acontece, a rede está mockada.
    await dialog
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'certificado.pfx',
        mimeType: 'application/x-pkcs12',
        buffer: Buffer.from('fake-pfx-bytes-for-e2e-only'),
      });
    await expect(enviar).toBeDisabled();

    await dialog.locator('input[type="password"]').first().fill('senha-teste');
    // Ainda falta a empresa: é o campo que o teste anterior não preenchia e,
    // por isso, media o botão errado (fora do diálogo, que nem estava aberto).
    await expect(enviar).toBeDisabled();

    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: new RegExp(EMPRESA_OFFLINE.razao_social, 'i') }).click();

    await expect(enviar).toBeEnabled();
  });

  test('lista NF-e recebidas, permite manifestar e vincular financeiro', async ({ page }) => {
    const sugestao = makeSugestaoContaPagar();
    // Handler próprio: o proxy multiplexa ações no corpo do POST, e o que se
    // quer verificar é justamente qual ação a UI dispara em cada clique.
    const vinculos: Array<{ action: string; contaPagarId?: string }> = [];
    await mockEdgeFunctions(page, {
      'nfe-vinculo-proxy': async (route) => {
        const corpo = route.request().postDataJSON() as { action: string; contaPagarId?: string };
        vinculos.push({ action: corpo.action, contaPagarId: corpo.contaPagarId });
        const payload =
          corpo.action === 'suggest'
            ? makeSugestoesResponse([sugestao])
            : { data: { ok: true, already_linked: false, conta_pagar_id: corpo.contaPagarId } };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        });
      },
    });

    await page.goto('/tributario/nfe-recebidas');

    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible({
      timeout: 15_000,
    });

    // Filtros presentes
    await expect(page.getByPlaceholder(/buscar por cnpj/i)).toBeVisible();

    // Linha da NF-e mockada aparece
    await expect(page.getByText(/fornecedor teste ltda/i)).toBeVisible({ timeout: 10_000 });

    // Abre menu de manifestação
    const manifestar = page.getByRole('button', { name: /manifestar/i }).first();
    await expect(manifestar).toBeVisible();
    await manifestar.click();

    // Verifica pelo menos uma opção de evento SEFAZ (Ciência da Operação)
    const cienciaItem = page.getByRole('menuitem', { name: /ciência/i }).first();
    await expect(cienciaItem).toBeVisible({ timeout: 5_000 });
    await cienciaItem.click();

    // Fecha o menu voltando ao estado pós-clique — UI não deve quebrar.
    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible();

    // Ação de vincular financeiro disponível na linha
    const vincular = page.getByRole('button', { name: /^vincular$/i }).first();
    await expect(vincular).toBeVisible();
    await vincular.click();

    // O diálogo de vínculo lista as candidatas ranqueadas pela RPC
    // `nfe_suggest_contas_pagar`. Checar só "algum dialog abriu" não distinguia
    // o diálogo renderizado do ErrorBoundary que a página exibia quando o
    // payload não era uma lista — a Etapa 31 flagrou exatamente esse caso.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(
      dialog.getByRole('heading', { name: /vincular nf-e a conta a pagar/i })
    ).toBeVisible();

    await expect(dialog.getByText(sugestao.descricao)).toBeVisible();
    await expect(dialog.getByText(`Score ${sugestao.score}`)).toBeVisible();
    await expect(dialog.getByText(/nenhuma conta a pagar em aberto/i)).toHaveCount(0);

    // Confirma o vínculo: o proxy recebe `action: 'link'` com a conta escolhida.
    await dialog.getByRole('button', { name: /^vincular$/i }).click();
    await expect(page.getByText(/nfe vinculada à conta a pagar/i)).toBeVisible({ timeout: 5_000 });
    expect(vinculos.map((v) => v.action)).toEqual(['suggest', 'link']);
    expect(vinculos[1].contaPagarId).toBe(sugestao.conta_pagar_id);
  });
});
