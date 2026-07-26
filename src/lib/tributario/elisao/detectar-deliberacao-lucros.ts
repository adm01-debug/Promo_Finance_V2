// DELIBERAÇÃO ANTECIPADA DE LUCROS
// Lei 15.270/2025 art. 3º §3º II — janela de aprovação encerrada em 31/12/2025

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { DATA_LIMITE_DELIBERACAO_LUCROS, ALIQUOTA_IRRF_DIVIDENDOS } from './types';

/**
 * Avalia a deliberação antecipada de lucros como blindagem contra a tributação
 * de dividendos instituída pela Lei 15.270/2025.
 *
 * A lei preserva a isenção sobre lucros **apurados até 2025 e cuja distribuição
 * tenha sido deliberada até 31/12/2025**. Depois dessa data a janela está fechada:
 * a estratégia deixa de ser acionável e passa a ser apenas um item de conferência
 * documental (existe ata? o saldo está segregado?).
 *
 * @param ctx Contexto da empresa. Usa `lucros_acumulados_ate_2025` e
 *            `deliberacao_lucros_registrada` quando informados.
 * @param referencia Data de avaliação (injetável para testes determinísticos).
 */
export function detectarDeliberacaoLucros(
  ctx: ContextoEmpresa,
  referencia: Date = new Date(),
): OportunidadeDetectada {
  const janelaAberta = referencia.getTime() <= DATA_LIMITE_DELIBERACAO_LUCROS.getTime();
  const saldo = Math.max(0, ctx.lucros_acumulados_ate_2025 ?? 0);
  const jaDeliberado = ctx.deliberacao_lucros_registrada === true;

  // Só é uma oportunidade acionável se a janela ainda estiver aberta,
  // houver saldo de lucros e a ata ainda não tiver sido registrada.
  const aplicavel = janelaAberta && saldo > 0 && !jaDeliberado;

  // Economia = IRRF que deixaria de incidir sobre a distribuição futura.
  const economiaEstimada = aplicavel ? saldo * ALIQUOTA_IRRF_DIVIDENDOS : 0;

  const justificativa = (() => {
    if (aplicavel) {
      return `Há R$ ${saldo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} de lucros apurados até 2025 sem deliberação registrada. Aprovar a distribuição em ata antes de 31/12/2025 preserva a isenção sobre esse saldo.`;
    }
    if (!janelaAberta) {
      return 'A janela de deliberação encerrou em 31/12/2025 (Lei 15.270/2025 art. 3º §3º II). Resta apenas comprovar as atas já registradas para sustentar a isenção do saldo antigo.';
    }
    if (jaDeliberado) {
      return 'A deliberação já consta registrada — a isenção do saldo apurado até 2025 está preservada. Nenhuma ação adicional necessária.';
    }
    return 'Não há saldo de lucros acumulados até 2025 informado para deliberar.';
  })();

  return {
    estrategia: 'DELIBERACAO_LUCROS',
    nome: 'Deliberação antecipada de lucros',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.9,
    economia_max: economiaEstimada,
    base_legal: 'Lei 15.270/2025 art. 3º §3º II; Lei 6.404/76 art. 132',
    risco: 'baixo',
    justificativa,
    proximos_passos: janelaAberta
      ? [
          'Levantar o saldo de lucros acumulados apurados até 31/12/2025',
          'Aprovar a distribuição em ata de assembleia/reunião de sócios',
          'Registrar a ata na Junta Comercial',
          'Segregar o saldo deliberado na conta de lucros a distribuir',
        ]
      : [
          'Localizar as atas de deliberação registradas até 31/12/2025',
          'Conferir a segregação contábil do saldo isento',
          'Arquivar a documentação para eventual fiscalização',
        ],
    observacoes: janelaAberta
      ? undefined
      : 'Janela encerrada em 31/12/2025 — item mantido apenas para conferência documental.',
  };
}
