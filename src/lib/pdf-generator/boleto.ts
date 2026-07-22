import { formatCurrency, formatDate } from '../formatters';
import { generateBarcodeHTML, getBancoCode, openPrintWindow, writeAndPrint } from './utils';

export interface BoletoData {
  numero: string;
  linha_digitavel: string;
  codigo_barras: string;
  valor: number;
  vencimento: string;
  cedente_nome: string;
  cedente_cnpj: string | null;
  sacado_nome: string;
  sacado_cpf_cnpj: string | null;
  banco: string;
  agencia: string;
  conta: string;
  descricao?: string | null;
}

export function generateBoletoPDF(boleto: BoletoData): void {
  const w = openPrintWindow();
  if (!w) return;

  const barcodeHtml = generateBarcodeHTML(boleto.codigo_barras);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Boleto ${boleto.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; color: #000; background: #fff; }
        .boleto-container { border: 2px solid #000; max-width: 800px; margin: 0 auto; }
        .header { display: flex; border-bottom: 2px solid #000; }
        .banco-logo { width: 120px; padding: 10px; border-right: 2px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
        .banco-codigo { width: 80px; padding: 10px; border-right: 2px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
        .linha-digitavel { flex: 1; padding: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; letter-spacing: 1px; }
        .info-row { display: flex; border-bottom: 1px solid #000; }
        .info-cell { padding: 5px 8px; border-right: 1px solid #000; }
        .info-cell:last-child { border-right: none; }
        .info-cell label { display: block; font-size: 9px; color: #666; margin-bottom: 2px; }
        .info-cell span { font-size: 11px; font-weight: bold; }
        .cell-25 { width: 25%; } .cell-33 { width: 33.33%; } .cell-50 { width: 50%; } .cell-100 { width: 100%; }
        .valor-destaque { font-size: 16px !important; color: #000; }
        .barcode-container { padding: 20px; text-align: center; border-top: 2px solid #000; }
        .barcode { display: flex; justify-content: center; align-items: flex-end; height: 50px; margin-bottom: 5px; }
        .barcode-text { font-size: 10px; letter-spacing: 2px; }
        .canhoto { border-bottom: 2px dashed #000; padding: 15px; margin-bottom: 10px; }
        .canhoto-title { font-size: 10px; text-align: center; margin-bottom: 10px; }
        .recibo { display: flex; justify-content: space-between; }
        .recibo-info { font-size: 10px; }
        @media print { body { padding: 0; } @page { margin: 10mm; } }
      </style>
    </head>
    <body>
      <div class="boleto-container">
        <div class="canhoto">
          <div class="canhoto-title">RECIBO DO PAGADOR</div>
          <div class="recibo">
            <div class="recibo-info">
              <strong>Beneficiário:</strong> ${boleto.cedente_nome}<br>
              <strong>Pagador:</strong> ${boleto.sacado_nome}<br>
              <strong>Nosso Número:</strong> ${boleto.numero}
            </div>
            <div class="recibo-info" style="text-align: right;">
              <strong>Vencimento:</strong> ${formatDate(boleto.vencimento)}<br>
              <strong>Valor:</strong> ${formatCurrency(boleto.valor)}<br>
              <strong>Autenticação Mecânica</strong>
            </div>
          </div>
        </div>

        <div class="header">
          <div class="banco-logo">${boleto.banco}</div>
          <div class="banco-codigo">${getBancoCode(boleto.banco)}</div>
          <div class="linha-digitavel">${boleto.linha_digitavel}</div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50"><label>Local de Pagamento</label><span>PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO</span></div>
          <div class="info-cell cell-50"><label>Vencimento</label><span class="valor-destaque">${formatDate(boleto.vencimento)}</span></div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50"><label>Beneficiário</label><span>${boleto.cedente_nome}</span></div>
          <div class="info-cell cell-25"><label>Agência/Código Beneficiário</label><span>${boleto.agencia} / ${boleto.conta}</span></div>
          <div class="info-cell cell-25"><label>Nosso Número</label><span>${boleto.numero}</span></div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-25"><label>Data do Documento</label><span>${formatDate(new Date().toISOString())}</span></div>
          <div class="info-cell cell-25"><label>Número do Documento</label><span>${boleto.numero}</span></div>
          <div class="info-cell cell-25"><label>Espécie Doc.</label><span>DM</span></div>
          <div class="info-cell cell-25"><label>Valor Documento</label><span class="valor-destaque">${formatCurrency(boleto.valor)}</span></div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50"><label>Instruções</label><span>${boleto.descricao || 'Não receber após o vencimento.'}</span></div>
          <div class="info-cell cell-25"><label>(-) Desconto</label><span>-</span></div>
          <div class="info-cell cell-25"><label>(+) Mora/Multa</label><span>-</span></div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50"><label>Pagador</label><span>${boleto.sacado_nome} - ${boleto.sacado_cpf_cnpj || ''}</span></div>
          <div class="info-cell cell-50"><label>(=) Valor Cobrado</label><span class="valor-destaque">${formatCurrency(boleto.valor)}</span></div>
        </div>

        <div class="barcode-container">
          <div class="barcode">${barcodeHtml}</div>
          <div class="barcode-text">${boleto.codigo_barras}</div>
        </div>
      </div>

      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  writeAndPrint(w, html);
}
