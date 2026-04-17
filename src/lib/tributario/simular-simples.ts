// ============================================
// SIMULADOR — Simples Nacional
// DAS efetivo = ((RBT12 × aliq nominal) − PD) / RBT12
// ============================================

import type { ParametrosSimulacao, ResultadoCenario, AnexoSimples } from './types';
import { calcularRBT12 } from './rbt12';
import { calcularFatorR, calcularFolha12m, determinarAnexoPorFatorR } from './fator-r';
import { identificarFaixa, LIMITE_SIMPLES_NACIONAL, obterAnexo } from './aliquotas-simples';

export interface OpcoesSimples {
  anoReferencia: number;
  mesReferencia: number;
  forcarAnexo?: AnexoSimples;
}

/**
 * Simula carga tributária no Simples Nacional.
 */
export function simularSimples(
  params: ParametrosSimulacao,
  opcoes: OpcoesSimples,
): ResultadoCenario {
  const observacoes: string[] = [];
  const { faturamentoAnual, percentualServicos } = params;

  // Elegibilidade básica: limite de R$ 4,8 mi
  if (faturamentoAnual > LIMITE_SIMPLES_NACIONAL) {
    return {
      regime: 'simples_nacional',
      nome: 'Simples Nacional',
      elegivel: false,
      motivoInelegibilidade: `Faturamento acima do limite (R$ 4,8 mi). Atual: R$ ${faturamentoAnual.toLocaleString('pt-BR')}.`,
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0,
      icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0,
      observacoes: ['Empresa não pode optar pelo Simples Nacional acima do limite legal.'],
    };
  }

  // RBT12: usa histórico real se disponível, senão estima como faturamento anual
  let rbt12 = faturamentoAnual;
  if (params.faturamentoMensal && params.faturamentoMensal.length > 0) {
    rbt12 = calcularRBT12(params.faturamentoMensal, opcoes.anoReferencia, opcoes.mesReferencia);
    if (rbt12 === 0) {
      rbt12 = faturamentoAnual;
      observacoes.push('RBT12 estimado a partir do faturamento anual (sem histórico mensal).');
    }
  } else {
    observacoes.push('RBT12 estimado a partir do faturamento anual (cadastre histórico mensal para precisão).');
  }

  // Folha 12m e Fator R
  let folha12m = params.folhaAnual || 0;
  if (params.folhaMensal && params.folhaMensal.length > 0) {
    folha12m = calcularFolha12m(params.folhaMensal, opcoes.anoReferencia, opcoes.mesReferencia);
  }
  const fatorR = calcularFatorR(folha12m, rbt12);

  // Determinar anexo: simplificação — usa percentualServicos como heurística
  // Se >50% serviços → anexo por Fator R; senão Anexo I (comércio)
  let anexo: AnexoSimples = opcoes.forcarAnexo ?? 'I';
  if (!opcoes.forcarAnexo) {
    if (percentualServicos > 50) {
      anexo = determinarAnexoPorFatorR(fatorR);
      observacoes.push(
        `Fator R = ${(fatorR * 100).toFixed(2)}% → Anexo ${anexo} ${
          anexo === 'III' ? '(folha alta, alíquota menor)' : '(folha baixa, alíquota maior)'
        }.`,
      );
    } else {
      observacoes.push('Atividade predominantemente comercial → Anexo I.');
    }
  }

  const faixa = identificarFaixa(rbt12, anexo);
  if (!faixa) {
    return {
      regime: 'simples_nacional',
      nome: 'Simples Nacional',
      elegivel: false,
      motivoInelegibilidade: 'RBT12 fora das faixas tabeladas.',
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0,
      icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0,
      observacoes,
    };
  }

  // Alíquota efetiva = ((RBT12 × aliq) − PD) / RBT12
  const aliquotaEfetiva = ((rbt12 * faixa.aliquota) - faixa.pd) / rbt12;
  const aliquotaFinal = Math.max(0, aliquotaEfetiva);

  // DAS total estimado sobre faturamento anual
  const dasTotal = faturamentoAnual * aliquotaFinal;

  // Distribuição aproximada por tributo (varia por anexo, simplificado)
  const distribuicao = obterDistribuicaoTributos(anexo);
  const irpj = dasTotal * distribuicao.irpj;
  const csll = dasTotal * distribuicao.csll;
  const cofins = dasTotal * distribuicao.cofins;
  const pis = dasTotal * distribuicao.pis;
  const cpp = dasTotal * distribuicao.cpp;
  const icms = dasTotal * distribuicao.icms;
  const iss = dasTotal * distribuicao.iss;

  observacoes.push(
    `Faixa ${faixa.faixa}: alíquota nominal ${(faixa.aliquota * 100).toFixed(2)}%, PD R$ ${faixa.pd.toLocaleString('pt-BR')}.`,
    `Alíquota efetiva calculada: ${(aliquotaFinal * 100).toFixed(2)}%.`,
  );

  return {
    regime: 'simples_nacional',
    nome: 'Simples Nacional',
    elegivel: true,
    irpj, csll, pis, cofins, cpp,
    icms, iss,
    cbs: 0, ibs: 0,
    totalTributos: dasTotal,
    cargaEfetiva: (dasTotal / faturamentoAnual) * 100,
    aliquotaNominal: faixa.aliquota * 100,
    rbt12,
    fatorR: percentualServicos > 50 ? fatorR : undefined,
    anexoAplicavel: anexo,
    faixaAplicavel: faixa.faixa,
    observacoes,
  };
}

/**
 * Distribuição percentual aproximada de cada tributo dentro do DAS,
 * por anexo. Valores médios da tabela de partilha do Simples.
 */
function obterDistribuicaoTributos(anexo: AnexoSimples) {
  const tabelas: Record<AnexoSimples, {
    irpj: number; csll: number; cofins: number; pis: number;
    cpp: number; icms: number; iss: number;
  }> = {
    I:   { irpj: 0.055, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.415, icms: 0.34,  iss: 0 },
    II:  { irpj: 0.055, csll: 0.035, cofins: 0.1182, pis: 0.0278, cpp: 0.415, icms: 0.32,  iss: 0,  },
    III: { irpj: 0.04,  csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0,    iss: 0.335 },
    IV:  { irpj: 0.185, csll: 0.15,  cofins: 0.1603, pis: 0.0347, cpp: 0,     icms: 0,    iss: 0.47 },
    V:   { irpj: 0.25,  csll: 0.15,  cofins: 0.1428, pis: 0.0309, cpp: 0.2885, icms: 0,    iss: 0.137 },
  };
  return tabelas[anexo];
}

export const obterAnexoTabela = obterAnexo;
