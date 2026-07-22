// OFX/OFC (SGML) parser
import type { ContaOFX, ResultadoImportacao, TransacaoOFX } from './types';
import { parseOFXDate } from './utils';

function extrairContaOFX(content: string, avisos: string[]): ContaOFX {
  const conta: ContaOFX = {
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'checking',
    moeda: 'BRL',
  };

  const bankIdMatch = content.match(/<BANKID>([^<\n]+)/);
  if (bankIdMatch) conta.banco = bankIdMatch[1].trim();

  const branchIdMatch = content.match(/<BRANCHID>([^<\n]+)/);
  if (branchIdMatch) conta.agencia = branchIdMatch[1].trim();

  const acctIdMatch = content.match(/<ACCTID>([^<\n]+)/);
  if (acctIdMatch) conta.conta = acctIdMatch[1].trim();

  const acctTypeMatch = content.match(/<ACCTTYPE>([^<\n]+)/);
  if (acctTypeMatch) conta.tipoConta = acctTypeMatch[1].trim().toLowerCase();

  const currMatch = content.match(/<CURDEF>([^<\n]+)/);
  if (currMatch) conta.moeda = currMatch[1].trim();

  if (!conta.banco && !conta.conta) {
    avisos.push('Informações da conta não encontradas no arquivo');
  }

  return conta;
}

function extrairTransacoesOFX(content: string, avisos: string[]): TransacaoOFX[] {
  const transacoes: TransacaoOFX[] = [];

  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>|<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  const matches = content.matchAll(stmtTrnRegex);

  for (const match of matches) {
    const trnContent = match[1] || match[2] || '';

    try {
      const trnTypeMatch = trnContent.match(/<TRNTYPE>([^<\n]+)/);
      const trnType = trnTypeMatch ? trnTypeMatch[1].trim().toUpperCase() : '';

      const dtPostedMatch = trnContent.match(/<DTPOSTED>([^<\n]+)/);
      if (!dtPostedMatch) continue;
      const data = parseOFXDate(dtPostedMatch[1].trim());

      const trnAmtMatch = trnContent.match(/<TRNAMT>([^<\n]+)/);
      if (!trnAmtMatch) continue;
      const valor = parseFloat(trnAmtMatch[1].replace(',', '.'));

      const tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';

      const fitIdMatch = trnContent.match(/<FITID>([^<\n]+)/);
      const numeroReferencia = fitIdMatch ? fitIdMatch[1].trim() : undefined;

      const checkNumMatch = trnContent.match(/<CHECKNUM>([^<\n]+)/);
      const checkNum = checkNumMatch ? checkNumMatch[1].trim() : undefined;

      const nameMatch = trnContent.match(/<NAME>([^<\n]+)/);
      const memoMatch = trnContent.match(/<MEMO>([^<\n]+)/);

      const descricao = nameMatch
        ? nameMatch[1].trim()
        : memoMatch
          ? memoMatch[1].trim()
          : `Transação ${trnType}`;

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

export function parseOFX(content: string, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];

  try {
    const cleanContent = content
      .replace(/<\?.*\?>/g, '')
      .replace(/<!--.*-->/g, '')
      .trim();

    const conta = extrairContaOFX(cleanContent, avisos);
    const transacoes = extrairTransacoesOFX(cleanContent, avisos);

    if (transacoes.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma transação encontrada no arquivo OFX',
        avisos,
      };
    }

    const datas = transacoes.map((t) => t.data).sort((a, b) => a.getTime() - b.getTime());
    conta.dataInicio = datas[0];
    conta.dataFim = datas[datas.length - 1];

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

export function parseOFC(content: string, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];

  try {
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
