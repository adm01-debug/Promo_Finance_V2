// OFX/OFC/CSV BANK STATEMENT PARSER
import * as XLSX from 'xlsx';

export interface TransacaoOFX {
  id: string;
  tipo: 'credito' | 'debito';
  data: Date;
  valor: number;
  descricao: string;
  numeroReferencia?: string;
  tipoTransacao?: string;
  checkNum?: string;
  memo?: string;
}

export interface ContaOFX {
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  moeda: string;
  saldoInicial?: number;
  saldoFinal?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface ExtratoOFX {
  conta: ContaOFX;
  transacoes: TransacaoOFX[];
  dataImportacao: Date;
  nomeArquivo: string;
  formato: 'OFX' | 'OFC' | 'CSV' | 'OPEN_FINANCE';
}

export interface ResultadoImportacao {
  sucesso: boolean;
  extrato?: ExtratoOFX;
  erro?: string;
  avisos: string[];
}

// Parse OFX file content
export function parseOFX(content: string, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];
  
  try {
    // Remove XML header and SGML tags if present
    const cleanContent = content
      .replace(/<\?.*\?>/g, '')
      .replace(/<!--.*-->/g, '')
      .trim();

    // Extract bank account info
    const conta = extrairContaOFX(cleanContent, avisos);
    
    // Extract transactions
    const transacoes = extrairTransacoesOFX(cleanContent, avisos);
    
    if (transacoes.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma transação encontrada no arquivo OFX',
        avisos,
      };
    }

    // Extract date range
    const datas = transacoes.map(t => t.data).sort((a, b) => a.getTime() - b.getTime());
    conta.dataInicio = datas[0];
    conta.dataFim = datas[datas.length - 1];

    // Extract balance info
    const saldoMatch = cleanContent.match(/<BALAMT>([^<\n]+)/);
    if (saldoMatch) {
      conta.saldoFinal = parseFloat(saldoMatch[1].replace(',', '.'));
    }

    return {
      sucesso: true,
      extrato: {
        conta,
        transacoes,
        dataImportacao: new Date(),
        nomeArquivo: fileName,
        formato: 'OFX',
      },
      avisos,
    };
  } catch (error: unknown) {
    return {
      sucesso: false,
      erro: `Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      avisos,
    };
  }
}

// Parse OFC file content (older format)
export function parseOFC(content: string, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];
  
  try {
    // OFC is similar to OFX but with slight differences
    // Convert OFC to OFX-like structure and parse
    const convertedContent = content
      .replace(/<!DOCTYPE OFC SYSTEM>/gi, '')
      .replace(/<OFC>/gi, '<OFX>')
      .replace(/<\/OFC>/gi, '</OFX>');

    const resultado = parseOFX(convertedContent, fileName);
    if (resultado.extrato) {
      resultado.extrato.formato = 'OFC';
    }
    return resultado;
  } catch (error: unknown) {
    return {
      sucesso: false,
      erro: `Erro ao processar arquivo OFC: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      avisos,
    };
  }
}

