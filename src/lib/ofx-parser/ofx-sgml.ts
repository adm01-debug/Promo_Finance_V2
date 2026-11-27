// OFX/OFC (SGML) parser
import type { ContaOFX, ResultadoImportacao, TransacaoOFX } from './types';
import { parseOFXDate } from './utils';

function contaDoConteudo(content: string): ContaOFX {
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

  return conta;
}

/** Identidade da conta (banco/agência/número) ou `null` sem o número dela. */
export function identidadeConta(conta: ContaOFX): string | null {
  if (!conta.conta?.trim()) return null;
  return [conta.banco, conta.agencia, conta.conta]
    .map((valor) => valor?.trim())
    .filter(Boolean)
    .join('/');
}

function extrairContaOFX(content: string, avisos: string[]): ContaOFX {
  const conta = contaDoConteudo(content);

  if (!conta.banco && !conta.conta) {
    avisos.push('Informações da conta não encontradas no arquivo');
  }

  return conta;
}

const ABERTURA_LISTA = /<BANKTRANLIST\s*>/gi;
const FECHAMENTO_LISTA = /<\/BANKTRANLIST\s*>/gi;
// Extrato de conta corrente (`BANKACCTFROM`/`STMTRS`) e de cartão
// (`CCACCTFROM`/`CCSTMTRS`) declaram a conta emissora no mesmo lugar.
const MARCADOR_CONTA =
  /<BANKACCTFROM\s*>|<CCACCTFROM\s*>|<STMTTRNRS\s*>|<STMTRS\s*>|<CCSTMTRS\s*>/gi;
// Uma transação pode declarar a conta de destino de uma transferência
// (`BANKACCTTO`), que não é a conta emissora do extrato.
const BLOCO_TRANSACAO =
  /<STMTTRN\s*>[\s\S]*?(?:<\/STMTTRN\s*>|(?=<STMTTRN\s*>)|(?=<\/BANKTRANLIST\s*>)|(?=<BANKACCTFROM\s*>|<CCACCTFROM\s*>|<STMTTRNRS\s*>|<STMTRS\s*>|<CCSTMTRS\s*>)|$)/gi;

/** Troca o corpo de cada transação por espaços, preservando as posições. */
function mascararTransacoes(content: string): string {
  return content.replace(BLOCO_TRANSACAO, (trecho) => ' '.repeat(trecho.length));
}

/**
 * A conta que emitiu um bloco está declarada entre o marcador do próprio bloco
 * (`<BANKACCTFROM>`/`<CCACCTFROM>`/`<STMTTRNRS>`/`<STMTRS>`/`<CCSTMTRS>`) e a
 * abertura da lista dele. Sem marcador dentro desse intervalo a conta é
 * desconhecida: nunca se aproveita um campo de banco de um bloco anterior.
 */
function contaDoBloco(mascarado: string, inicioLista: number, limite: number): ContaOFX {
  let ultimo = -1;
  for (const marcador of mascarado.matchAll(MARCADOR_CONTA)) {
    const posicao = marcador.index ?? 0;
    if (posicao >= limite && posicao < inicioLista) ultimo = posicao;
  }
  if (ultimo === -1) return contaDoConteudo('');

  return contaDoConteudo(mascarado.slice(ultimo, inicioLista));
}

/**
 * Um extrato OFX pode trazer vários blocos de extrato (uma conta por bloco).
 * Cada bloco é um `<BANKTRANLIST>` com as suas transações, e a conta que o emitiu
 * é a do próprio bloco. As tags são tolerantes a espaço (`</BANKTRANLIST >`).
 */
function segmentosPorExtrato(content: string): Array<{ conta: ContaOFX; transacoes: string }> {
  const aberturas: Array<{ inicio: number; fim: number }> = [];
  for (const marcador of content.matchAll(ABERTURA_LISTA)) {
    const inicio = marcador.index ?? 0;
    aberturas.push({ inicio, fim: inicio + marcador[0].length });
  }
  const mascarado = mascararTransacoes(content);
  if (aberturas.length === 0) {
    return [{ conta: contaDoConteudo(mascarado), transacoes: content }];
  }

  const fechamentos: Array<{ inicio: number; fim: number }> = [];
  for (const marcador of content.matchAll(FECHAMENTO_LISTA)) {
    const inicio = marcador.index ?? 0;
    fechamentos.push({ inicio, fim: inicio + marcador[0].length });
  }

  let limite = 0;
  return aberturas.map((abertura, indice) => {
    const proxima = aberturas[indice + 1]?.inicio ?? content.length;
    const fechamento = fechamentos.find(
      (item) => item.inicio >= abertura.fim && item.inicio < proxima
    );
    const fim = fechamento?.inicio ?? proxima;
    const segmento = {
      conta: contaDoBloco(mascarado, abertura.inicio, limite),
      transacoes: content.slice(abertura.inicio, fim),
    };
    // Sem fechamento a lista termina na próxima abertura, mas o cabeçalho da
    // conta seguinte vem antes dela — por isso o limite é a abertura anterior,
    // e não o fim do bloco.
    limite = abertura.fim;
    return segmento;
  });
}

function extrairTransacoesDoBloco(
  content: string,
  avisos: string[],
  deslocamento: number
): TransacaoOFX[] {
  const transacoes: TransacaoOFX[] = [];

  const stmtTrnRegex =
    /<STMTTRN>([\s\S]*?)<\/STMTTRN>|<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
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
        id: `ofx-${numeroReferencia || Date.now()}-${deslocamento + transacoes.length}`,
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

  return transacoes;
}

function extrairTransacoesOFX(content: string, avisos: string[]): TransacaoOFX[] {
  const transacoes: TransacaoOFX[] = [];

  for (const segmento of segmentosPorExtrato(content)) {
    const origemConta = identidadeConta(segmento.conta);
    const aviso = 'Transações sem número de conta de origem: a origem não pôde ser identificada';
    if (!origemConta && !avisos.includes(aviso)) avisos.push(aviso);

    transacoes.push(
      ...extrairTransacoesDoBloco(segmento.transacoes, avisos, transacoes.length).map(
        (transacao) => (origemConta ? { ...transacao, origemConta } : transacao)
      )
    );
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

    const origens = new Set(
      transacoes.map((t) => t.origemConta).filter((origem): origem is string => Boolean(origem))
    );
    if (origens.size > 1) {
      avisos.push(
        'O arquivo contém mais de uma conta: cada crédito fica vinculado à conta de origem que o emitiu'
      );
    }

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
