import { formatCurrency, formatDate } from './formatters';

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
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para gerar o PDF');
    return;
  }

  // Generate barcode SVG
  const barcodeHtml = generateBarcodeHTML(boleto.codigo_barras);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Boleto ${boleto.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace;
          padding: 20px;
          font-size: 12px;
          color: #000;
          background: #fff;
        }
        .boleto-container {
          border: 2px solid #000;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          border-bottom: 2px solid #000;
        }
        .banco-logo {
          width: 120px;
          padding: 10px;
          border-right: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        .banco-codigo {
          width: 80px;
          padding: 10px;
          border-right: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }
        .linha-digitavel {
          flex: 1;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .info-row {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .info-cell {
          padding: 5px 8px;
          border-right: 1px solid #000;
        }
        .info-cell:last-child {
          border-right: none;
        }
        .info-cell label {
          display: block;
          font-size: 9px;
          color: #666;
          margin-bottom: 2px;
        }
        .info-cell span {
          font-size: 11px;
          font-weight: bold;
        }
        .cell-25 { width: 25%; }
        .cell-33 { width: 33.33%; }
        .cell-50 { width: 50%; }
        .cell-100 { width: 100%; }
        .valor-destaque {
          font-size: 16px !important;
          color: #000;
        }
        .barcode-container {
          padding: 20px;
          text-align: center;
          border-top: 2px solid #000;
        }
        .barcode {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          height: 50px;
          margin-bottom: 5px;
        }
        .barcode-text {
          font-size: 10px;
          letter-spacing: 2px;
        }
        .instrucoes {
          padding: 10px;
          border-top: 1px solid #000;
          font-size: 10px;
        }
        .instrucoes h4 {
          font-size: 11px;
          margin-bottom: 5px;
        }
        .canhoto {
          border-bottom: 2px dashed #000;
          padding: 15px;
          margin-bottom: 10px;
        }
        .canhoto-title {
          font-size: 10px;
          text-align: center;
          margin-bottom: 10px;
        }
        .recibo {
          display: flex;
          justify-content: space-between;
        }
        .recibo-info {
          font-size: 10px;
        }
        @media print {
          body { padding: 0; }
          @page { margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="boleto-container">
        <!-- Canhoto -->
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

        <!-- Header -->
        <div class="header">
          <div class="banco-logo">${boleto.banco}</div>
          <div class="banco-codigo">${getBancoCode(boleto.banco)}</div>
          <div class="linha-digitavel">${boleto.linha_digitavel}</div>
        </div>

        <!-- Info Rows -->
        <div class="info-row">
          <div class="info-cell cell-50">
            <label>Local de Pagamento</label>
            <span>PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO</span>
          </div>
          <div class="info-cell cell-50">
            <label>Vencimento</label>
            <span class="valor-destaque">${formatDate(boleto.vencimento)}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50">
            <label>Beneficiário</label>
            <span>${boleto.cedente_nome}</span>
          </div>
          <div class="info-cell cell-25">
            <label>Agência/Código Beneficiário</label>
            <span>${boleto.agencia} / ${boleto.conta}</span>
          </div>
          <div class="info-cell cell-25">
            <label>Nosso Número</label>
            <span>${boleto.numero}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-25">
            <label>Data do Documento</label>
            <span>${formatDate(new Date().toISOString())}</span>
          </div>
          <div class="info-cell cell-25">
            <label>Número do Documento</label>
            <span>${boleto.numero}</span>
          </div>
          <div class="info-cell cell-25">
            <label>Espécie Doc.</label>
            <span>DM</span>
          </div>
          <div class="info-cell cell-25">
            <label>Valor Documento</label>
            <span class="valor-destaque">${formatCurrency(boleto.valor)}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50">
            <label>Instruções</label>
            <span>${boleto.descricao || 'Não receber após o vencimento.'}</span>
          </div>
          <div class="info-cell cell-25">
            <label>(-) Desconto</label>
            <span>-</span>
          </div>
          <div class="info-cell cell-25">
            <label>(+) Mora/Multa</label>
            <span>-</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-cell cell-50">
            <label>Pagador</label>
            <span>${boleto.sacado_nome} - ${boleto.sacado_cpf_cnpj || ''}</span>
          </div>
          <div class="info-cell cell-50">
            <label>(=) Valor Cobrado</label>
            <span class="valor-destaque">${formatCurrency(boleto.valor)}</span>
          </div>
        </div>

        <!-- Barcode -->
        <div class="barcode-container">
          <div class="barcode">
            ${barcodeHtml}
          </div>
          <div class="barcode-text">${boleto.codigo_barras}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function generateBarcodeHTML(code: string): string {
  const bars = code.split('').map((char, i) => {
    const width = parseInt(char) % 2 === 0 ? 2 : 1;
    const isBlack = i % 2 === 0;
    return `<div style="width: ${width}px; height: 100%; background: ${isBlack ? '#000' : '#fff'};"></div>`;
  });
  return bars.join('');
}

function getBancoCode(banco: string): string {
  const codes: Record<string, string> = {
    'Itaú': '341-7',
    'Bradesco': '237-2',
    'Banco do Brasil': '001-9',
    'Caixa': '104-0',
    'Santander': '033-7',
  };
  return codes[banco] || '000-0';
}

export function generateFluxoCaixaPDF(
  dados: Array<{ data: string; receitas: number; despesas: number; saldo: number }>,
  titulo: string = 'Fluxo de Caixa'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para gerar o PDF');
    return;
  }

  const totalReceitas = dados.reduce((sum, d) => sum + d.receitas, 0);
  const totalDespesas = dados.reduce((sum, d) => sum + d.despesas, 0);
  const saldoFinal = dados.length > 0 ? dados[dados.length - 1].saldo : 0;

  const rows = dados.map(d => `
    <tr>
      <td>${formatDate(d.data)}</td>
      <td class="valor positivo">${formatCurrency(d.receitas)}</td>
      <td class="valor negativo">${formatCurrency(d.despesas)}</td>
      <td class="valor ${d.receitas - d.despesas >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.receitas - d.despesas)}</td>
      <td class="valor ${d.saldo >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.saldo)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 20px;
          color: #111;
        }
        h1 { font-size: 24px; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        .summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .summary-card {
          padding: 15px;
          border-radius: 8px;
          flex: 1;
        }
        .summary-card.receitas { background: #dcfce7; }
        .summary-card.despesas { background: #fee2e2; }
        .summary-card.saldo { background: #dbeafe; }
        .summary-card label { font-size: 12px; color: #666; }
        .summary-card .value { font-size: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .valor { text-align: right; font-family: monospace; }
        .positivo { color: #16a34a; }
        .negativo { color: #dc2626; }
        @media print {
          body { padding: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p class="subtitle">Gerado em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      
      <div class="summary">
        <div class="summary-card receitas">
          <label>Total Receitas</label>
          <div class="value positivo">${formatCurrency(totalReceitas)}</div>
        </div>
        <div class="summary-card despesas">
          <label>Total Despesas</label>
          <div class="value negativo">${formatCurrency(totalDespesas)}</div>
        </div>
        <div class="summary-card saldo">
          <label>Saldo Final</label>
          <div class="value ${saldoFinal >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(saldoFinal)}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th class="valor">Receitas</th>
            <th class="valor">Despesas</th>
            <th class="valor">Líquido</th>
            <th class="valor">Saldo Acumulado</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function generateFluxoCaixaCSV(
  dados: Array<{ data: string; receitas: number; despesas: number; saldo: number }>
): void {
  const BOM = '\uFEFF';
  const headers = ['Data', 'Receitas', 'Despesas', 'Líquido', 'Saldo Acumulado'];
  const rows = dados.map(d => [
    d.data,
    d.receitas.toString().replace('.', ','),
    d.despesas.toString().replace('.', ','),
    (d.receitas - d.despesas).toString().replace('.', ','),
    d.saldo.toString().replace('.', ','),
  ]);

  const csvContent = BOM + 
    headers.map(h => `"${h}"`).join(';') + '\n' +
    rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fluxo_caixa_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function generateConciliacaoAuditPDF(
  dados: Array<{ 
    evento: string; 
    valor: number; 
    responsavel: string; 
    data: string; 
    regra: string; 
    classificacao?: string;
    evidencia_url?: string;
  }>,
  filtros: { user?: string; conta?: string; inicio?: string; fim?: string; classificacao?: string }
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para gerar o PDF');
    return;
  }

  const rows = dados.map(d => `
    <tr>
      <td>
        <div class="font-bold">${d.evento}</div>
        <div class="text-[10px] text-gray-500">${d.classificacao || ''}</div>
      </td>
      <td class="valor ${d.valor >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.valor)}</td>
      <td>${d.responsavel}</td>
      <td>${formatDate(d.data)}</td>
      <td class="text-xs">${d.regra}</td>
      <td class="text-center">
        ${d.evidencia_url ? '<span class="text-blue-600">Sim</span>' : '<span class="text-gray-400">Não</span>'}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Auditoria de Conciliação</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .filters { font-size: 12px; color: #666; margin-bottom: 20px; display: grid; grid-template-cols: 1fr 1fr; gap: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 11px; }
        th { background: #f8f9fa; font-weight: bold; text-transform: uppercase; }
        .valor { text-align: right; font-weight: bold; }
        .positivo { color: #2e7d32; }
        .negativo { color: #d32f2f; }
        @media print { @page { margin: 1.5cm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Auditoria de Conciliação</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <div class="filters">
        <div><strong>Período:</strong> ${filtros.inicio || 'Início'} até ${filtros.fim || 'Fim'}</div>
        <div><strong>Conta:</strong> ${filtros.conta || 'Todas'}</div>
        <div><strong>Usuário:</strong> ${filtros.user || 'Todos'}</div>
        <div><strong>Classificação:</strong> ${filtros.classificacao || 'Todas'}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Evento / Lançamento</th>
            <th class="valor">Valor Ajuste</th>
            <th>Responsável</th>
            <th>Data/Hora</th>
            <th>Regra Aplicada</th>
            <th class="text-center">Evidência</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function generateBenchmarkingPDF(
  concorrente: string,
  gaps: Array<{ feature: string; status: string; prioridade: string; impacto: string; esforço: string }>,
  roadmap: Array<{ quarter: string; item: string; descricao: string }>
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para gerar o PDF');
    return;
  }

  const gapRows = gaps.map(g => `
    <tr>
      <td>${g.feature}</td>
      <td><span class="badge ${g.status === 'ok' ? 'bg-green' : g.status === 'gap' ? 'bg-red' : 'bg-yellow'}">${g.status.toUpperCase()}</span></td>
      <td>${g.prioridade}</td>
      <td>${g.impacto}</td>
      <td>${g.esforço}</td>
    </tr>
  `).join('');

  const roadmapRows = roadmap.map(r => `
    <tr>
      <td><strong>${r.quarter}</strong></td>
      <td>${r.item}</td>
      <td>${r.descricao}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Benchmarking - ${concorrente}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
        h1 { font-size: 28px; color: #111827; margin-bottom: 5px; }
        .subtitle { color: #6b7280; margin-bottom: 30px; font-size: 14px; }
        h2 { font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .badge { padding: 2px 8px; border-radius: 4px; color: white; font-size: 10px; font-weight: bold; }
        .bg-green { background: #10b981; }
        .bg-red { background: #ef4444; }
        .bg-yellow { background: #f59e0b; }
        .section { margin-bottom: 40px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Análise Competitiva: ${concorrente}</h1>
        <p class="subtitle">Relatório gerado automaticamente pelo motor de inteligência estratégica em ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="section">
        <h2>Matriz de Gaps e Oportunidades</h2>
        <table>
          <thead>
            <tr>
              <th>Funcionalidade / Fluxo</th>
              <th>Status Atual</th>
              <th>Prioridade</th>
              <th>Impacto</th>
              <th>Esforço</th>
            </tr>
          </thead>
          <tbody>
            ${gapRows}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Roadmap Estratégico de Melhorias</h2>
        <table>
          <thead>
            <tr>
              <th>Timeline</th>
              <th>Melhoria</th>
              <th>Descrição Estratégica</th>
            </tr>
          </thead>
          <tbody>
            ${roadmapRows}
          </tbody>
        </table>
      </div>
      
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