// Parse CSV bank statement
export function parseCSV(content: string, fileName: string, mapeamento?: Record<string, string>): ResultadoImportacao {
  const avisos: string[] = [];
  
  try {
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length < 2) {
      return {
        sucesso: false,
        erro: 'Arquivo CSV vazio ou com formato inválido',
        avisos,
      };
    }

    // Try to detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    // Parse header
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Find column indexes using mapping or common names
    const getIndex = (key: string, defaults: string[]) => {
      // If user provided a mapping for this internal key, find which CSV column (header) it points to
      if (mapeamento?.[key]) {
        const mappedHeader = mapeamento[key].toLowerCase();
        const idx = headers.indexOf(mappedHeader);
        if (idx !== -1) return idx;
        
        // Try fallback if the mapped header doesn't exist exactly (e.g. "Data Lançamento" vs "Data Lancamento")
        const fallbackIdx = headers.findIndex(h => h.includes(mappedHeader) || mappedHeader.includes(h));
        if (fallbackIdx !== -1) return fallbackIdx;
      }
      return headers.findIndex(h => defaults.some(d => h.includes(d)));
    };

    const dataIdx = getIndex('data', ['data', 'date', 'dt']);
    const descricaoIdx = getIndex('descricao', ['descri', 'historic', 'memo', 'description', 'detalhe']);
    const valorIdx = getIndex('valor', ['valor', 'value', 'amount', 'quantia', 'total']);
    const tipoIdx = getIndex('tipo', ['tipo', 'type', 'dc', 'd/c', 'natureza']);

    if (dataIdx === -1 || valorIdx === -1) {
      avisos.push('Colunas de data ou valor não identificadas claramente. Tentando colunas padrão.');
    }

    const transacoes: TransacaoOFX[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = parseCSVLine(line, delimiter);
      
      try {
        // Data extraction
        const dataStr = dataIdx !== -1 ? cols[dataIdx] : cols[0];
        if (!dataStr) continue;
        const data = parseData(dataStr);
        
        // Value extraction
        const valorRaw = valorIdx !== -1 ? cols[valorIdx] : cols[1];
        if (!valorRaw) continue;
        
        let valor = parseFloat(valorRaw
          .replace(/[^\d,.-]/g, '')
          .replace(',', '.'));
        
        // Determine if credit or debit
        let tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';
        
        if (tipoIdx !== -1 && cols[tipoIdx]) {
          const tipoStr = cols[tipoIdx].toLowerCase();
          // "D" for Debit, "C" for Credit is common in Brazil
          if (tipoStr.startsWith('d') || tipoStr.includes('deb')) {
            tipo = 'debito';
            if (valor > 0) valor = -valor;
          } else if (tipoStr.startsWith('c') || tipoStr.includes('cred')) {
            tipo = 'credito';
            if (valor < 0) valor = Math.abs(valor);
          }
        }
        
        const descricao = (descricaoIdx !== -1 ? cols[descricaoIdx] : cols[2]) || 'Transação sem descrição';
        
        transacoes.push({
          id: `csv-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao: descricao.replace(/"/g, '').trim(),
        });
      } catch (_error: unknown) {
        avisos.push(`Linha ${i + 1} ignorada: erro ao processar dados (${_error instanceof Error ? _error.message : 'formato inválido'})`);
      }
    }

    if (transacoes.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma transação válida encontrada no arquivo CSV. Verifique o mapeamento das colunas.',
        avisos,
      };
    }

    const datas = transacoes.map(t => t.data).sort((a, b) => a.getTime() - b.getTime());

    return {
      sucesso: true,
      extrato: {
        conta: {
          banco: 'Importado via CSV',
          agencia: '',
          conta: '',
          tipoConta: 'checking',
          moeda: 'BRL',
          dataInicio: datas[0],
          dataFim: datas[datas.length - 1],
        },
        transacoes,
        dataImportacao: new Date(),
        nomeArquivo: fileName,
        formato: 'CSV',
      },
      avisos,
    };
  } catch (error: unknown) {
    return {
      sucesso: false,
      erro: `Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      avisos,
    };
  }
}

// Parse Excel bank statement
export function parseExcel(content: ArrayBuffer, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];
  try {
    const workbook = XLSX.read(content, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rows.length < 2) {
      return { sucesso: false, erro: 'Arquivo Excel vazio ou com poucas linhas', avisos };
    }

    // Try to find headers
    const headers = rows[0].map(h => String(h || '').toLowerCase());
    const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const dataIdx = findIdx(['data', 'vencimento', 'date', 'dt']);
    const descIdx = findIdx(['descri', 'historic', 'memo', 'detalhe']);
    const valorIdx = findIdx(['valor', 'value', 'amount', 'total']);

    if (dataIdx === -1 || valorIdx === -1) {
      return { sucesso: false, erro: 'Não foi possível identificar as colunas de Data ou Valor no Excel.', avisos };
    }

    const transacoes: TransacaoOFX[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[dataIdx] || row[valorIdx] === undefined) continue;

      try {
        const data = row[dataIdx] instanceof Date ? row[dataIdx] : parseData(String(row[dataIdx]));
        const valor = typeof row[valorIdx] === 'number' ? row[valorIdx] : parseFloat(String(row[valorIdx]).replace(/[^\d,.-]/g, '').replace(',', '.'));
        
        const tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';
        const descricao = String(row[descIdx] || 'Transação Excel');

        transacoes.push({
          id: `excel-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao,
        });
      } catch (e) {
        avisos.push(`Linha ${i + 1} ignorada devido a erro de formato.`);
      }
    }

    if (transacoes.length === 0) {
      return { sucesso: false, erro: 'Nenhuma transação válida encontrada no Excel', avisos };
    }

    const datas = transacoes.map(t => t.data).sort((a, b) => a.getTime() - b.getTime());

    return {
      sucesso: true,
      extrato: {
        conta: { banco: 'Excel Import', agencia: '', conta: '', tipoConta: 'checking', moeda: 'BRL', dataInicio: datas[0], dataFim: datas[datas.length - 1] },
        transacoes,
        dataImportacao: new Date(),
        nomeArquivo: fileName,
        formato: 'CSV', // Reusing CSV enum or we could extend it
      },
      avisos,
    };
  } catch (error) {
    return { sucesso: false, erro: 'Erro ao processar Excel: ' + (error instanceof Error ? error.message : 'Desconhecido'), avisos };
  }
}

// Helper functions
function extrairContaOFX(content: string, avisos: string[]): ContaOFX {
  const conta: ContaOFX = {
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'checking',
    moeda: 'BRL',
  };

  // Bank ID
  const bankIdMatch = content.match(/<BANKID>([^<\n]+)/);
  if (bankIdMatch) {
    conta.banco = bankIdMatch[1].trim();
  }

  // Branch ID
  const branchIdMatch = content.match(/<BRANCHID>([^<\n]+)/);
  if (branchIdMatch) {
    conta.agencia = branchIdMatch[1].trim();
  }

  // Account ID
  const acctIdMatch = content.match(/<ACCTID>([^<\n]+)/);
  if (acctIdMatch) {
    conta.conta = acctIdMatch[1].trim();
  }

  // Account type
  const acctTypeMatch = content.match(/<ACCTTYPE>([^<\n]+)/);
  if (acctTypeMatch) {
    conta.tipoConta = acctTypeMatch[1].trim().toLowerCase();
  }

  // Currency
  const currMatch = content.match(/<CURDEF>([^<\n]+)/);
  if (currMatch) {
    conta.moeda = currMatch[1].trim();
  }

  if (!conta.banco && !conta.conta) {
    avisos.push('Informações da conta não encontradas no arquivo');
  }

  return conta;
}

function extrairTransacoesOFX(content: string, avisos: string[]): TransacaoOFX[] {
  const transacoes: TransacaoOFX[] = [];
  
  // Find all STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>|<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  const matches = content.matchAll(stmtTrnRegex);
  
  for (const match of matches) {
    const trnContent = match[1] || match[2] || '';
    
    try {
      // Transaction type
      const trnTypeMatch = trnContent.match(/<TRNTYPE>([^<\n]+)/);
      const trnType = trnTypeMatch ? trnTypeMatch[1].trim().toUpperCase() : '';
      
      // Date
      const dtPostedMatch = trnContent.match(/<DTPOSTED>([^<\n]+)/);
      if (!dtPostedMatch) continue;
      const data = parseOFXDate(dtPostedMatch[1].trim());
      
      // Amount
      const trnAmtMatch = trnContent.match(/<TRNAMT>([^<\n]+)/);
      if (!trnAmtMatch) continue;
      const valor = parseFloat(trnAmtMatch[1].replace(',', '.'));
      
      // Determine credit/debit
      const tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';
      
      // Reference number
      const fitIdMatch = trnContent.match(/<FITID>([^<\n]+)/);
      const numeroReferencia = fitIdMatch ? fitIdMatch[1].trim() : undefined;
      
      // Check number
      const checkNumMatch = trnContent.match(/<CHECKNUM>([^<\n]+)/);
      const checkNum = checkNumMatch ? checkNumMatch[1].trim() : undefined;
      
      // Name/Description
      const nameMatch = trnContent.match(/<NAME>([^<\n]+)/);
      const memoMatch = trnContent.match(/<MEMO>([^<\n]+)/);
      
      const descricao = nameMatch ? nameMatch[1].trim() : 
                        memoMatch ? memoMatch[1].trim() : 
                        `Transação ${trnType}`;
      
      const memo = memoMatch ? memoMatch[1].trim() : undefined;
      
      transacoes.push({
        id: `ofx-${numeroReferencia || Date.now()}-${transacoes.length}`,
        tipo,
        data,
        valor,
        descricao,
        numeroReferencia,
        tipoTransacao: trnType,
        checkNum,
        memo,
      });
    } catch (_error: unknown) {
      avisos.push('Uma ou mais transações não puderam ser lidas');
    }
  }
  
  return transacoes.sort((a, b) => b.data.getTime() - a.data.getTime());
}

function parseOFXDate(dateStr: string): Date {
  // OFX date format: YYYYMMDDHHMMSS or YYYYMMDD
  if (!/^\d{8}(\d{6})?/.test(dateStr)) {
    throw new Error(`Data OFX inválida: ${dateStr}`);
  }
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = dateStr.length > 8 ? parseInt(dateStr.substring(8, 10), 10) : 0;
  const min = dateStr.length > 10 ? parseInt(dateStr.substring(10, 12), 10) : 0;
  const sec = dateStr.length > 12 ? parseInt(dateStr.substring(12, 14), 10) : 0;

  const d = new Date(year, month, day, hour, min, sec);
  if (isNaN(d.getTime())) {
    throw new Error(`Data OFX inválida: ${dateStr}`);
  }
  return d;
}

function parseData(dateStr: string): Date {
  const cleaned = dateStr.replace(/"/g, '').trim();

  // DD/MM/YYYY or DD-MM-YYYY (Brazilian format)
  let match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) throw new Error(`Data inválida: ${dateStr}`);
    return d;
  }

  // YYYY-MM-DD or YYYY/MM/DD (ISO-like, local time)
  match = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const d = new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
    );
    if (isNaN(d.getTime())) throw new Error(`Data inválida: ${dateStr}`);
    return d;
  }

  // No native fallback — too ambiguous (US MM/DD/YYYY vs BR DD/MM/YYYY
  // would parse to different days silently). Reject explicitly.
  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Auto-detect file format and parse
export function parseExtratoBancario(content: string, fileName: string, mapeamento?: Record<string, string>): ResultadoImportacao {
  const extension = fileName.toLowerCase().split('.').pop();
  const contentUpper = content.toUpperCase();
  
  // Try to detect format from content
  if (contentUpper.includes('<OFX>') || contentUpper.includes('OFXHEADER')) {
    return parseOFX(content, fileName);
  }
  
  if (contentUpper.includes('<OFC>') || contentUpper.includes('DOCTYPE OFC')) {
    return parseOFC(content, fileName);
  }
  
  // Fallback to extension
  switch (extension) {
    case 'ofx':
      return parseOFX(content, fileName);
    case 'ofc':
      return parseOFC(content, fileName);
    case 'csv':
    case 'txt':
      return parseCSV(content, fileName, mapeamento);
    default:
      // Try to guess - if has commas or semicolons, try CSV
      if (content.includes(',') || content.includes(';')) {
        return parseCSV(content, fileName);
      }
      return {
        sucesso: false,
        erro: `Formato de arquivo não suportado: ${extension}`,
        avisos: [],
      };
  }
}
