// Motor tributário (front) — Simulação do Simples Nacional.
// Espelhado em supabase/functions/_shared/tributario-logic.ts; o drift guard compara os dois lados.
import { fracaoExportacao } from '../parametros';
import {
  sanitizarParametros,
  LIMITE_SIMPLES,
  calcularRBT12,
  calcularFolha12m,
  determinarAnexoSimples,
  ANEXOS,
} from './base';
import type { ParametrosSimulacao, AnexoSimples, ResultadoCenario } from './base';

export function simularSimples(
  p: ParametrosSimulacao,
  ano: number,
  mes: number,
  forcarAnexo?: AnexoSimples
): ResultadoCenario {
  p = sanitizarParametros(p);
  const obs: string[] = [];
  if (p.faturamentoAnual > LIMITE_SIMPLES) {
    return {
      regime: 'simples_nacional',
      nome: 'Simples Nacional',
      elegivel: false,
      motivoInelegibilidade: `Faturamento acima de R$ 4,8 mi`,
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
      observacoes: ['Acima do limite legal.'],
    };
  }
  let rbt12 = p.faturamentoAnual;
  if (p.faturamentoMensal?.length) {
    const r = calcularRBT12(p.faturamentoMensal, ano, mes);
    if (r > 0) {
      rbt12 = r;
    } else {
      obs.push(
        'RBT12 estimado a partir do faturamento anual informado (histórico mensal sem meses anteriores ao mês de referência).'
      );
    }
  }
  const folha12m = p.folhaMensal?.length
    ? calcularFolha12m(p.folhaMensal, ano, mes)
    : p.folhaAnual || 0;
  const fatorR = rbt12 > 0 ? folha12m / rbt12 : 0;
  const { anexo: anexoDetectado, motivo } = determinarAnexoSimples(p, fatorR);
  let anexo: AnexoSimples = anexoDetectado;
  if (forcarAnexo) {
    anexo = forcarAnexo;
    obs.push(`Anexo forçado manualmente para simulação: Anexo ${anexo}.`);
  } else {
    obs.push(motivo);
  }
  const faixa = ANEXOS[anexo].find((f) => rbt12 <= f.ate) || ANEXOS[anexo][5];
  const aliqEfet = rbt12 > 0 ? Math.max(0, (rbt12 * faixa.aliq - faixa.pd) / rbt12) : faixa.aliq;
  const das = p.faturamentoAnual * aliqEfet;
  obs.push(
    `Faixa ${faixa.faixa}, alíq nominal ${(faixa.aliq * 100).toFixed(2)}%, efetiva ${(aliqEfet * 100).toFixed(2)}%.`
  );

  // Distribuição simplificada por anexo (LC 123/2006, Anexos I-V).
  // As frações de cada anexo precisam somar 1.0 — caso contrário o cálculo
  // sobrestima/subestima o total. Renormalizamos defensivamente para evitar
  // que pequenos desvios na tabela (ex.: 0.055+0.035+0.1282+0.0278+0.415+0.34
  // do Anexo I = 1.001) afetem o DAS.
  type DistribuicaoAnexo = {
    irpj: number;
    csll: number;
    cofins: number;
    pis: number;
    cpp: number;
    icms: number;
    iss: number;
  };
  const dist: Record<AnexoSimples, DistribuicaoAnexo> = {
    I: { irpj: 0.055, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.415, icms: 0.34, iss: 0 },
    II: { irpj: 0.055, csll: 0.035, cofins: 0.1182, pis: 0.0278, cpp: 0.415, icms: 0.32, iss: 0 },
    III: { irpj: 0.04, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.434, icms: 0, iss: 0.335 },
    IV: { irpj: 0.185, csll: 0.15, cofins: 0.1603, pis: 0.0347, cpp: 0, icms: 0, iss: 0.47 },
    V: { irpj: 0.25, csll: 0.15, cofins: 0.1428, pis: 0.0309, cpp: 0.2885, icms: 0, iss: 0.137 },
  };

  const raw = dist[anexo];
  const sum = raw.irpj + raw.csll + raw.cofins + raw.pis + raw.cpp + raw.icms + raw.iss;
  const d: DistribuicaoAnexo =
    sum > 0
      ? {
          irpj: raw.irpj / sum,
          csll: raw.csll / sum,
          cofins: raw.cofins / sum,
          pis: raw.pis / sum,
          cpp: raw.cpp / sum,
          icms: raw.icms / sum,
          iss: raw.iss / sum,
        }
      : raw;

  // --- Sublimite estadual (LC 123/2006, arts. 19 e 20) ---------------------
  // Ultrapassado o sublimite (padrão R$ 3,6 mi), ICMS e ISS deixam de ser
  // recolhidos no DAS e passam ao regime normal de apuração. A parcela federal
  // do DAS é reproporcionalizada para os tributos remanescentes.
  const sublimite = p.sublimiteEstadual ?? 3_600_000;
  const sublimiteExcedido = rbt12 > sublimite;

  // --- Imunidade das exportações (LC 123/2006, art. 18 §14) ----------------
  // Sobre a receita exportada não incidem as parcelas de PIS, COFINS, ICMS e
  // ISS do DAS; as demais (IRPJ, CSLL, CPP) permanecem devidas.
  const pExp = fracaoExportacao(p);
  const fracaoImuneExport = d.pis + d.cofins + d.icms + d.iss;
  const descontoExportacao = das * pExp * fracaoImuneExport;
  const imune = 1 - pExp;

  let icms = das * d.icms * imune;
  let iss = das * d.iss * imune;
  let dasFinal = das - descontoExportacao;
  let icmsForaDAS = 0;
  let issForaDAS = 0;

  if (pExp > 0 && descontoExportacao > 0) {
    obs.push(
      `Receita de exportação (${(pExp * 100).toFixed(1)}%) imune a PIS/COFINS/ICMS/ISS (LC 123/2006, art. 18 §14): R$ ${descontoExportacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} excluídos do DAS.`
    );
  }

  if (sublimiteExcedido && (d.icms > 0 || d.iss > 0)) {
    const fracaoEstadualMunicipal = d.icms + d.iss;
    dasFinal = das * (1 - fracaoEstadualMunicipal) - das * pExp * (d.pis + d.cofins);

    const pServ = Math.max(0, Math.min(100, p.percentualServicos || 0)) / 100;
    const pMerc = Math.max(0, 1 - pServ);
    const aliqICMS = p.aliquotaICMS ?? 0.18;
    const aliqISS = p.aliquotaISS ?? 0.05;

    icmsForaDAS = d.icms > 0 ? p.faturamentoAnual * pMerc * imune * aliqICMS : 0;
    issForaDAS = d.iss > 0 ? p.faturamentoAnual * pServ * imune * aliqISS : 0;
    icms = icmsForaDAS;
    iss = issForaDAS;
    obs.push(
      `RBT12 (R$ ${rbt12.toLocaleString('pt-BR')}) acima do sublimite estadual de R$ ${sublimite.toLocaleString('pt-BR')}: ICMS e ISS recolhidos FORA do DAS pelo regime normal.`
    );
  }

  // --- ISS retido na fonte (LC 116/2003) -----------------------------------
  // O ISS retido pelo tomador é deduzido da parcela de ISS devida no DAS,
  // limitado ao próprio valor dessa parcela (não gera saldo negativo).
  let issRetidoDeduzido = 0;
  const issRetido = Math.max(0, p.issRetidoFonte || 0);
  if (issRetido > 0 && !sublimiteExcedido && iss > 0) {
    issRetidoDeduzido = Math.min(issRetido, iss);
    iss -= issRetidoDeduzido;
    dasFinal -= issRetidoDeduzido;
    obs.push(
      `ISS retido na fonte de R$ ${issRetidoDeduzido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} deduzido do DAS.`
    );
  }

  // --- CPP patronal fora do DAS (Anexo IV, LC 123/2006 art. 18 §5º-C) ------
  // No Anexo IV a contribuição previdenciária patronal NÃO está incluída no DAS:
  // a empresa recolhe 20% sobre a folha + RAT/FAP em GPS/DCTFWeb. Ignorar essa
  // parcela subestimaria materialmente a carga do regime na comparação.
  let cpp = das * d.cpp;
  let cppForaDAS = 0;
  if (anexo === 'IV') {
    const rat = Math.min(0.06, Math.max(0, p.aliquotaRAT ?? 0.02));
    cppForaDAS = Math.max(0, p.folhaAnual || 0) * (0.2 + rat);
    cpp = cppForaDAS;
    if (cppForaDAS > 0) {
      obs.push(
        `Anexo IV: CPP patronal de R$ ${cppForaDAS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (20% + RAT ${(rat * 100).toFixed(2)}%) recolhida FORA do DAS.`
      );
    }
  }

  const totalTributos = (sublimiteExcedido ? dasFinal + icms + iss : dasFinal) + cppForaDAS;

  return {
    regime: 'simples_nacional',
    nome: 'Simples Nacional',
    elegivel: true,
    irpj: das * d.irpj,
    csll: das * d.csll,
    pis: das * d.pis * imune,
    cofins: das * d.cofins * imune,
    cpp,
    icms,
    iss,
    cbs: 0,
    ibs: 0,
    totalTributos,
    cargaEfetiva: p.faturamentoAnual > 0 ? (totalTributos / p.faturamentoAnual) * 100 : 0,
    rbt12,
    fatorR,
    anexoAplicavel: anexo,
    faixaAplicavel: faixa.faixa,
    aliquotaNominal: faixa.aliq * 100,
    sublimiteExcedido,
    icmsForaDAS,
    issForaDAS,
    issRetidoDeduzido,
    cppForaDAS,
    observacoes: obs,
  };
}
