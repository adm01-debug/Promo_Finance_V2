import { test, expect } from '@playwright/test';
import {
  CHAVES_ACESSO,
  fakePfxFile,
  makeManifestFail,
  makeNfe,
  mockEdgeFunctions,
  mockPostgrest,
} from './fixtures/nfe';

/**
 * E2E de falhas do fluxo NF-e — cobre upload de certificado, manifestação
 * rejeitada pela SEFAZ e guarda client-side para "Operação Não Realizada".
 * Usa as fixtures em `e2e/fixtures/nfe.ts` para determinismo e reuso.
 */

test.describe('Fluxo NF-e — cenários de falha', () => {
  test('upload de certificado com senha inválida exibe erro e mantém lista vazia', async ({ page }) => {
    await mockPostgrest(page); // sem certificados
    const counts = await mockEdgeFunctions(page, {
      'nfe-upload-certificado': {
        status: 400,
        body: { error: 'Senha do certificado inválida ou PFX corrompido' },
      },
    });

    await page.goto('/tributario/certificados-digitais');
    await expect(page.getByRole('heading', { name: /certificados digitais/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/nenhum certificado cadastrado/i)).toBeVisible();

    await page.getByRole('button', { name: /novo certificado/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles(fakePfxFile());
    await page.locator('input[type="password"]').first().fill('senha-errada');

    const enviar = page.getByRole('button', { name: /enviar|cadastrar|salvar/i }).last();
    await expect(enviar).toBeEnabled();
    await enviar.click();

    await expect(page.getByText(/falha ao processar certificado/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/senha do certificado inválida|pfx corrompido/i)).toBeVisible();

    // Diálogo permanece aberto para correção.
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText(/nenhum certificado cadastrado/i)).toBeVisible();

    expect(counts['nfe-upload-certificado']).toBe(1);
  });

  test('manifestação rejeitada pela SEFAZ exibe cStat/xMotivo e mantém NF-e pendente', async ({ page }) => {
    const nfe = makeNfe({ razao_emitente: 'Fornecedor Falha LTDA', chave_acesso: CHAVES_ACESSO.PADRAO });
    await mockPostgrest(page, { nfes: [nfe] });

    const counts = await mockEdgeFunctions(page, {
      'sefaz-manifestar': { body: makeManifestFail() },
    });

    await page.goto('/tributario/nfe-recebidas');
    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/fornecedor falha ltda/i)).toBeVisible();

    await page.getByRole('button', { name: /manifestar/i }).first().click();
    await page.getByRole('menuitem', { name: /ciência/i }).first().click();

    await expect(page.getByText(/falha ao manifestar nfe/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/cStat 539|Duplicidade de evento/i)).toBeVisible();

    expect(counts['sefaz-manifestar']).toBe(1);
    // NF-e permanece na lista (sem invalidação otimista que sumisse a linha).
    await expect(page.getByText(/fornecedor falha ltda/i)).toBeVisible();
  });

  test('manifestação 210240 sem justificativa bloqueia envio no client', async ({ page }) => {
    await mockPostgrest(page, { nfes: [makeNfe()] });
    const counts = await mockEdgeFunctions(page, {
      'sefaz-manifestar': { body: { ok: true } },
    });

    await page.goto('/tributario/nfe-recebidas');
    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /manifestar/i }).first().click();
    await page.getByRole('menuitem', { name: /não realizada/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const enviar = dialog.getByRole('button', { name: /enviar manifestação/i });
    await expect(enviar).toBeDisabled();

    await dialog.getByRole('textbox').fill('curto demais.');
    await expect(enviar).toBeDisabled();
    expect(counts['sefaz-manifestar']).toBe(0);

    await dialog.getByRole('textbox').fill('justificativa valida para sefaz.');
    await expect(enviar).toBeEnabled();
  });
});
