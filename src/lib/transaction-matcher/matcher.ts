import type { TransacaoOFX } from '../ofx-parser';
import { formatCurrency } from '../formatters';
import {
  calcularSimilaridadeData,
  calcularSimilaridadeTexto,
  calcularSimilaridadeValor,
} from './similarity';
import {
  DEFAULT_CONFIG,
  type ConfiguracaoMatch,
  type LancamentoSistema,
  type MatchMotivo,
  type MatchSugestao,
} from './types';

export function encontrarMatchesParaTransacao(
  transacao: TransacaoOFX,
  lancamentos: LancamentoSistema[],
  config: ConfiguracaoMatch = DEFAULT_CONFIG,
): MatchSugestao[] {
  const sugestoes: MatchSugestao[] = [];

  const tipoEsperado = transacao.tipo === 'credito' ? 'receber' : 'pagar';
  const lancamentosFiltrados = lancamentos.filter(
    (l) => l.tipo === tipoEsperado && l.status !== 'pago' && l.status !== 'cancelado',
  );

  for (const lancamento of lancamentosFiltrados) {
    const motivos: MatchMotivo[] = [];
    let scoreTotal = 0;
    let pesoTotal = 0;

    const valorTransacao = Math.abs(transacao.valor);
    const similaridadeValor = calcularSimilaridadeValor(
      valorTransacao,
      lancamento.valor,
      config.toleranciaValor,
    );

    if (similaridadeValor.tipo === 'exato') {
      motivos.push({
        tipo: 'valor_exato',
        descricao: 'Valor exato encontrado',
        peso: config.pesoValorExato,
      });
      scoreTotal += config.pesoValorExato;
      pesoTotal += config.pesoValorExato;
    } else if (similaridadeValor.tipo === 'proximo') {
      const peso = config.pesoValorProximo * similaridadeValor.score;
      motivos.push({
        tipo: 'valor_proximo',
        descricao: `Valor próximo (${((1 - similaridadeValor.score) * 100).toFixed(1)}% diferença)`,
        peso,
      });
      scoreTotal += peso;
      pesoTotal += config.pesoValorProximo;
    } else {
      motivos.push({
        tipo: 'valor_proximo',
        descricao: `Divergência de valor (${formatCurrency(Math.abs(valorTransacao - lancamento.valor))} de diferença)`,
        peso: -20,
      });
    }

    const textoTransacao = `${transacao.descricao} ${transacao.memo || ''}`;
    const textoLancamento = `${lancamento.descricao} ${lancamento.entidade} ${lancamento.entidadeNome || ''}`;
    const similaridadeTexto = calcularSimilaridadeTexto(textoTransacao, textoLancamento);

    if (similaridadeTexto.tipo === 'exato') {
      motivos.push({
        tipo: 'nome_exato',
        descricao: 'Nome/descrição exato',
        peso: config.pesoNomeExato,
      });
      scoreTotal += config.pesoNomeExato;
      pesoTotal += config.pesoNomeExato;
    } else if (similaridadeTexto.tipo === 'parcial' && similaridadeTexto.score > 0.2) {
      const peso = config.pesoNomeParcial * similaridadeTexto.score;
      motivos.push({
        tipo: 'nome_parcial',
        descricao: `Nome/descrição similar (${(similaridadeTexto.score * 100).toFixed(0)}%)`,
        peso,
      });
      scoreTotal += peso;
      pesoTotal += config.pesoNomeParcial;
    } else {
      pesoTotal += config.pesoNomeExato;
    }

    const similaridadeData = calcularSimilaridadeData(
      transacao.data,
      lancamento.dataVencimento,
      config.toleranciaDias,
    );

    if (similaridadeData > 0) {
      const peso = config.pesoDataProxima * similaridadeData;
      motivos.push({
        tipo: 'data_proxima',
        descricao: `Data próxima ao vencimento (${Math.floor(Math.abs(transacao.data.getTime() - lancamento.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))} dias)`,
        peso,
      });
      scoreTotal += peso;
      pesoTotal += config.pesoDataProxima;
    }

    if (transacao.numeroReferencia && lancamento.numeroDocumento) {
      if (
        transacao.numeroReferencia.includes(lancamento.numeroDocumento) ||
        lancamento.numeroDocumento.includes(transacao.numeroReferencia)
      ) {
        motivos.push({
          tipo: 'documento',
          descricao: 'Número de documento correspondente',
          peso: config.pesoDocumento,
        });
        scoreTotal += config.pesoDocumento;
        pesoTotal += config.pesoDocumento;
      }
    }

    if (
      lancamento.entidade &&
      lancamento.entidade.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
    ) {
      const cnpj = lancamento.entidade.replace(/\D/g, '');
      if (cnpj && transacao.descricao.replace(/\D/g, '').includes(cnpj)) {
        motivos.push({
          tipo: 'documento',
          descricao: 'CNPJ identificado na transação',
          peso: config.pesoCnpj,
        });
        scoreTotal += config.pesoCnpj;
        pesoTotal += config.pesoCnpj;
      }
    }

    let scoreFinal = pesoTotal > 0 ? Math.max(0, (scoreTotal / pesoTotal) * 100) : 0;

    const matchesNomeExato = motivos.some((m) => m.tipo === 'nome_exato');
    if (matchesNomeExato && scoreFinal < config.scoreMinimo) {
      scoreFinal = config.scoreMinimo;
    }

    if (scoreFinal >= config.scoreMinimo) {
      const diffValor = Math.abs(valorTransacao - lancamento.valor);

      sugestoes.push({
        transacaoId: transacao.id,
        lancamentoId: lancamento.id,
        lancamentoTipo: lancamento.tipo,
        score: Math.round(scoreFinal),
        motivos,
        lancamento,
        confianca:
          diffValor > lancamento.valor * 0.1
            ? 'baixa'
            : scoreFinal >= 80
              ? 'alta'
              : scoreFinal >= 60
                ? 'media'
                : 'baixa',
        divergenciaValor: diffValor > 0.01 ? diffValor : undefined,
      });
    }
  }

  return sugestoes.sort((a, b) => b.score - a.score);
}

export function encontrarTodosMatches(
  transacoes: TransacaoOFX[],
  lancamentos: LancamentoSistema[],
  config: ConfiguracaoMatch = DEFAULT_CONFIG,
): Map<string, MatchSugestao[]> {
  const resultado = new Map<string, MatchSugestao[]>();
  const lancamentosUsados = new Set<string>();

  const transacoesOrdenadas = [...transacoes].sort(
    (a, b) => Math.abs(b.valor) - Math.abs(a.valor),
  );

  for (const transacao of transacoesOrdenadas) {
    const lancamentosDisponiveis = lancamentos.filter((l) => !lancamentosUsados.has(l.id));
    const matches = encontrarMatchesParaTransacao(transacao, lancamentosDisponiveis, config);

    if (matches.length > 0) {
      resultado.set(transacao.id, matches);
      if (matches[0].score >= 80) {
        lancamentosUsados.add(matches[0].lancamentoId);
      }
    }
  }

  return resultado;
}
