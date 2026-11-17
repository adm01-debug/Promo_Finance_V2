// CSV bank statement parser
import type { ResultadoImportacao, TransacaoOFX } from './types';
import { parseCSVLine, parseData, parseValorMonetario } from './utils';

export function parseCSV(
  content: string,
  fileName: string,
  mapeamento?: Record<string, string>
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

    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

    const getIndex = (key: string, defaults: string[]) => {
      if (mapeamento?.[key]) {
        const mappedHeader = mapeamento[key].toLowerCase();
        const idx = headers.indexOf(mappedHeader);
        if (idx !== -1) return idx;

        const fallbackIdx = headers.findIndex(
          (h) => h.includes(mappedHeader) || mappedHeader.includes(h)
        );
        if (fallbackIdx !== -1) return fallbackIdx;
      }
      return headers.findIndex((h) => defaults.some((d) => h.includes(d)));
    };

    const dataIdx = getIndex('data', ['data', 'date', 'dt']);
    const descricaoIdx = getIndex('descricao', [
      'descri',
      'historic',
      'memo',
      'description',
      'detalhe',
    ]);
    const valorIdx = getIndex('valor', ['valor', 'value', 'amount', 'quantia', 'total']);
    const tipoIdx = getIndex('tipo', ['tipo', 'type', 'dc', 'd/c', 'natureza']);

    if (dataIdx === -1 || valorIdx === -1) {
      avisos.push(
        'Colunas de data ou valor não identificadas claramente. Tentando colunas padrão.'
      );
    }

    const transacoes: TransacaoOFX[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line, delimiter);

      // Delimitador virgula + valor BRL SEM aspas (1.234,56) chega aqui partido
      // em duas colunas: ['1.234', '56']. O valor lido virava 1234 -- mil vezes
      // menor -- e sem nenhum aviso, porque '1.234' e milhar BRL valido para o
      // parser. Era a ressalva que manteve o achado F01 como PARCIAL.
      //
      // A recomposicao e deliberadamente estreita: so quando a linha tem
      // EXATAMENTE uma coluna a mais que o cabecalho e a vizinha do valor tem
      // 1 ou 2 digitos. Uma planilha com coluna extra declarada (valor,parcela)
      // tem o mesmo numero de colunas do cabecalho e nao entra aqui.
      let colunas = cols;
      const vizinha = valorIdx !== -1 ? (cols[valorIdx + 1] ?? '') : '';
      if (
        delimiter === ',' &&
        valorIdx !== -1 &&
        cols.length === headers.length + 1 &&
        /^\d{1,2}$/.test(vizinha)
      ) {
        colunas = [
          ...cols.slice(0, valorIdx),
          `${cols[valorIdx]},${vizinha}`,
          ...cols.slice(valorIdx + 2),
        ];
        avisos.push(
          `Linha ${i + 1}: valor "${cols[valorIdx]},${vizinha}" estava sem aspas num CSV separado por vírgula; os centavos foram recompostos. Exporte com aspas ou use ponto e vírgula.`
        );
      } else if (cols.length !== headers.length) {
        // Nao descarta a linha (CSV com coluna sobrando funciona hoje), mas a
        // leitura pode estar deslocada e isso deixa de ser silencioso.
        avisos.push(
          `Linha ${i + 1}: ${cols.length} colunas para ${headers.length} do cabeçalho — confira o mapeamento.`
        );
      }

      try {
        const dataStr = dataIdx !== -1 ? colunas[dataIdx] : colunas[0];
        if (!dataStr) continue;
        const data = parseData(dataStr);

        const valorRaw = valorIdx !== -1 ? colunas[valorIdx] : colunas[1];
        if (!valorRaw) continue;

        let valor = parseValorMonetario(valorRaw);

        let tipo: 'credito' | 'debito' = valor >= 0 ? 'credito' : 'debito';

        if (tipoIdx !== -1 && colunas[tipoIdx]) {
          const tipoStr = colunas[tipoIdx].toLowerCase();
          if (tipoStr.startsWith('d') || tipoStr.includes('deb')) {
            tipo = 'debito';
            if (valor > 0) valor = -valor;
          } else if (tipoStr.startsWith('c') || tipoStr.includes('cred')) {
            tipo = 'credito';
            if (valor < 0) valor = Math.abs(valor);
          }
        }

        const descricao =
          (descricaoIdx !== -1 ? colunas[descricaoIdx] : colunas[2]) || 'Transação sem descrição';

        transacoes.push({
          id: `csv-${i}-${Date.now()}`,
          tipo,
          data,
          valor,
          descricao: descricao.replace(/"/g, '').trim(),
        });
      } catch (_error: unknown) {
        avisos.push(
          `Linha ${i + 1} ignorada: erro ao processar dados (${_error instanceof Error ? _error.message : 'formato inválido'})`
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
