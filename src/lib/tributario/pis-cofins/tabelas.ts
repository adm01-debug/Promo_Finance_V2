/**
 * Catálogo de naturezas de crédito de PIS/COFINS no regime não cumulativo.
 *
 * Fonte: Lei 10.637/2002, art. 3º; Lei 10.833/2003, art. 3º;
 * IN RFB 2.121/2022, arts. 175 a 218; STJ REsp 1.221.170 (Tema 779).
 */

import type { NaturezaCredito, NaturezaReceita, RegraCredito } from './types';

export const REGRAS_CREDITO: Readonly<Record<NaturezaCredito, RegraCredito>> = Object.freeze({
  bens_revenda: {
    natureza: 'bens_revenda',
    descricao: 'Bens adquiridos para revenda',
    fundamento: 'Lei 10.833/2003, art. 3º, I',
    permiteCredito: true,
    observacao: 'Vedado quando a entrada for monofásica ou sujeita a alíquota zero.',
  },
  insumos: {
    natureza: 'insumos',
    descricao: 'Bens e serviços utilizados como insumo',
    fundamento: 'Lei 10.833/2003, art. 3º, II; STJ REsp 1.221.170',
    permiteCredito: true,
    observacao: 'Critério de essencialidade e relevância ao processo produtivo.',
  },
  energia_eletrica: {
    natureza: 'energia_eletrica',
    descricao: 'Energia elétrica consumida no estabelecimento',
    fundamento: 'Lei 10.833/2003, art. 3º, III',
    permiteCredito: true,
  },
  energia_termica: {
    natureza: 'energia_termica',
    descricao: 'Energia térmica, inclusive sob a forma de vapor',
    fundamento: 'Lei 10.833/2003, art. 3º, III',
    permiteCredito: true,
  },
  alugueis_pj: {
    natureza: 'alugueis_pj',
    descricao: 'Aluguéis de prédios, máquinas e equipamentos pagos a pessoa jurídica',
    fundamento: 'Lei 10.833/2003, art. 3º, IV',
    permiteCredito: true,
    observacao: 'Aluguel pago a pessoa física não gera crédito.',
  },
  arrendamento_mercantil: {
    natureza: 'arrendamento_mercantil',
    descricao: 'Contraprestação de arrendamento mercantil de PJ',
    fundamento: 'Lei 10.833/2003, art. 3º, V',
    permiteCredito: true,
  },
  depreciacao_maquinas: {
    natureza: 'depreciacao_maquinas',
    descricao: 'Encargos de depreciação de máquinas e equipamentos do ativo imobilizado',
    fundamento: 'Lei 10.833/2003, art. 3º, VI e §14',
    permiteCredito: true,
    observacao: 'Apropriação mensal; opção de 1/48 ou imediata conforme o bem.',
  },
  edificacoes_benfeitorias: {
    natureza: 'edificacoes_benfeitorias',
    descricao: 'Edificações e benfeitorias em imóveis próprios ou de terceiros',
    fundamento: 'Lei 10.833/2003, art. 3º, VII; Lei 11.488/2007, art. 6º',
    permiteCredito: true,
    observacao: 'Apropriação em 24 parcelas mensais.',
  },
  devolucoes_vendas: {
    natureza: 'devolucoes_vendas',
    descricao: 'Bens recebidos em devolução de vendas tributadas',
    fundamento: 'Lei 10.833/2003, art. 3º, VIII',
    permiteCredito: true,
  },
  armazenagem_frete_venda: {
    natureza: 'armazenagem_frete_venda',
    descricao: 'Armazenagem de mercadoria e frete na operação de venda',
    fundamento: 'Lei 10.833/2003, art. 3º, IX',
    permiteCredito: true,
    observacao: 'Somente quando o ônus for suportado pelo vendedor.',
  },
  vale_transporte_alimentacao: {
    natureza: 'vale_transporte_alimentacao',
    descricao: 'Vale-transporte, alimentação e uniforme (limpeza, conservação e manutenção)',
    fundamento: 'Lei 10.833/2003, art. 3º, X',
    permiteCredito: true,
    observacao: 'Restrito a prestadoras de serviço de limpeza, conservação e manutenção.',
  },
  bens_importados: {
    natureza: 'bens_importados',
    descricao: 'Bens e serviços importados com pagamento de PIS/COFINS-Importação',
    fundamento: 'Lei 10.865/2004, art. 15',
    permiteCredito: true,
    observacao: 'O adicional de 1% da COFINS-Importação não gera crédito.',
  },
});

/** Naturezas de receita que não geram débito no regime não cumulativo. */
export const RECEITAS_SEM_DEBITO: readonly NaturezaReceita[] = Object.freeze([
  'monofasica',
  'substituicao_tributaria',
  'aliquota_zero',
  'isenta',
  'suspensa',
  'exportacao',
]);

export const LABEL_RECEITA: Readonly<Record<NaturezaReceita, string>> = Object.freeze({
  tributada: 'Tributada (não cumulativa)',
  monofasica: 'Monofásica (tributação concentrada)',
  substituicao_tributaria: 'Substituição tributária',
  aliquota_zero: 'Alíquota zero',
  isenta: 'Isenta',
  suspensa: 'Suspensa',
  exportacao: 'Exportação (imune)',
});

export function regraDe(natureza: NaturezaCredito): RegraCredito {
  return REGRAS_CREDITO[natureza];
}
