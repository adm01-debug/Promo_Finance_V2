// Excel (XLSX) bank statement parser
import * as XLSX from 'xlsx';
import type { ResultadoImportacao, TransacaoOFX } from './types';
import { parseData } from './utils';

export function parseExcel(content: ArrayBuffer, fileName: string): ResultadoImportacao {
  const avisos: string[] = [];
  try {
    const workbook = XLSX.read(content, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

    if (rows.length < 2) {
      return { sucesso: false, erro: 'Arquivo Excel vazio ou com poucas linhas', avisos };
    }

    const headers = rows[0].map((h) => String(h || '').toLowerCase());
    const findIdx = (keywords: string[]) =>
      headers.findIndex((h) => keywords.some((k) => h.includes(k)));

    const dataIdx = findIdx(['data', 'vencimento', 'date', 'dt']);
    const descIdx = findIdx(['descri', 'historic', 'memo', 'detalhe']);
    const valorIdx = findIdx(['valor', 'value', 'amount', 'total']);

    if (dataIdx === -1 || valorIdx === -1) {
      return {
        sucesso: false,
        erro: 'Não foi possível identificar as colunas de Data ou Valor no Excel.',
        avisos,
      };
    }

    const transacoes: TransacaoOFX[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[dataIdx] || row[valorIdx] === undefined) continue;

      try {
        const data =
          row[dataIdx] instanceof Date ? (row[dataIdx] as Date) : parseData(String(row[dataIdx]));
        const valor =
          typeof row[valorIdx] === 'number'
            ? (row[valorIdx] as number)
            : parseFloat(String(row[valorIdx]).replace(/[^\d,.-]/g, '').replace(',', '.'));

        const tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';
        const descricao = String(row[descIdx] || 'Transação Excel');

        transacoes.push({
          id: `excel-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao,
        });
      } catch {
        avisos.push(`Linha ${i + 1} ignorada devido a erro de formato.`);
      }
    }

    if (transacoes.length === 0) {
      return { sucesso: false, erro: 'Nenhuma transação válida encontrada no Excel', avisos };
    }

    const datas = transacoes.map((t) => t.data).sort((a, b) => a.getTime() - b.getTime());

    return {
      sucesso: true,
      extrato: {
        conta: {
          banco: 'Excel Import',
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
        formato: 'CSV', // Reusing CSV enum or we could extend it
      },
      avisos,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: 'Erro ao processar Excel: ' + (error instanceof Error ? error.message : 'Desconhecido'),
      avisos,
    };
  }
}
