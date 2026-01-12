// ============================================
// OFX/OFC BANK STATEMENT PARSER
// ============================================

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
  formato: 'OFX' | 'OFC' | 'CSV';
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
    let cleanContent = content
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
export function parseCSV(content: string, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];
  
  try {
    const lines = content.trim().split('\n');
    
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
    
    // Find column indexes
    const dataIdx = headers.findIndex(h => 
      h.includes('data') || h.includes('date') || h.includes('dt')
    );
    const descricaoIdx = headers.findIndex(h => 
      h.includes('descri') || h.includes('historic') || h.includes('memo') || h.includes('description')
    );
    const valorIdx = headers.findIndex(h => 
      h.includes('valor') || h.includes('value') || h.includes('amount')
    );
    const tipoIdx = headers.findIndex(h => 
      h.includes('tipo') || h.includes('type') || h.includes('dc') || h.includes('d/c')
    );

    if (dataIdx === -1 || valorIdx === -1) {
      avisos.push('Colunas de data ou valor não identificadas claramente');
    }

    const transacoes: TransacaoOFX[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = parseCSVLine(line, delimiter);
      
      try {
        const dataStr = cols[dataIdx] || cols[0];
        const data = parseData(dataStr);
        
        let valor = parseFloat((cols[valorIdx] || cols[1] || '0')
          .replace(/[^\d,.-]/g, '')
          .replace(',', '.'));
        
        // Determine if credit or debit
        let tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';
        
        if (tipoIdx !== -1) {
          const tipoStr = (cols[tipoIdx] || '').toLowerCase();
          if (tipoStr.includes('d') || tipoStr.includes('deb')) {
            tipo = 'debito';
            if (valor > 0) valor = -valor;
          } else if (tipoStr.includes('c') || tipoStr.includes('cred')) {
            tipo = 'credito';
            if (valor < 0) valor = Math.abs(valor);
          }
        }
        
        const descricao = cols[descricaoIdx] || cols[2] || 'Transação sem descrição';
        
        transacoes.push({
          id: `csv-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao: descricao.replace(/"/g, '').trim(),
        });
      } catch (_error: unknown) {
        avisos.push(`Linha ${i + 1} ignorada: formato inválido`);
      }
    }

    if (transacoes.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma transação válida encontrada no arquivo CSV',
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
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const hour = dateStr.length > 8 ? parseInt(dateStr.substring(8, 10)) : 0;
  const min = dateStr.length > 10 ? parseInt(dateStr.substring(10, 12)) : 0;
  const sec = dateStr.length > 12 ? parseInt(dateStr.substring(12, 14)) : 0;
  
  return new Date(year, month, day, hour, min, sec);
}

function parseData(dateStr: string): Date {
  // Try common date formats
  const cleaned = dateStr.replace(/"/g, '').trim();
  
  // DD/MM/YYYY or DD-MM-YYYY
  let match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  
  // YYYY-MM-DD or YYYY/MM/DD
  match = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  
  // Try native parsing
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
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
export function parseExtratoBancario(content: string, fileName: string): ResultadoImportacao {
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
      return parseCSV(content, fileName);
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
