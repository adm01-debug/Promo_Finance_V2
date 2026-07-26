// LUCRO REAL — Cálculo detalhado com LALUR, compensação de prejuízo, PIS/COFINS não-cumulativo,
// CPP com RAT+Terceiros, ICMS/ISS com créditos, retenções.

import type {
  InputLucroReal, ResultadoRegime, LinhaMemoria, TributoDetalhe,
} from './types';
import { calcularMixMonofasico } from '../monofasico';

const LIMITE_ADICIONAL_ANUAL = 240_000;
const LIMITE_ADICIONAL_TRIMESTRAL = 60_000;

function push(mem: LinhaMemoria[], linha: Omit<LinhaMemoria, 'ordem'>) {
  mem.push({ ordem: mem.length + 1, ...linha });
}

export function calcularLucroReal(input: InputLucroReal): ResultadoRegime {
  const memoria: LinhaMemoria[] = [];
  const alertas: string[] = [];
  const receitaBruta = input.receitas.receitaBrutaAnual;
  const receitaLiquida = Math.max(
    0,
    receitaBruta - (input.receitas.devolucoes ?? 0) - (input.receitas.descontosIncondicionais ?? 0),
  );

  // === LALUR Parte A ===
  const somaAdicoes =
    (input.lalur.adicoesMultas ?? 0) +
    (input.lalur.adicoesBrindes ?? 0) +
    (input.lalur.adicoesProvisoes ?? 0) +
    (input.lalur.adicoesDoacoes ?? 0) +
    (input.lalur.adicoesOutras ?? 0);
  const somaExclusoes =
    (input.lalur.exclusoesDividendos ?? 0) +
    (input.lalur.exclusoesReversaoProvisoes ?? 0) +
    (input.lalur.exclusoesIncentivos ?? 0) +
    (input.lalur.exclusoesOutras ?? 0);

  push(memoria, { grupo: 'LALUR', descricao: 'Lucro contábil (LAIR)', valor: input.lucroContabil });
  if (somaAdicoes > 0)
    push(memoria, { grupo: 'LALUR', descricao: '(+) Adições', valor: somaAdicoes });
  if (somaExclusoes > 0)
    push(memoria, { grupo: 'LALUR', descricao: '(−) Exclusões', valor: -somaExclusoes });

  const lucroAntesCompensacao = input.lucroContabil + somaAdicoes - somaExclusoes;
  push(memoria, {
    grupo: 'LALUR',
    descricao: '= Lucro real antes de compensação',
    valor: lucroAntesCompensacao,
  });

  // Compensação de prejuízo fiscal — limite 30%
  const prejuizo = input.prejuizoAcumulado ?? 0;
  let compensacao = 0;
  if (lucroAntesCompensacao > 0 && prejuizo > 0) {
    compensacao = Math.min(prejuizo, lucroAntesCompensacao * 0.3);
    push(memoria, {
      grupo: 'LALUR',
      descricao: `(−) Compensação prejuízo fiscal (limite 30%)`,
      valor: -compensacao,
      observacao: `Saldo prejuízo: R$ ${prejuizo.toFixed(2)}; utilizado: R$ ${compensacao.toFixed(2)}`,
    });
    if (compensacao < prejuizo) {
      alertas.push(
        `Prejuízo remanescente após compensação: R$ ${(prejuizo - compensacao).toFixed(2)}`,
      );
    }
  }
  const lucroReal = Math.max(0, lucroAntesCompensacao - compensacao);
  push(memoria, { grupo: 'LALUR', descricao: '= Base de cálculo IRPJ/CSLL', valor: lucroReal });

  // === IRPJ + adicional 10% ===
  const irpjBase = lucroReal * 0.15;
  const limiteAdicional =
    input.modo === 'trimestral' ? LIMITE_ADICIONAL_TRIMESTRAL : LIMITE_ADICIONAL_ANUAL;
  const excedente = Math.max(0, lucroReal - limiteAdicional);
  const irpjAdicional = excedente * 0.10;
  const irpj = irpjBase + irpjAdicional;

  push(memoria, {
    grupo: 'IRPJ', descricao: 'IRPJ 15% × base', base: lucroReal, aliquota: 0.15, valor: irpjBase,
  });
  if (irpjAdicional > 0) {
    push(memoria, {
      grupo: 'IRPJ', descricao: `Adicional 10% sobre excedente a R$ ${limiteAdicional.toLocaleString('pt-BR')}`,
      base: excedente, aliquota: 0.10, valor: irpjAdicional,
    });
  }

  // === CSLL ===
  const csllAliq = input.csllAliquotaFinanceira ? 0.15 : 0.09;
  const csll = lucroReal * csllAliq;
  push(memoria, {
    grupo: 'CSLL',
    descricao: `CSLL ${(csllAliq * 100).toFixed(0)}% × base`,
    base: lucroReal, aliquota: csllAliq, valor: csll,
  });

  // === PIS/COFINS não-cumulativo (com segregação de receita monofásica) ===
  const c = input.creditosPisCofins;
  const baseCreditos =
    (c.insumos ?? 0) + (c.energiaEletrica ?? 0) + (c.alugueisPj ?? 0) +
    (c.depreciacao ?? 0) + (c.fretesVenda ?? 0) + (c.devolucoesVenda ?? 0) +
    (c.arrendamentoMercantil ?? 0) + (c.outros ?? 0);

  const mono = input.receitas.monofasico?.itens?.length
    ? calcularMixMonofasico(
        input.receitas.monofasico.itens,
        input.receitas.monofasico.posicaoPadrao ?? 'revenda',
        'real',
      )
    : null;
  const receitaMonofasica = Math.min(mono?.receitaMonofasica ?? 0, receitaLiquida);
  const baseNormalPisCofins = Math.max(0, receitaLiquida - receitaMonofasica);

  const pisDebito = baseNormalPisCofins * 0.0165;
  const pisCredito = baseCreditos * 0.0165;
  const pis = Math.max(0, pisDebito - pisCredito) + (mono?.pisMonofasico ?? 0);
  const cofinsDebito = baseNormalPisCofins * 0.076;
  const cofinsCredito = baseCreditos * 0.076;
  const cofins = Math.max(0, cofinsDebito - cofinsCredito) + (mono?.cofinsMonofasico ?? 0);

  if (receitaMonofasica > 0) {
    push(memoria, {
      grupo: 'PIS/COFINS', descricao: '(−) Receita monofásica excluída da base não cumulativa',
      valor: -receitaMonofasica,
      observacao: 'Revenda de monofásico não gera débito nem crédito (Lei 10.865/04, art. 21)',
    });
  }
  push(memoria, {
    grupo: 'PIS', descricao: 'PIS débito 1,65%', base: baseNormalPisCofins, aliquota: 0.0165, valor: pisDebito,
  });
  push(memoria, {
    grupo: 'PIS', descricao: '(−) Créditos PIS 1,65%', base: baseCreditos, aliquota: 0.0165, valor: -pisCredito,
    observacao: 'Insumos, energia, aluguéis PJ, depreciação, fretes na venda',
  });
  push(memoria, { grupo: 'PIS', descricao: '= PIS a recolher', valor: pis });
  push(memoria, {
    grupo: 'COFINS', descricao: 'COFINS débito 7,6%', base: baseNormalPisCofins, aliquota: 0.076, valor: cofinsDebito,
  });
  push(memoria, {
    grupo: 'COFINS', descricao: '(−) Créditos COFINS 7,6%', base: baseCreditos, aliquota: 0.076, valor: -cofinsCredito,
  });
  push(memoria, { grupo: 'COFINS', descricao: '= COFINS a recolher', valor: cofins });
  if (mono && mono.totalMonofasico > 0) {
    push(memoria, { grupo: 'PIS', descricao: 'PIS monofásico (etapa concentrada)', base: receitaMonofasica, valor: mono.pisMonofasico });
    push(memoria, { grupo: 'COFINS', descricao: 'COFINS monofásico (etapa concentrada)', base: receitaMonofasica, valor: mono.cofinsMonofasico });
  }
  if (mono) alertas.push(...mono.alertas);


  // === CPP (INSS patronal com RAT ajustado pelo FAP e Terceiros por FPAS) ===
  const encargos = calcularEncargosPatronais({
    folha: input.folha.folhaAnual,
    proLabore: input.folha.proLabore,
    aliquotaRat: input.folha.aliquotaRat,
    aliquotaTerceiros: input.folha.aliquotaTerceiros,
    grauRisco: input.folha.grauRisco,
    fap: input.folha.fap,
    fpas: input.folha.fpas,
    incluirFgts: false,
  }, input.folha.cnae);
  const cpp = encargos.totalInss;
  const cppAliq = input.folha.folhaAnual > 0 ? cpp / input.folha.folhaAnual : 0;
  for (const linha of encargos.linhas) {
    push(memoria, {
      grupo: 'CPP',
      descricao: `${linha.rubrica} — ${linha.fundamento}`,
      base: linha.base, aliquota: linha.aliquota, valor: linha.valor,
    });
  }
  alertas.push(...encargos.alertas);


  // === ICMS ===
  const em = input.estadualMunicipal;
  const percRevenda = 1 - input.receitas.percentualServicos / 100;
  const receitaMercadorias = receitaLiquida * percRevenda;
  const receitaServicos = receitaLiquida * (input.receitas.percentualServicos / 100);
  const icmsAliq = em.aliquotaIcms ?? 0.18;
  const icmsDebito = receitaMercadorias * icmsAliq;
  const icmsCredito = em.creditoIcmsCompras ?? 0;
  const icms = Math.max(0, icmsDebito - icmsCredito) + (em.icmsSt ?? 0) + (em.difal ?? 0);
  if (receitaMercadorias > 0) {
    push(memoria, {
      grupo: 'ICMS', descricao: `ICMS ${(icmsAliq * 100).toFixed(2)}% × mercadorias`,
      base: receitaMercadorias, aliquota: icmsAliq, valor: icmsDebito,
    });
    if (icmsCredito > 0) push(memoria, { grupo: 'ICMS', descricao: '(−) Créditos ICMS', valor: -icmsCredito });
    if (em.icmsSt) push(memoria, { grupo: 'ICMS', descricao: 'ICMS-ST', valor: em.icmsSt });
    if (em.difal) push(memoria, { grupo: 'ICMS', descricao: 'DIFAL', valor: em.difal });
  }

  // === ISS ===
  const issAliq = em.aliquotaIss ?? 0.05;
  const iss = receitaServicos * issAliq;
  if (receitaServicos > 0) {
    push(memoria, {
      grupo: 'ISS', descricao: `ISS ${(issAliq * 100).toFixed(2)}% × serviços`,
      base: receitaServicos, aliquota: issAliq, valor: iss,
    });
  }

  // === Retenções na fonte (crédito) ===
  const r = input.retencoes ?? {};
  const retencoes =
    (r.irrfSofrido ?? 0) + (r.csrfSofrido ?? 0) + (r.inssSofrido ?? 0) + (r.issRetido ?? 0);
  if (retencoes > 0) {
    push(memoria, {
      grupo: 'Retenções',
      descricao: 'Retenções na fonte (compensáveis)',
      valor: -retencoes,
    });
  }

  const tributos: TributoDetalhe[] = [
    { nome: 'IRPJ', valor: irpj, base: lucroReal, aliquotaEfetiva: lucroReal > 0 ? irpj / lucroReal : 0, formula: '15% base + 10% excedente' },
    { nome: 'CSLL', valor: csll, base: lucroReal, aliquotaEfetiva: csllAliq, formula: `${(csllAliq * 100).toFixed(0)}% base` },
    { nome: 'PIS', valor: pis, base: receitaLiquida, aliquotaEfetiva: receitaLiquida > 0 ? pis / receitaLiquida : 0, formula: '1,65% débito − 1,65% créditos' },
    { nome: 'COFINS', valor: cofins, base: receitaLiquida, aliquotaEfetiva: receitaLiquida > 0 ? cofins / receitaLiquida : 0, formula: '7,6% débito − 7,6% créditos' },
    { nome: 'CPP', valor: cpp, base: input.folha.folhaAnual, aliquotaEfetiva: cppAliq, formula: `${(cppAliq * 100).toFixed(1)}% folha` },
    { nome: 'ICMS', valor: icms, base: receitaMercadorias, aliquotaEfetiva: receitaMercadorias > 0 ? icms / receitaMercadorias : 0, formula: `${(icmsAliq * 100).toFixed(2)}% mercadorias − créditos` },
    { nome: 'ISS', valor: iss, base: receitaServicos, aliquotaEfetiva: issAliq, formula: `${(issAliq * 100).toFixed(2)}% serviços` },
  ];

  const totalTributos = tributos.reduce((s, t) => s + t.valor, 0);
  const totalAPagar = Math.max(0, totalTributos - retencoes);
  push(memoria, { grupo: 'TOTAL', descricao: 'Total de tributos', valor: totalTributos });
  push(memoria, { grupo: 'TOTAL', descricao: 'Total a pagar (após retenções)', valor: totalAPagar });

  // Alertas de otimização
  const margem = receitaBruta > 0 ? (input.lucroContabil / receitaBruta) * 100 : 0;
  if (margem > 32) alertas.push('Margem > 32%: Lucro Presumido tende a ser mais vantajoso — verifique.');
  if (baseCreditos < receitaLiquida * 0.3) alertas.push('Créditos PIS/COFINS abaixo de 30% da receita — revise apropriação.');
  if (prejuizo > 0 && compensacao === 0) alertas.push('Há prejuízo acumulado mas lucro real ≤ 0 — sem base para compensar neste período.');

  return {
    regime: 'lucro_real',
    nome: 'Lucro Real',
    elegivel: true,
    tributos,
    retencoesCompensadas: retencoes,
    totalTributos,
    totalAPagar,
    receitaBase: receitaBruta,
    cargaEfetiva: receitaBruta > 0 ? (totalAPagar / receitaBruta) * 100 : 0,
    memoria,
    alertas,
  };
}
