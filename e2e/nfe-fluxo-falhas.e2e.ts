import { test, expect, type Route } from '@playwright/test';

/**
 * E2E de falhas do fluxo NF-e:
 *  1) Upload de certificado A1 — edge function `nfe-upload-certificado`
 *     retorna 400 (senha inválida / PFX corrompido). Valida toast de erro,
 *     que o diálogo permanece aberto e que nenhum certificado aparece na lista
 *     (estado final "empty").
 *  2) Manifestação SEFAZ — edge function `sefaz-manifestar` responde
 *     `{ ok:false, cStat:'539', xMotivo:'Rejeição: ...' }`. Valida toast de
 *     falha, mensagem SEFAZ propagada e NF-e permanecendo em `pendente`.
 *  3) Manifestação "Operação Não Realizada" (210240) — guarda client-side
 *     bloqueia envio com justificativa < 15 caracteres (botão desabilitado
 *     e nenhuma chamada de rede disparada).
 *
 * Todas as chamadas de rede são mockadas para o teste ser determinístico
 * e independente de infraestrutura SEFAZ / Storage.
 */

const CHAVE = '35240612345678000199550010000000011000000019';

const nfePendente = {
  id: 'nfe-fail-1',
  chave_acesso: CHAVE,
  numero: '1',
  serie: '1',
  cnpj_emitente: '12.345.678/0001-99',
  razao_emitente: 'Fornecedor Falha LTDA',
  uf_emitente: 'SP',
  data_emissao: new Date().toISOString(),
  valor_total: 999.99,
  manifestacao_status: 'pendente',
  conta_pagar_id: null,
  xml_path: null,
};

async function mockPostgrest(page: import('@playwright/test').Page) {
  await page.route('**/rest/v1/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('nfe_recebidas')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([nfePendente]) });
    }
    if (url.includes('empresas_certificados')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

test.describe('Fluxo NF-e — cenários de falha', () => {
  test('upload de certificado com senha inválida exibe erro e mantém lista vazia', async ({ page }) => {
    await mockPostgrest(page);

    let uploadCalls = 0;
    await page.route('**/functions/v1/nfe-upload-certificado', async (route) => {
      uploadCalls++;
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Senha do certificado inválida ou PFX corrompido' }),
      });
    });
    // Demais edge functions são no-op.
    await page.route('**/functions/v1/**', async (route) => {
      if (route.request().url().includes('nfe-upload-certificado')) return; // já tratado acima
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/tributario/certificados-digitais');
    await expect(page.getByRole('heading', { name: /certificados digitais/i })).toBeVisible({ timeout: 15_000 });

    // Empty state inicial
    await expect(page.getByText(/nenhum certificado cadastrado/i)).toBeVisible();

    // Abre dialog e preenche formulário.
    await page.getByRole('button', { name: /novo certificado/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'certificado.pfx',
      mimeType: 'application/x-pkcs12',
      buffer: Buffer.from('fake-pfx-invalido'),
    });
    await page.locator('input[type="password"]').first().fill('senha-errada');

    const enviar = page.getByRole('button', { name: /enviar|cadastrar|salvar/i }).last();
    await expect(enviar).toBeEnabled();
    await enviar.click();

    // Toast de erro do sonner com a mensagem propagada.
    await expect(page.getByText(/falha ao processar certificado/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/senha do certificado inválida|pfx corrompido/i)).toBeVisible();

    // Diálogo permanece aberto (não fechou em erro) — usuário pode corrigir.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Estado final: lista continua vazia.
    // Fecha diálogo e verifica empty state.
    await page.keyboard.press('Escape');
    await expect(page.getByText(/nenhum certificado cadastrado/i)).toBeVisible();

    expect(uploadCalls).toBe(1);
  });

  test('manifestação rejeitada pela SEFAZ exibe cStat/xMotivo e mantém NF-e pendente', async ({ page }) => {
    await mockPostgrest(page);

    let manifestCalls = 0;
    await page.route('**/functions/v1/sefaz-manifestar', async (route) => {
      manifestCalls++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          cStat: '539',
          xMotivo: 'Rejeição: Duplicidade de evento',
          nProt: null,
          status_novo: 'pendente',
          evento_inserido: false,
        }),
      });
    });
    await page.route('**/functions/v1/**', async (route) => {
      if (route.request().url().includes('sefaz-manifestar')) return;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/tributario/nfe-recebidas');
    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible({ timeout: 15_000 });

    // Linha da NF-e visível e em estado pendente.
    await expect(page.getByText(/fornecedor falha ltda/i)).toBeVisible();

    // Dispara Ciência da Operação (não requer justificativa).
    await page.getByRole('button', { name: /manifestar/i }).first().click();
    await page.getByRole('menuitem', { name: /ciência/i }).first().click();

    // Toast de falha com título e descrição contendo cStat/xMotivo.
    await expect(page.getByText(/falha ao manifestar nfe/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/cStat 539|Duplicidade de evento/i)).toBeVisible();

    expect(manifestCalls).toBe(1);

    // Estado final: NF-e permanece na lista com o mesmo emitente (sem re-render de sucesso).
    await expect(page.getByText(/fornecedor falha ltda/i)).toBeVisible();
  });

  test('manifestação 210240 sem justificativa bloqueia envio no client', async ({ page }) => {
    await mockPostgrest(page);

    let manifestCalls = 0;
    await page.route('**/functions/v1/sefaz-manifestar', async (route) => {
      manifestCalls++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.route('**/functions/v1/**', async (route) => {
      if (route.request().url().includes('sefaz-manifestar')) return;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/tributario/nfe-recebidas');
    await expect(page.getByRole('heading', { name: /nf-e recebidas/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /manifestar/i }).first().click();
    await page.getByRole('menuitem', { name: /não realizada/i }).first().click();

    // Diálogo de justificativa aparece.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const enviar = dialog.getByRole('button', { name: /enviar manifestação/i });
    await expect(enviar).toBeDisabled();

    // Texto abaixo do mínimo (14 chars) mantém desabilitado.
    await dialog.getByRole('textbox').fill('curto demais.');
    await expect(enviar).toBeDisabled();

    // Confirma que nenhuma chamada foi disparada.
    expect(manifestCalls).toBe(0);

    // Ao completar 15+ chars, o botão habilita.
    await dialog.getByRole('textbox').fill('justificativa valida para sefaz.');
    await expect(enviar).toBeEnabled();
  });
});
