// DEPRECIAÇÃO ACELERADA INCENTIVADA — Lei 11.774/2008 art. 1º
// Antecipação da dedução de máquinas e equipamentos novos (empresas industriais)

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { ALIQUOTA_IRPJ_CSLL_COMBINADA, CUSTO_OPORTUNIDADE_ANUAL } from './types';

/** Prefixos CNAE das divisões industriais (indústria de transformação: 10 a 33). */
function isCnaeIndustrial(cnae?: string): boolean {
  if (!cnae) return false;
  const divisao = Number(cnae.replace(/\D/g, '').slice(0, 2));
  return Number.isFinite(divisao) && divisao >= 10 && divisao <= 33;
}

/**
 * Detecta o benefício da depreciação acelerada incentivada para máquinas,
 * equipamentos, aparelhos e instrumentos novos adquiridos por empresa industrial
 * tributada pelo Lucro Real (Lei 11.774/2008).
 *
 * O benefício não reduz o imposto total ao longo da vida do bem — ele **antecipa**
 * a dedução. Por isso a economia é modelada como ganho financeiro de antecipação
 * (valor do dinheiro no tempo), não como o valor cheio de 34% do investimento.
 */
export function detectarDepreciacaoAcelerada(ctx: ContextoEmpresa): OportunidadeDetectada {
  const industrial =
    isCnaeIndustrial(ctx.cnae) || (ctx.percentual_industria ?? 0) >= 50;
  const investimento = Math.max(0, ctx.investimento_maquinas_anual ?? 0);
  const lucrativa = (ctx.lucro_liquido ?? 0) > 0;

  const aplicavel =
    ctx.regime_atual === 'real' && industrial && investimento > 0 && lucrativa;

  // Dedução antecipada em relação ao regime normal (10 anos, 10% a.a.):
  // no 1º ano deduz-se 100% em vez de 10% → 90% do investimento antecipado.
  const baseAntecipada = investimento * 0.9;
  const beneficioFiscalAntecipado = baseAntecipada * ALIQUOTA_IRPJ_CSLL_COMBINADA;

  // Ganho real = custo de oportunidade do caixa antecipado, aproximado sobre
  // o prazo médio de antecipação (metade da vida útil restante ≈ 4,5 anos).
  const economiaEstimada = aplicavel
    ? beneficioFiscalAntecipado * CUSTO_OPORTUNIDADE_ANUAL * 4.5
    : 0;

  const motivoNaoAplicavel = (() => {
    if (ctx.regime_atual !== 'real') return 'Benefício restrito a empresas tributadas pelo Lucro Real.';
    if (!industrial) return 'Benefício restrito a empresas industriais (CNAE de indústria de transformação).';
    if (investimento <= 0) return 'Nenhum investimento em máquinas e equipamentos novos informado no período.';
    return 'Sem lucro tributável no período, a dedução antecipada não gera economia imediata.';
  })();

  return {
    estrategia: 'DEPRECIACAO_ACELERADA',
    nome: 'Depreciação acelerada incentivada (Lei 11.774/08)',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.7,
    economia_max: economiaEstimada * 1.3,
    base_legal: 'Lei 11.774/2008 art. 1º; RIR/2018 art. 324',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Investimento de R$ ${investimento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em máquinas novas permite antecipar R$ ${beneficioFiscalAntecipado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} de dedução IRPJ/CSLL para o próprio exercício.`
      : motivoNaoAplicavel,
    proximos_passos: [
      'Listar máquinas e equipamentos novos adquiridos no exercício com nota fiscal',
      'Confirmar enquadramento do bem no Decreto 4.955/2004 (relação de bens incentivados)',
      'Registrar a depreciação acelerada na Parte A do e-LALUR como exclusão',
      'Controlar o saldo na Parte B para adição futura quando esgotar o custo contábil',
    ],
    observacoes:
      'O benefício antecipa a dedução; não reduz o imposto total do ciclo de vida do bem. A economia estimada representa o ganho financeiro da antecipação.',
  };
}
