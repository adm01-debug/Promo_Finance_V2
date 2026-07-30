import { test, expect, ConciliacaoPage } from './fixtures';

test.describe('Conciliação Bancária E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow is handled by auth.setup.ts
    const conciliacaoPage = new ConciliacaoPage(page);
    await conciliacaoPage.goto();
    await conciliacaoPage.waitForLoad();
  });

  test('deve realizar upload de arquivo OFX e encontrar matches por valor e data', async ({ page }) => {
    const conciliacaoPage = new ConciliacaoPage(page);
    
    // 1. Abrir modal de importação
    await conciliacaoPage.openImportModal();
    
    // 2. Mock de um arquivo OFX
    const ofxContent = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <STMTRS>
        <CURDEF>BRL
        <BANKACCTFROM>
          <BANKID>001
          <ACCTID>123456
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20260501000000
          <DTEND>20260531000000
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260509120000
            <TRNAMT>-1500.50
            <FITID>12345
            <CHECKNUM>12345
            <MEMO>PAGAMENTO TESTE E2E
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>5000.00
          <DTASOF>20260531000000
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

    // 3. Upload do arquivo
    const filePayload = {
      name: 'extrato.ofx',
      mimeType: 'application/x-ofx',
      buffer: Buffer.from(ofxContent)
    };
    
    await page.setInputFiles('input[type="file"]', filePayload);
    
    // 4. Verificar se o relatório de importação apareceu
    await expect(page.getByText(/Relatório de Importação/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/1 transações encontradas/i)).toBeVisible();
    
    // 5. Fechar relatório e verificar match na lista
    await page.getByRole('button', { name: /Entendido/i }).click();
    
    // 6. Verificar se a transação aparece na fila de sugestões IA
    await expect(page.getByText(/Fila de Sugestões/i)).toBeVisible();
    await expect(page.getByText(/PAGAMENTO TESTE E2E/i)).toBeVisible();
    
    // 7. Validar se o valor está correto
    await expect(page.getByText(/R\$ 1\.500,50/i)).toBeVisible();
  });

  test('deve detectar divergências de saldo entre OFX e sistema', async ({ page }) => {
    // Similar ao teste acima, mas com saldo final que não bate com a soma das transações
    // O hook useConciliacaoPage já tem essa lógica de emitir toast.warning
    const conciliacaoPage = new ConciliacaoPage(page);
    await conciliacaoPage.openImportModal();
    
    const ofxDivergente = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNAMT>-100.00
            <DTPOSTED>20260509120000
            <MEMO>DIVERGENCIA TESTE
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>9999.99
          <DTASOF>20260531000000
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

    await page.setInputFiles('input[type="file"]', {
      name: 'divergente.ofx',
      mimeType: 'application/x-ofx',
      buffer: Buffer.from(ofxDivergente)
    });
    
    // Verificar alerta de divergência
    await expect(page.getByText(/Divergência de Saldo Detectada/i)).toBeVisible();
  });

  test('deve suportar múltiplas contas bancárias e CNPJs', async ({ page }) => {
    // Verificar se o seletor de bancos existe e tem opções
    await page.getByRole('combobox', { name: /banco/i }).click();
    const options = page.getByRole('option');
    await expect(options.count()).toBeGreaterThan(0);
    
    // Selecionar a primeira conta
    await options.first().click();
    
    // Verificar se o dashboard por empresa (múltiplos CNPJs) carrega corretamente
    await page.getByRole('tab', { name: /Dashboard/i }).click();
    await expect(page.getByText(/Progresso da Conciliação/i)).toBeVisible();
  });
});
