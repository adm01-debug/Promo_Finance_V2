/**
 * Regras de risco da previsao de inadimplencia: pontuacao, nivel, fatores e
 * acao sugerida. Extraido de PrevisaoInadimplencia.tsx na revisao da PR #404
 * (o arquivo bateu no limite de 400 linhas do eslint), e util separado porque
 * sao funcoes puras -- dao teste direto, sem renderizar a tela.
 */
import { differenceInDays } from 'date-fns';

export interface ClienteRiscoEntrada {
  score: number | null;
  limite_credito: number | null;
}

export interface ContaPendenteEntrada {
  valor: number;
  valor_recebido: number | null;
  status: string;
  data_vencimento: string;
}

export interface HistoricoContaEntrada {
  status: string;
  data_vencimento: string | null;
  data_recebimento: string | null;
}

export const SCORE_RISCO_ALTO = 300;
export const SCORE_RISCO_MEDIO = 500;
export const SCORE_RISCO_BAIXO = 700;

/**
 * Titulo em atraso: vencido, aberto depois do vencimento, ou recebido depois do
 * vencimento.
 *
 * O caso "aberto e ja vencido" faltava: o historico filtra
 * `data_vencimento < hoje`, e um titulo ainda `pendente`/`parcial` nessa janela
 * ESTA em atraso -- o proprio produto trata assim em useCobrancas.ts:73
 * (`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.hoje)`).
 * Sem ele a taxa de atraso, a probabilidade e o nivel de risco saiam menores do
 * que a realidade (achado P1 do Codex na PR #404).
 */
export function teveAtraso(c: HistoricoContaEntrada): boolean {
  if (c.status === 'cancelado') return false;
  if (c.status === 'vencido') return true;
  if (c.data_recebimento && c.data_vencimento) {
    return c.data_recebimento > c.data_vencimento;
  }
  // sem recebimento: aberto apos o vencimento (o historico ja filtra por isso)
  if (!c.data_recebimento && (c.status === 'pendente' || c.status === 'parcial')) {
    return true;
  }
  return false;
}

export function calcularProbabilidadeAtraso(
  cliente: ClienteRiscoEntrada,
  contasPendentes: ContaPendenteEntrada[],
  historicoContas: HistoricoContaEntrada[]
): number {
  let score = 0;
  // `null` e desconhecido, nao bom: nao pontua, e `gerarFatoresRisco` avisa que
  // o score nao foi calculado. Zero e valor real e cai na pior faixa.
  const scoreCliente = cliente.score;
  if (scoreCliente != null) {
    if (scoreCliente < SCORE_RISCO_ALTO) score += 30;
    else if (scoreCliente < SCORE_RISCO_MEDIO) score += 20;
    else if (scoreCliente < SCORE_RISCO_BAIXO) score += 10;
  }

  const contasVencidas = historicoContas.filter(teveAtraso);
  const taxaAtraso =
    historicoContas.length > 0 ? (contasVencidas.length / historicoContas.length) * 100 : 0;
  if (taxaAtraso > 30) score += 40;
  else if (taxaAtraso > 15) score += 25;
  else if (taxaAtraso > 5) score += 10;

  const totalPendente = contasPendentes.reduce(
    (sum, c) => sum + c.valor - (c.valor_recebido || 0),
    0
  );
  // `|| 10000` apagava o zero: cliente criado com o default do formulario
  // (ClienteForm.tsx:96,152 grava `limite_credito: 0`) era tratado como tendo
  // R$ 10.000 de credito, e R$ 5.000 pendentes viravam "50% de utilizacao" em
  // vez de limite excedido (achado P1 do Codex na PR #404).
  const limiteCredito = cliente.limite_credito ?? null;
  if (limiteCredito === 0) {
    // Sem credito autorizado, qualquer pendencia excede o limite.
    if (totalPendente > 0) score += 20;
  } else if (limiteCredito != null && limiteCredito > 0) {
    const utilizacao = (totalPendente / limiteCredito) * 100;
    if (utilizacao > 100) score += 20;
    else if (utilizacao > 80) score += 15;
    else if (utilizacao > 50) score += 5;
  }

  const proximoVencimento = contasPendentes
    .map((c) => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (proximoVencimento) {
    const diasAteVencimento = differenceInDays(proximoVencimento, new Date());
    if (diasAteVencimento <= 3) score += 10;
    else if (diasAteVencimento <= 7) score += 5;
  }

  return Math.min(score, 100);
}

export function determinarNivelRisco(probabilidade: number): 'alto' | 'medio' | 'baixo' {
  if (probabilidade >= 60) return 'alto';
  if (probabilidade >= 30) return 'medio';
  return 'baixo';
}

export function gerarFatoresRisco(
  cliente: ClienteRiscoEntrada,
  contasPendentes: ContaPendenteEntrada[],
  historicoContas: HistoricoContaEntrada[]
): string[] {
  const fatores: string[] = [];
  if (cliente.score == null) {
    fatores.push('Score não calculado para este cliente');
  } else if (cliente.score < SCORE_RISCO_BAIXO) {
    fatores.push(`Score baixo (${cliente.score} de 1000)`);
  }
  const contasVencidas = historicoContas.filter(teveAtraso);
  if (contasVencidas.length > 0) {
    fatores.push(`${contasVencidas.length} atraso(s) no histórico`);
  }
  const totalPendente = contasPendentes.reduce(
    (sum, c) => sum + c.valor - (c.valor_recebido || 0),
    0
  );
  const limite = cliente.limite_credito ?? null;
  if (limite === 0 && totalPendente > 0) {
    fatores.push('Sem limite de crédito autorizado');
  } else if (limite != null && limite > 0 && totalPendente > limite) {
    fatores.push('Limite de crédito excedido');
  }
  const proximoVencimento = contasPendentes
    .map((c) => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  if (proximoVencimento && differenceInDays(proximoVencimento, new Date()) <= 7) {
    fatores.push('Vencimento próximo');
  }
  // Sem fallback aqui: quem chama ainda acrescenta setor e cadastro, e aplicar
  // "nenhum fator" antes disso punha as duas coisas no mesmo cartao -- "Nenhum
  // fator de risco identificado" ao lado de "Setor de alto risco" (achado P2 do
  // Codex na PR #404). O fallback entra em `comFallback()`, no fim.
  return fatores;
}

export function gerarAcaoSugerida(
  nivelRisco: 'alto' | 'medio' | 'baixo',
  fatores: string[]
): string {
  if (nivelRisco === 'alto') {
    if (fatores.some((f) => f.includes('atraso'))) {
      return 'Entrar em contato imediatamente para negociação preventiva';
    }
    return 'Monitorar de perto e preparar régua de cobrança preventiva';
  }
  if (nivelRisco === 'medio') {
    return 'Enviar lembrete amigável antes do vencimento';
  }
  return 'Manter acompanhamento padrão';
}
