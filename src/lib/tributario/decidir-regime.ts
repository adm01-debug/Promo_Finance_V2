// ============================================
// DECISOR — Orquestra os 3 simuladores e ranqueia
// ============================================

import type { ParametrosSimulacao, ResultadoDecisao, RegimeTributario } from './types';
import { simularSimples } from './simular-simples';
import { simularPresumido } from './simular-presumido';
import { simularReal } from './simular-real';

export interface OpcoesDecisao {
  anoReferencia?: number;
  mesReferencia?: number;
  regimeAtual?: RegimeTributario;
}

export function decidirRegime(
  params: ParametrosSimulacao,
  opcoes: OpcoesDecisao = {},
): ResultadoDecisao {
  const hoje = new Date();
  const ano = opcoes.anoReferencia ?? hoje.getFullYear();
  const mes = opcoes.mesReferencia ?? hoje.getMonth() + 1;

  const cenarios = [
    simularSimples(params, { anoReferencia: ano, mesReferencia: mes }),
    simularPresumido(params),
    simularReal(params),
  ];

  // Ranqueia apenas os elegíveis
  const elegiveis = cenarios
    .filter((c) => c.elegivel)
    .sort((a, b) => a.totalTributos - b.totalTributos);

  if (elegiveis.length === 0) {
    return {
      cenarios,
      recomendado: cenarios[2], // Lucro Real é fallback (sempre elegível)
      alertas: ['Nenhum regime claramente vantajoso — revisar parâmetros.'],
      justificativa: 'Cenários inelegíveis ou inconsistentes.',
    };
  }

  const recomendado = elegiveis[0];
  const segundoLugar = elegiveis[1];

  // Economia vs regime atual
  let economiaAnualVsAtual: number | undefined;
  if (opcoes.regimeAtual) {
    const atual = cenarios.find((c) => c.regime === opcoes.regimeAtual);
    if (atual && atual.elegivel) {
      economiaAnualVsAtual = atual.totalTributos - recomendado.totalTributos;
    }
  }

  const alertas: string[] = [];
  if (segundoLugar) {
    const diff = segundoLugar.totalTributos - recomendado.totalTributos;
    const diffPct = (diff / recomendado.totalTributos) * 100;
    if (diffPct < 5) {
      alertas.push(
        `Diferença pequena (${diffPct.toFixed(1)}%) entre ${recomendado.nome} e ${segundoLugar.nome}. Avaliar fatores qualitativos.`,
      );
    }
  }

  if (recomendado.regime === 'simples_nacional' && (recomendado.rbt12 ?? 0) > 4_320_000) {
    alertas.push('RBT12 próximo do limite (> R$ 4,32 mi). Risco de desenquadramento.');
  }

  const justificativa = montarJustificativa(recomendado, segundoLugar, economiaAnualVsAtual);

  return {
    cenarios,
    recomendado,
    segundoLugar,
    economiaAnualVsAtual,
    alertas,
    justificativa,
  };
}

function montarJustificativa(
  recomendado: ResultadoDecisao['recomendado'],
  segundoLugar: ResultadoDecisao['segundoLugar'],
  economia?: number,
): string {
  const partes: string[] = [];
  partes.push(
    `${recomendado.nome} apresenta a menor carga tributária estimada: R$ ${recomendado.totalTributos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${recomendado.cargaEfetiva.toFixed(2)}% do faturamento).`,
  );
  if (segundoLugar) {
    const diff = segundoLugar.totalTributos - recomendado.totalTributos;
    partes.push(
      `Economia vs ${segundoLugar.nome}: R$ ${diff.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/ano.`,
    );
  }
  if (economia !== undefined && economia > 0) {
    partes.push(`Migrar do regime atual geraria economia anual de R$ ${economia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`);
  }
  return partes.join(' ');
}
