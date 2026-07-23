// SIMPLES NACIONAL — reutiliza aliquotas-simples + Fator R

import type { InputSimples, ResultadoRegime, LinhaMemoria, TributoDetalhe } from './types';
import { ANEXO_I, ANEXO_II, ANEXO_III, ANEXO_IV, ANEXO_V, type FaixaSimples } from '../aliquotas-simples';

const LIMITE_ANUAL = 4_800_000;
const SUBLIMITE_PADRAO = 3_600_000;
const FATOR_R_CORTE = 0.28;

const ANEXOS: Record<string, FaixaSimples[]> = {
  I: ANEXO_I, II: ANEXO_II, III: ANEXO_III, IV: ANEXO_IV, V: ANEXO_V,
};

function push(mem: LinhaMemoria[], linha: Omit<LinhaMemoria, 'ordem'>) {
  mem.push({ ordem: mem.length + 1, ...linha });
}

function calcularAliquotaEfetiva(rbt12: number, faixas: FaixaSimples[]): { aliq: number; faixa: FaixaSimples } {
  const faixa = faixas.find((f) => rbt12 >= f.rbt12_de && rbt12 <= f.rbt12_ate) ?? faixas[faixas.length - 1];
  const aliq = rbt12 > 0 ? Math.max(0, (rbt12 * faixa.aliquota - faixa.pd) / rbt12) : faixa.aliquota;
  return { aliq, faixa };
}

export function calcularSimplesNacional(input: InputSimples): ResultadoRegime {
  const memoria: LinhaMemoria[] = [];
  const alertas: string[] = [];
  const receitaBruta = input.receitas.receitaBrutaAnual;

  if (input.rbt12 > LIMITE_ANUAL) {
    return {
      regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false,
      motivoInelegibilidade: `RBT12 > R$ ${LIMITE_ANUAL.toLocaleString('pt-BR')}`,
      tributos: [], retencoesCompensadas: 0, totalTributos: 0, totalAPagar: 0,
      receitaBase: receitaBruta, cargaEfetiva: 0, memoria: [],
      alertas: ['Exclusão obrigatória do Simples.'],
    };
  }

  // Fator R (para anexo III vs V)
  const fatorR = input.rbt12 > 0 ? input.folha12m / input.rbt12 : 0;
  let anexoEfetivo = input.anexo;
  push(memoria, {
    grupo: 'Simples',
    descricao: `Fator R = folha12m / RBT12 = ${fatorR.toFixed(4)}`,
    valor: 0,
    observacao: fatorR >= FATOR_R_CORTE ? '≥ 28% → Anexo III' : '< 28% → Anexo V',
  });
  if (input.anexo === 'V' && fatorR >= FATOR_R_CORTE) {
    anexoEfetivo = 'III';
    alertas.push('Fator R ≥ 28%: enquadrar como Anexo III (mais vantajoso).');
  } else if (input.anexo === 'III' && fatorR < FATOR_R_CORTE) {
    anexoEfetivo = 'V';
    alertas.push('Fator R < 28%: obrigatório Anexo V.');
  }

  const faixas = ANEXOS[anexoEfetivo];
  const { aliq, faixa } = calcularAliquotaEfetiva(input.rbt12, faixas);
  const das = receitaBruta * aliq;
  push(memoria, {
    grupo: 'Simples',
    descricao: `Anexo ${anexoEfetivo}, Faixa ${faixa.faixa}: alíquota nominal ${(faixa.aliquota * 100).toFixed(2)}%, PD R$ ${faixa.pd.toLocaleString('pt-BR')}`,
    valor: 0,
  });
  push(memoria, {
    grupo: 'Simples', descricao: `Alíquota efetiva`, base: receitaBruta, aliquota: aliq, valor: das,
  });

  // Sublimite estadual — acima disso, ICMS/ISS saem do DAS
  const sublimite = input.ufSublimite ?? SUBLIMITE_PADRAO;
  if (input.rbt12 > sublimite) {
    alertas.push(
      `RBT12 (R$ ${input.rbt12.toLocaleString('pt-BR')}) > sublimite (R$ ${sublimite.toLocaleString('pt-BR')}): ICMS/ISS fora do DAS — recolher em separado.`,
    );
  }
  if (input.rbt12 > LIMITE_ANUAL * 0.9) {
    alertas.push('RBT12 próximo do teto de R$ 4,8 mi — planejar transição.');
  }

  const tributos: TributoDetalhe[] = [
    { nome: 'DAS', valor: das, base: receitaBruta, aliquotaEfetiva: aliq, formula: `Anexo ${anexoEfetivo} — [(RBT12 × alíq nominal − PD) / RBT12] × receita` },
  ];

  return {
    regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: true,
    tributos, retencoesCompensadas: 0,
    totalTributos: das, totalAPagar: das,
    receitaBase: receitaBruta,
    cargaEfetiva: receitaBruta > 0 ? (das / receitaBruta) * 100 : 0,
    memoria, alertas,
  };
}
