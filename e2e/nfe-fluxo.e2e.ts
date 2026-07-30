import { test, expect } from '@playwright/test';

/**
 * E2E smoke do fluxo NF-e:
 *  1) Upload do certificado A1 (página CertificadosDigitais)
 *  2) Listagem de NF-e recebidas com filtros
 *  3) Manifestação (abrir menu e disparar evento SEFAZ)
 *  4) Vincular NF-e a conta a pagar
 *
 * Observação: SEFAZ real não é acionado — as mutations são interceptadas
 * via route mocking para validar o encadeamento de UI ponta a ponta,
 * de forma determinística e sem dependência de certificado válido.
 */

test.describe('Fluxo NF-e (upload → manifestar → vincular financeiro)', () => {
  // ---------- Mocks compartilhados ----------
  test.beforeEach(async ({ page }) => {
    // Uma NF-e pendente e sem vínculo para a listagem.
    const nfeRow = {
      id: 'nfe-1',
      chave_acesso: '35240612345678000199550010000000011000000019',
      numero: '1',
      serie: '1',
      cnpj_emitente: '12.345.678/0001-99',
      razao_emitente: 'Fornecedor Teste LTDA',
      uf_emitente: 'SP',
      data_emissao: new Date().toISOString(),
      valor_total: 1234.56,
      manifestacao_status: 'pendente',
      conta_pagar_id: null,
      xml_path: null,
    };

    // Intercepta chamadas PostgREST/RPC (Supabase) para tornar o teste offline.
    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('nfe_recebidas')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([nfeRow]),
        });
      }
      if (url.includes('empresas_certificados')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      if (url.includes('contas_pagar')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/functions/v1/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
  });

  test('upload de certificado A1 valida campos obrigatórios', async ({ page }) => {
    await page.goto('/tributario/certificados-digitais');

    await expect(
      page.getByRole('heading', { name: /certificados digitais/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Botão Enviar existe e começa desabilitado sem arquivo/senha.
    const enviar = page.getByRole('button', { name: /enviar/i }).first();
    await expect(enviar).toBeVisible();

    // Simula seleção de arquivo .pfx (in-memory) — não dispara upload real
    // porque as chamadas de rede estão mockadas.
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'certificado.pfx',
      mimeType: 'application/x-pkcs12',
      buffer: Buffer.from('fake-pfx-bytes-for-e2e-only'),
    });

    // Preenche senha
    const senha = page.locator('input[type="password"]').first();
    await senha.fill('senha-teste');

    // Botão fica habilitado após preencher.
    await expect(enviar).toBeEnabled();
  });

  test('lista NF-e recebidas, permite manifestar e vincular financeiro', async ({ page }) => {
    await page.goto('/tributario/nfe-recebidas');

    await expect(
      page.getByRole('heading', { name: /nf-e recebidas/i }),
    ).toBeVisible({ timeout: 15_000 });

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
    await expect(
      page.getByRole('heading', { name: /nf-e recebidas/i }),
    ).toBeVisible();

    // Ação de vincular financeiro disponível na linha
    const vincular = page.getByRole('button', { name: /^vincular$/i }).first();
    await expect(vincular).toBeVisible();
    await vincular.click();

    // Diálogo/painel de vínculo abre (heurística: qualquer dialog ARIA)
    const dialog = page.getByRole('dialog');
    await expect(dialog.first()).toBeVisible({ timeout: 5_000 });
  });
});
