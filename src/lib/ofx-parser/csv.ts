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
      // A deteccao NAO pode ser so "tem uma coluna a mais": virgula sobrando no
      // fim da linha tambem produz coluna extra, e ai a coluna seguinte ao valor
      // e dado legitimo (ex.: `parcela`). Nesse caso a recomposicao somava a
      // parcela ao valor -- 1.234 + 2 virava 1.234,2 (achado dos revisores na
      // PR #413). Entao, nesta ordem:
      //   1) coluna vazia no FIM (vinda de delimitador final) nao conta;
      //   2) o valor nao pode ja ter virgula -- se tem, os centavos estao la;
      //   3) a vizinha tem de ser 1 ou 2 digitos;
      //   4) o valor recomposto tem de ser aceito pelo parser, senao fica como
      //      estava.
      // Coluna a mais que o cabecalho tem origem AMBIGUA e nao ha regra que a
      // resolva. O valor BRL sem aspas parte em duas celulas
      // (`1.234,56` -> ['1.234','56']), mas exatamente a mesma forma aparece
      // quando sobra delimitador no fim, quando a ultima coluna declarada esta
      // vazia, ou quando a VIRGULA esta na descricao
      // (`...,1234,2,Pagamento,loja`). Tentei recompor automaticamente em duas
      // rodadas desta PR e as duas corromperam caso legitimo -- parcela somada
      // ao valor e colunas deslocadas.
      //
      // Entao nao se adivinha: a leitura continua a mesma de antes (nenhum
      // numero e inventado) e o que muda e o SILENCIO. O achado F01 era
      // "perde os centavos silenciosamente"; agora a linha avisa, com dica
      // especifica quando a forma sugere centavos partidos.
      if (cols.length !== headers.length) {
        const valorCelula = valorIdx !== -1 ? (cols[valorIdx] ?? '') : '';
        const vizinha = valorIdx !== -1 ? (cols[valorIdx + 1] ?? '') : '';
        const pareceCentavosPartidos =
          delimiter === ',' && !valorCelula.includes(',') && /^\d{1,2}$/.test(vizinha);
        avisos.push(
          pareceCentavosPartidos
            ? `Linha ${i + 1}: ${cols.length} colunas para ${headers.length} do cabeçalho. O valor foi lido como "${valorCelula}" e pode ter perdido centavos (um valor como "${valorCelula},${vizinha}" sem aspas vira duas colunas) — exporte com aspas ou use ponto e vírgula.`
            : `Linha ${i + 1}: ${cols.length} colunas para ${headers.length} do cabeçalho — confira o mapeamento; alguma coluna pode conter o separador.`
        );
      }

      try {
        const dataStr = dataIdx !== -1 ? cols[dataIdx] : cols[0];
        if (!dataStr) continue;
        const data = parseData(dataStr);

        const valorRaw = valorIdx !== -1 ? cols[valorIdx] : cols[1];
        if (!valorRaw) continue;

        let valor = parseValorMonetario(valorRaw);

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
