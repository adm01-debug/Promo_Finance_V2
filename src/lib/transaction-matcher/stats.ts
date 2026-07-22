import type { TransacaoOFX } from '../ofx-parser';
import type { EstatisticasMatch, MatchSugestao } from './types';

export function calcularEstatisticasMatch(
  transacoes: TransacaoOFX[],
  matches: Map<string, MatchSugestao[]>,
): EstatisticasMatch {
  let confiancaAlta = 0;
  let confiancaMedia = 0;
  let confiancaBaixa = 0;
  let valorTotalMatcheado = 0;

  for (const transacao of transacoes) {
    const sugestoes = matches.get(transacao.id);
    if (sugestoes && sugestoes.length > 0) {
      const melhor = sugestoes[0];
      if (melhor.confianca === 'alta') {
        confiancaAlta++;
        valorTotalMatcheado += Math.abs(transacao.valor);
      } else if (melhor.confianca === 'media') {
        confiancaMedia++;
        valorTotalMatcheado += Math.abs(transacao.valor);
      } else {
        confiancaBaixa++;
      }
    }
  }

  return {
    totalTransacoes: transacoes.length,
    comSugestao: confiancaAlta + confiancaMedia + confiancaBaixa,
    confiancaAlta,
    confiancaMedia,
    confiancaBaixa,
    semMatch: transacoes.length - (confiancaAlta + confiancaMedia + confiancaBaixa),
    valorTotalMatcheado,
  };
}
