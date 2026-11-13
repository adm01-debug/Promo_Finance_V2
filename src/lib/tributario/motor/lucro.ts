// Motor tributário (front) — Simulação do Lucro Presumido e do Lucro Real.
// Espelhado em supabase/functions/_shared/tributario-logic.ts; o drift guard compara os dois lados.
import { fracaoExportacao } from '../parametros';
import { ratFap, terceiros } from '../encargos-folha';
import {
  apurarIcmsNaoCumulativo,
  apurarRealTrimestral,
  compensarPrejuizo,
  distribuirTrimestres,
  irpjPeriodoAnual,
  irpjPeriodoTrimestral,
} from '../apuracao';
import { sanitizarParametros, LIMITE_PRESUMIDO } from './base';
import type { ParametrosSimulacao, ResultadoCenario, PeriodicidadeApuracao } from './base';

export function simularPresumido(p: ParametrosSimulacao): ResultadoCenario {
  p = sanitizarParametros(p);
  if (p.faturamentoAnual > LIMITE_PRESUMIDO) {
    return {
      regime: 'lucro_presumido',
      nome: 'Lucro Presumido',
      elegivel: false,
      motivoInelegibilidade: 'Faturamento > R$ 78 mi',
      irpj: 0,
      csll: 0,
      pis: 0,
      cofins: 0,
      cpp: 0,
      icms: 0,
      iss: 0,
      cbs: 0,
      ibs: 0,
      totalTributos: 0,
      cargaEfetiva: 0,
      observacoes: ['Obrigatório Lucro Real.'],
    };
  }
  const ps = p.percentualServicos / 100;
  const pc = 1 - ps;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * pc;
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  // Presunção da receita de serviços: 32% é apenas o caso geral. Transporte de
  // cargas (8%/12%), passageiros (16%/12%) e serviços hospitalares (8%/12%)
  // têm percentuais legais próprios (Lei 9.249/95, arts. 15 e 20).
  const presIrpjServ = p.presuncaoIrpjServicos ?? 0.32;
  const presCsllServ = p.presuncaoCsllServicos ?? 0.32;
  const baseIrpj = rs * presIrpjServ + rc * 0.08;
  // Apuração do IRPJ no Lucro Presumido é OBRIGATORIAMENTE trimestral
  // (Lei 9.430/96, art. 1º), com adicional de 10% sobre o que exceder
  // R$ 60.000 em cada trimestre. Sob sazonalidade, isso custa mais do que a
  // conta anual equivalente — diferença capturada aqui.
  const trimestres = distribuirTrimestres(p);
  const basesTrimestrais = trimestres.map((f) => f * ps * presIrpjServ + f * pc * 0.08);
  const irpj = basesTrimestrais.reduce((acc, b) => acc + irpjPeriodoTrimestral(b), 0);
  const irpjEquivalenteAnual = irpjPeriodoAnual(baseIrpj);
  const efeitoSazonalidade = irpj - irpjEquivalenteAnual;
  const csll = (rs * presCsllServ + rc * 0.12) * 0.09;
  // Imunidade objetiva das exportações: exclui a receita exportada da base de
  // PIS/COFINS (CF art. 149 §2º I), de ICMS (art. 155 §2º X "a") e de ISS
  // (art. 156 §3º II). IRPJ/CSLL continuam incidindo sobre a presunção.
  const pExp = fracaoExportacao(p);
  const imune = 1 - pExp;
  const receitaTributavelPisCofins = p.faturamentoAnual * imune;
  const pis = receitaTributavelPisCofins * 0.0065;
  const cofins = receitaTributavelPisCofins * 0.03;
  const apuracaoICMS = apurarIcmsNaoCumulativo(p, rc * imune, aliqICMS);
  const icms = apuracaoICMS.icms;
  const iss = rs * imune * aliqISS;

  const cpp = Math.max(0, p.folhaAnual || 0) * (0.2 + ratFap(p) + terceiros(p));
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  const observacoes = [
    `Presunção 8% comércio / IRPJ ${(presIrpjServ * 100).toFixed(0)}% e CSLL ${(presCsllServ * 100).toFixed(0)}% sobre serviços.`,
    pExp > 0
      ? `PIS/COFINS cumulativo sobre a receita interna; ${(pExp * 100).toFixed(1)}% de exportação imune (CF art. 149 §2º I).`
      : 'PIS/COFINS cumulativo.',

    `ICMS ${(aliqICMS * 100).toFixed(2)}% / ISS ${(aliqISS * 100).toFixed(2)}%.`,
  ];
  if (apuracaoICMS.credito > 0) {
    observacoes.push(
      `ICMS não-cumulativo (CF art. 155 §2º I): crédito de R$ ${apuracaoICMS.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sobre aquisições abatido do débito.`
    );
  }
  if (apuracaoICMS.saldoCredor > 0) {
    observacoes.push(
      `Saldo credor de ICMS de R$ ${apuracaoICMS.saldoCredor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} transportado para o período seguinte.`
    );
  }
  observacoes.push(
    'IRPJ apurado trimestralmente (Lei 9.430/96, art. 1º): adicional de 10% sobre a base que exceder R$ 60 mil por trimestre.'
  );
  if (efeitoSazonalidade > 1) {
    observacoes.push(
      `Sazonalidade da receita eleva o adicional de IRPJ em R$ ${efeitoSazonalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} frente a uma distribuição uniforme entre os trimestres.`
    );
  }
  return {
    regime: 'lucro_presumido',
    nome: 'Lucro Presumido',
    elegivel: true,
    irpj,
    csll,
    pis,
    cofins,
    cpp,
    icms,
    iss,
    cbs: 0,
    ibs: 0,
    totalTributos: total,
    cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    icmsCredito: apuracaoICMS.credito,
    icmsSaldoCredor: apuracaoICMS.saldoCredor,
    periodicidadeApuracao: 'trimestral',
    irpjBasesTrimestrais: basesTrimestrais,
    efeitoSazonalidadeIrpj: efeitoSazonalidade,
    observacoes,
  };
}

