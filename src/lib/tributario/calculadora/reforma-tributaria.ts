// REFORMA TRIBUTÁRIA — CBS/IBS transição 2026-2033

import type { InputReforma, ResultadoRegime, LinhaMemoria, TributoDetalhe } from './types';

interface FaseTransicao {
  cbs: number;      // decimal
  ibs: number;      // decimal
  pisResidual: number;    // fração das alíquotas antigas
  cofinsResidual: number;
  icmsResidual: number;
  issResidual: number;
}

const CBS_ALVO = 0.088;
const IBS_ALVO = 0.177;

// Cronograma progressivo — LC 214/2025
const CRONOGRAMA: Record<number, FaseTransicao> = {
  2026: { cbs: 0.009, ibs: 0.001, pisResidual: 1, cofinsResidual: 1, icmsResidual: 1, issResidual: 1 },
  2027: { cbs: CBS_ALVO, ibs: 0.001, pisResidual: 0, cofinsResidual: 0, icmsResidual: 1, issResidual: 1 },
  2028: { cbs: CBS_ALVO, ibs: 0.001, pisResidual: 0, cofinsResidual: 0, icmsResidual: 1, issResidual: 1 },
  2029: { cbs: CBS_ALVO, ibs: IBS_ALVO * 0.10, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0.90, issResidual: 0.90 },
  2030: { cbs: CBS_ALVO, ibs: IBS_ALVO * 0.20, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0.80, issResidual: 0.80 },
  2031: { cbs: CBS_ALVO, ibs: IBS_ALVO * 0.30, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0.70, issResidual: 0.70 },
  2032: { cbs: CBS_ALVO, ibs: IBS_ALVO * 0.40, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0.60, issResidual: 0.60 },
  2033: { cbs: CBS_ALVO, ibs: IBS_ALVO, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0, issResidual: 0 },
};

const IS_ALIQUOTAS: Record<NonNullable<InputReforma['categoriaImpostoSeletivo']>, number> = {
  nenhum: 0,
  bebidas_alcoolicas: 0.10,
  fumo: 0.25,
  veiculos: 0.05,
  bens_luxo: 0.10,
};

function push(mem: LinhaMemoria[], linha: Omit<LinhaMemoria, 'ordem'>) {
  mem.push({ ordem: mem.length + 1, ...linha });
}

export function calcularReformaTributaria(input: InputReforma): ResultadoRegime {
  const memoria: LinhaMemoria[] = [];
  const alertas: string[] = [];
  const ano = input.anoReferencia;
  const fase = CRONOGRAMA[ano] ?? CRONOGRAMA[ano >= 2033 ? 2033 : 2026];
  const reducao = input.regimeEspecialReducao ?? 0;

  const receita = input.receitas.receitaBrutaAnual;
  const creditos = input.creditos ?? 0;

  const cbsAliq = (input.aliquotaCbsAlvo ?? fase.cbs) * (1 - reducao);
  const ibsAliq = (input.aliquotaIbsAlvo ?? fase.ibs) * (1 - reducao);

  const cbsDebito = receita * cbsAliq;
  const ibsDebito = receita * ibsAliq;
  const cbsCredito = creditos * cbsAliq;
  const ibsCredito = creditos * ibsAliq;
  const cbs = Math.max(0, cbsDebito - cbsCredito);
  const ibs = Math.max(0, ibsDebito - ibsCredito);

  push(memoria, { grupo: 'CBS', descricao: `CBS ${(cbsAliq * 100).toFixed(3)}%`, base: receita, aliquota: cbsAliq, valor: cbsDebito });
  if (creditos > 0) push(memoria, { grupo: 'CBS', descricao: '(−) Créditos CBS', valor: -cbsCredito });
  push(memoria, { grupo: 'IBS', descricao: `IBS ${(ibsAliq * 100).toFixed(3)}%`, base: receita, aliquota: ibsAliq, valor: ibsDebito });
  if (creditos > 0) push(memoria, { grupo: 'IBS', descricao: '(−) Créditos IBS', valor: -ibsCredito });

  // Tributos residuais em transição (mantidos até saírem)
  const pisAntigo = receita * 0.0165 * fase.pisResidual;
  const cofinsAntigo = receita * 0.076 * fase.cofinsResidual;
  const icmsResidual = receita * 0.18 * fase.icmsResidual * (1 - input.receitas.percentualServicos / 100);
  const issResidual = receita * 0.05 * fase.issResidual * (input.receitas.percentualServicos / 100);

  if (fase.pisResidual > 0) push(memoria, { grupo: 'PIS', descricao: `PIS residual (${(fase.pisResidual * 100).toFixed(0)}%)`, valor: pisAntigo });
  if (fase.cofinsResidual > 0) push(memoria, { grupo: 'COFINS', descricao: `COFINS residual`, valor: cofinsAntigo });
  if (fase.icmsResidual > 0) push(memoria, { grupo: 'ICMS', descricao: `ICMS residual (${(fase.icmsResidual * 100).toFixed(0)}%)`, valor: icmsResidual });
  if (fase.issResidual > 0) push(memoria, { grupo: 'ISS', descricao: `ISS residual`, valor: issResidual });

  const cat = input.categoriaImpostoSeletivo ?? 'nenhum';
  const isAliq = IS_ALIQUOTAS[cat];
  const impostoSeletivo = receita * isAliq;
  if (impostoSeletivo > 0) {
    push(memoria, { grupo: 'IS', descricao: `Imposto Seletivo (${cat})`, base: receita, aliquota: isAliq, valor: impostoSeletivo });
  }

  const tributos: TributoDetalhe[] = [
    { nome: 'CBS', valor: cbs, base: receita, aliquotaEfetiva: cbsAliq, formula: `${(cbsAliq * 100).toFixed(3)}% receita − créditos` },
    { nome: 'IBS', valor: ibs, base: receita, aliquotaEfetiva: ibsAliq, formula: `${(ibsAliq * 100).toFixed(3)}% receita − créditos` },
    { nome: 'PIS residual', valor: pisAntigo, base: receita, aliquotaEfetiva: 0.0165 * fase.pisResidual, formula: 'transição' },
    { nome: 'COFINS residual', valor: cofinsAntigo, base: receita, aliquotaEfetiva: 0.076 * fase.cofinsResidual, formula: 'transição' },
    { nome: 'ICMS residual', valor: icmsResidual, base: receita, aliquotaEfetiva: 0.18 * fase.icmsResidual, formula: 'transição' },
    { nome: 'ISS residual', valor: issResidual, base: receita, aliquotaEfetiva: 0.05 * fase.issResidual, formula: 'transição' },
    { nome: 'Imposto Seletivo', valor: impostoSeletivo, base: receita, aliquotaEfetiva: isAliq, formula: `${(isAliq * 100).toFixed(1)}% (bens específicos)` },
  ];
  const totalTributos = tributos.reduce((s, t) => s + t.valor, 0);

  if (ano === 2026) alertas.push('Ano teste — CBS/IBS creditáveis, sem impacto arrecadatório real.');
  if (ano >= 2033) alertas.push('Regime definitivo: CBS+IBS substituíram PIS/COFINS/ICMS/ISS.');

  return {
    regime: 'reforma', nome: `Reforma Tributária (${ano})`, elegivel: true,
    tributos, retencoesCompensadas: 0,
    totalTributos, totalAPagar: totalTributos,
    receitaBase: receita,
    cargaEfetiva: receita > 0 ? (totalTributos / receita) * 100 : 0,
    memoria, alertas,
  };
}
