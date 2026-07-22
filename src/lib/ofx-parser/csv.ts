// CSV bank statement parser
import type { ResultadoImportacao, TransacaoOFX } from './types';
import { parseCSVLine, parseData } from './utils';

export function parseCSV(
  content: string,
  fileName: string,
  mapeamento?: Record<string, string>,
): ResultadoImportacao {
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

    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine
      .split(delimiter)
      .map((h) => h.trim().toLowerCase().replace(/"/g, ''));

    const getIndex = (key: string, defaults: string[]) => {
      if (mapeamento?.[key]) {
        const mappedHeader = mapeamento[key].toLowerCase();
        const idx = headers.indexOf(mappedHeader);
        if (idx !== -1) return idx;

        const fallbackIdx = headers.findIndex(
          (h) => h.includes(mappedHeader) || mappedHeader.includes(h),
        );
        if (fallbackIdx !== -1) return fallbackIdx;
      }
      return headers.findIndex((h) => defaults.some((d) => h.includes(d)));
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
        const dataStr = dataIdx !== -1 ? cols[dataIdx] : cols[0];
        if (!dataStr) continue;
        const data = parseData(dataStr);

        const valorRaw = valorIdx !== -1 ? cols[valorIdx] : cols[1];
        if (!valorRaw) continue;

        let valor = parseFloat(valorRaw.replace(/[^\d,.-]/g, '').replace(',', '.'));

        let tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';

        if (tipoIdx !== -1 && cols[tipoIdx]) {
          const tipoStr = cols[tipoIdx].toLowerCase();
          if (tipoStr.startsWith('d') || tipoStr.includes('deb')) {
            tipo = 'debito';
            if (valor > 0) valor = -valor;
          } else if (tipoStr.startsWith('c') || tipoStr.includes('cred')) {
            tipo = 'credito';
            if (valor < 0) valor = Math.abs(valor);
          }
        }

        const descricao =
          (descricaoIdx !== -1 ? cols[descricaoIdx] : cols[2]) || 'Transação sem descrição';

        transacoes.push({
          id: `csv-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao: descricao.replace(/"/g, '').trim(),
        });
      } catch (_error: unknown) {
        avisos.push(
          `Linha ${i + 1} ignorada: erro ao processar dados (${_error instanceof Error ? _error.message : 'formato inválido'})`,
        );
      }
    }

    if (transacoes.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma transação válida encontrada no arquivo CSV. Verifique o mapeamento das colunas.',
        avisos,
      };
    }

    const datas = transacoes.map((t) => t.data).sort((a, b) => a.getTime() - b.getTime());

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