export function simularReal(p: ParametrosSimulacao): ResultadoCenario {
  p = sanitizarParametros(p);
  // Defesa: margemLucro ausente/inválida não pode propagar NaN para o total.
  const margemLucro = Number.isFinite(p.margemLucro) ? Number(p.margemLucro) : 0;

  // Cenário trimestral: usa o lucro por trimestre informado ou o rateio pela
  // sazonalidade da receita.
  const trimestreInformado = p.lucroTrimestral?.length === 4;
  const lucrosTrim = trimestreInformado
    ? p.lucroTrimestral!.map((v) => (Number.isFinite(v) ? Number(v) : 0))
    : distribuirTrimestres(p).map((f) => f * (margemLucro / 100));

  // O resultado ANUAL precisa partir do MESMO resultado econômico usado no
  // trimestral, senão o comparativo de periodicidade compara bases distintas
  // (defeito que inflava/anulava `economiaPeriodicidade`). Quando o usuário
  // informa o lucro de cada trimestre, o lucro do ano é a soma algébrica deles.
  const lucro = trimestreInformado
    ? lucrosTrim.reduce((acc, v) => acc + v, 0)
    : p.faturamentoAnual * (margemLucro / 100);

  // Trava dos 30% (Lei 9.065/95, arts. 15 e 16): o estoque de prejuízo fiscal e
  // de base negativa reduz a base tributável em no máximo 30% do lucro do período.
  const compIrpj = compensarPrejuizo(lucro, p.prejuizoFiscalAcumulado ?? 0);
  const compCsll = compensarPrejuizo(lucro, p.baseNegativaCsllAcumulada ?? 0);
  const irpjAnual = irpjPeriodoAnual(compIrpj.baseAjustada);
  const csllAnual = Math.max(0, compCsll.baseAjustada) * 0.09;

  const trim = apurarRealTrimestral(
    lucrosTrim,
    p.prejuizoFiscalAcumulado ?? 0,
    p.baseNegativaCsllAcumulada ?? 0
  );

  const periodicidade: PeriodicidadeApuracao = p.periodicidadeApuracao ?? 'anual';
  const usaTrimestral = periodicidade === 'trimestral';
  const irpj = usaTrimestral ? trim.irpj : irpjAnual;
  const csll = usaTrimestral ? trim.csll : csllAnual;
  const alternativa = usaTrimestral ? irpjAnual + csllAnual : trim.irpj + trim.csll;
  const economiaPeriodicidade = alternativa - (irpj + csll);

  const baseCred = (p.comprasComCredito || 0) + (p.despesasOperacionais || 0);
  const pExp = fracaoExportacao(p);
  const imune = 1 - pExp;
  // Exportação: receita imune a PIS/COFINS, mas os créditos permanecem
  // aproveitáveis (Lei 10.637/02 art. 5º §1º e Lei 10.833/03 art. 6º §1º),
  // podendo zerar a contribuição do período.
  const receitaTributavelPisCofins = p.faturamentoAnual * imune;
  const pis = Math.max(0, receitaTributavelPisCofins * 0.0165 - baseCred * 0.0165);
  const cofins = Math.max(0, receitaTributavelPisCofins * 0.076 - baseCred * 0.076);
  const ps = p.percentualServicos / 100;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * (1 - ps);
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  const apuracaoICMS = apurarIcmsNaoCumulativo(p, rc * imune, aliqICMS);
  const icms = apuracaoICMS.icms;

  const iss = rs * imune * aliqISS;

  const cpp = Math.max(0, p.folhaAnual || 0) * (0.2 + ratFap(p) + terceiros(p));
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  const observacoes = [
    `Lucro estimado: ${margemLucro}% do faturamento.`,
    'PIS/COFINS não-cumulativo.',
  ];
  if (pExp > 0) {
    observacoes.push(
      `Exportação de ${(pExp * 100).toFixed(1)}% da receita: imune a PIS/COFINS, ICMS e ISS (CF/88 arts. 149 §2º I, 155 §2º X "a" e 156 §3º II). IRPJ/CSLL permanecem devidos, e os créditos de PIS/COFINS seguem aproveitáveis.`
    );
  }

  if (compIrpj.compensado > 0 || compCsll.compensado > 0) {
    observacoes.push(
      `Compensação de prejuízos limitada a 30% do lucro (Lei 9.065/95): IRPJ R$ ${compIrpj.compensado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / CSLL R$ ${compCsll.compensado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
    );
  }
  if (compIrpj.saldo > 0) {
    observacoes.push(
      `Saldo de prejuízo fiscal a compensar: R$ ${compIrpj.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (sem prazo de prescrição).`
    );
  }
  if (usaTrimestral) {
    observacoes.push(
      'Apuração TRIMESTRAL: adicional de 10% sobre a base que exceder R$ 60 mil em cada trimestre, sem transporte de limite entre períodos.'
    );
  } else if (lucro <= 240000) {
    observacoes.push('Apuração ANUAL: sem adicional de IRPJ (lucro anual ≤ R$ 240k).');
  } else {
    observacoes.push('Apuração ANUAL: adicional de 10% sobre o lucro excedente a R$ 240k.');
  }
  if (Math.abs(economiaPeriodicidade) > 1) {
    const melhor =
      economiaPeriodicidade > 0 ? periodicidade : usaTrimestral ? 'anual' : 'trimestral';
    const delta = Math.abs(economiaPeriodicidade).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    observacoes.push(
      economiaPeriodicidade > 0
        ? `A opção ${melhor} economiza R$ ${delta} de IRPJ+CSLL frente à alternativa.`
        : `Atenção: a periodicidade ${melhor} reduziria IRPJ+CSLL em R$ ${delta}. Avalie a mudança na 1ª quota do ano (opção irretratável).`
    );
  }
  if (margemLucro < 8) {
    observacoes.push(
      'Margem baixa (< 8%): Lucro Real tende a ser mais vantajoso; revise custos e créditos.'
    );
  }
  if (apuracaoICMS.saldoCredor > 0) {
    observacoes.push(
      `Saldo credor de ICMS de R$ ${apuracaoICMS.saldoCredor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} transportado para o período seguinte.`
    );
  }
  return {
    regime: 'lucro_real',
    nome: 'Lucro Real',
    elegivel: true,
    irpj,
    csll,
    pis,
    cofins,
    cpp,
    icms,
    iss,
    cbs: 0,
    ibs: 0,
    totalTributos: total,
    cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    icmsCredito: apuracaoICMS.credito,
    icmsSaldoCredor: apuracaoICMS.saldoCredor,
    prejuizoFiscalCompensado: usaTrimestral ? trim.compensadoIrpj : compIrpj.compensado,
    prejuizoFiscalSaldo: usaTrimestral ? trim.saldoIrpj : compIrpj.saldo,
    baseNegativaCsllCompensada: usaTrimestral ? trim.compensadoCsll : compCsll.compensado,
    baseNegativaCsllSaldo: usaTrimestral ? trim.saldoCsll : compCsll.saldo,
    periodicidadeApuracao: periodicidade,
    irpjCsllPeriodicidadeAlternativa: alternativa,
    economiaPeriodicidade,
    observacoes,
  };
}
