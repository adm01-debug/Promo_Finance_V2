// LUCRO PRESUMIDO — Trimestral com adicional 10%, PIS/COFINS cumulativo
// Suporta segregação de receita monofásica (Leis 9.718/98, 10.147/00, 10.485/02, 10.833/03).

import type {
  InputLucroPresumido, ResultadoRegime, LinhaMemoria, TributoDetalhe, AtividadePresumido,
} from './types';
import { calcularMixMonofasico } from '../monofasico';
import { calcularEncargosPatronais } from '../folha';

const LIMITE_ANUAL = 78_000_000;
const LIMITE_ADICIONAL_TRIMESTRAL = 60_000;

// [presuncaoIrpj, presuncaoCsll]
const PRESUNCAO: Record<AtividadePresumido, [number, number]> = {
  comercio:                  [0.08, 0.12],
  industria:                 [0.08, 0.12],
  servicos_geral:            [0.32, 0.32],
  servicos_profissionais:    [0.32, 0.32],
  transporte_cargas:         [0.08, 0.12],
  transporte_passageiros:    [0.16, 0.12],
  servicos_hospitalares:     [0.08, 0.12],
};

function push(mem: LinhaMemoria[], linha: Omit<LinhaMemoria, 'ordem'>) {
  mem.push({ ordem: mem.length + 1, ...linha });
}

export function calcularLucroPresumido(input: InputLucroPresumido): ResultadoRegime {
  const memoria: LinhaMemoria[] = [];
  const alertas: string[] = [];
  const receitaBruta = input.receitas.receitaBrutaAnual;

  if (receitaBruta > LIMITE_ANUAL) {
    return {
      regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: false,
      motivoInelegibilidade: `Receita > R$ ${LIMITE_ANUAL.toLocaleString('pt-BR')}`,
      tributos: [], retencoesCompensadas: 0, totalTributos: 0, totalAPagar: 0,
      receitaBase: receitaBruta, cargaEfetiva: 0, memoria: [],
      alertas: ['Obrigatório Lucro Real acima de R$ 78 mi.'],
    };
  }

  const receitaLiquida = Math.max(
    0,
    receitaBruta - (input.receitas.devolucoes ?? 0) - (input.receitas.descontosIncondicionais ?? 0),
  );
  const percServ = input.receitas.percentualServicos / 100;
  const percRevenda = 1 - percServ;
  const receitaServicos = receitaLiquida * percServ;
  const receitaMercadorias = receitaLiquida * percRevenda;

  const [presIrpjPad, presCsllPad] = PRESUNCAO[input.atividade];
  // A parcela de serviços só cai na presunção geral de 32% quando a atividade
  // preponderante é mercantil (comércio/indústria). Atividades de serviço com
  // percentual próprio (transporte de cargas 8%/12%, passageiros 16%/12%,
  // hospitalares 8%/12% — Lei 9.249/95, arts. 15 e 20) mantêm o seu percentual
  // também sobre a receita de serviços, sob pena de superestimar IRPJ/CSLL.
  const ATIVIDADE_MERCANTIL: readonly AtividadePresumido[] = ['comercio', 'industria'];
  const ehMercantil = ATIVIDADE_MERCANTIL.includes(input.atividade);
  const presIrpjServ = input.aliquotaIrpjPresuncao ?? (ehMercantil ? 0.32 : presIrpjPad);
  const presCsllServ = input.aliquotaCsllPresuncao ?? (ehMercantil ? 0.32 : presCsllPad);

  const baseIrpj = receitaMercadorias * presIrpjPad + receitaServicos * presIrpjServ +
    (input.ganhoCapital ?? 0) + (input.rendimentosAplicacoes ?? 0);
  const baseCsll = receitaMercadorias * presCsllPad + receitaServicos * presCsllServ +
    (input.ganhoCapital ?? 0) + (input.rendimentosAplicacoes ?? 0);

  push(memoria, { grupo: 'IRPJ', descricao: `Base IRPJ presumida (${(presIrpjPad * 100).toFixed(0)}% merc / ${(presIrpjServ * 100).toFixed(0)}% serv)`, valor: baseIrpj });
  push(memoria, { grupo: 'CSLL', descricao: `Base CSLL presumida (${(presCsllPad * 100).toFixed(0)}% merc / ${(presCsllServ * 100).toFixed(0)}% serv)`, valor: baseCsll });


  const irpjBase = baseIrpj * 0.15;
  // Adicional considerando trimestre (mais realista): base_anual / 4 vs 60k
  const excedenteTrim = Math.max(0, (baseIrpj / 4) - LIMITE_ADICIONAL_TRIMESTRAL) * 4;
  const irpjAdicional = excedenteTrim * 0.10;
  const irpj = irpjBase + irpjAdicional;
  push(memoria, { grupo: 'IRPJ', descricao: 'IRPJ 15% × base', base: baseIrpj, aliquota: 0.15, valor: irpjBase });
  if (irpjAdicional > 0) {
    push(memoria, {
      grupo: 'IRPJ', descricao: 'Adicional 10% (excedente > R$ 60k/trimestre)',
      base: excedenteTrim, aliquota: 0.10, valor: irpjAdicional,
    });
  }

  const csll = baseCsll * 0.09;
  push(memoria, { grupo: 'CSLL', descricao: 'CSLL 9% × base', base: baseCsll, aliquota: 0.09, valor: csll });

  // PIS/COFINS cumulativo — receita monofásica segregada da base normal
  const mono = input.receitas.monofasico?.itens?.length
    ? calcularMixMonofasico(
        input.receitas.monofasico.itens,
        input.receitas.monofasico.posicaoPadrao ?? 'revenda',
        'presumido',
      )
    : null;
  const receitaMonofasica = Math.min(mono?.receitaMonofasica ?? 0, receitaLiquida);
  const baseNormalPisCofins = Math.max(0, receitaLiquida - receitaMonofasica);

  const pis = baseNormalPisCofins * 0.0065 + (mono?.pisMonofasico ?? 0);
  const cofins = baseNormalPisCofins * 0.03 + (mono?.cofinsMonofasico ?? 0);
  if (receitaMonofasica > 0) {
    push(memoria, {
      grupo: 'PIS/COFINS', descricao: '(−) Receita monofásica excluída da base cumulativa',
      valor: -receitaMonofasica, observacao: 'Tributação concentrada na indústria/importador',
    });
  }
  push(memoria, { grupo: 'PIS', descricao: 'PIS cumulativo 0,65%', base: baseNormalPisCofins, aliquota: 0.0065, valor: baseNormalPisCofins * 0.0065 });
  push(memoria, { grupo: 'COFINS', descricao: 'COFINS cumulativo 3%', base: baseNormalPisCofins, aliquota: 0.03, valor: baseNormalPisCofins * 0.03 });
  if (mono && mono.totalMonofasico > 0) {
    push(memoria, { grupo: 'PIS', descricao: 'PIS monofásico (etapa concentrada)', base: receitaMonofasica, valor: mono.pisMonofasico });
    push(memoria, { grupo: 'COFINS', descricao: 'COFINS monofásico (etapa concentrada)', base: receitaMonofasica, valor: mono.cofinsMonofasico });
  }
  if (mono) alertas.push(...mono.alertas);


  // CPP — encargos patronais com RAT ajustado pelo FAP e Terceiros por FPAS
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
    push(memoria, { grupo: 'CPP', descricao: `${linha.rubrica} — ${linha.fundamento}`, base: linha.base, aliquota: linha.aliquota, valor: linha.valor });
  }
  alertas.push(...encargos.alertas);


  // ICMS
  const em = input.estadualMunicipal;
  const icmsAliq = em.aliquotaIcms ?? 0.18;
  const icmsDebito = receitaMercadorias * icmsAliq;
  const icms = Math.max(0, icmsDebito - (em.creditoIcmsCompras ?? 0)) + (em.icmsSt ?? 0) + (em.difal ?? 0);
  if (receitaMercadorias > 0) {
    push(memoria, { grupo: 'ICMS', descricao: `ICMS ${(icmsAliq * 100).toFixed(2)}%`, base: receitaMercadorias, aliquota: icmsAliq, valor: icms });
  }

  // ISS
  const issAliq = em.aliquotaIss ?? 0.05;
  const iss = receitaServicos * issAliq;
  if (receitaServicos > 0) {
    push(memoria, { grupo: 'ISS', descricao: `ISS ${(issAliq * 100).toFixed(2)}%`, base: receitaServicos, aliquota: issAliq, valor: iss });
  }

  const r = input.retencoes ?? {};
  const retencoes = (r.irrfSofrido ?? 0) + (r.csrfSofrido ?? 0) + (r.inssSofrido ?? 0) + (r.issRetido ?? 0);

  const tributos: TributoDetalhe[] = [
    { nome: 'IRPJ', valor: irpj, base: baseIrpj, aliquotaEfetiva: baseIrpj > 0 ? irpj / baseIrpj : 0, formula: '15% base presumida + 10% excedente' },
    { nome: 'CSLL', valor: csll, base: baseCsll, aliquotaEfetiva: 0.09, formula: '9% base presumida' },
    { nome: 'PIS', valor: pis, base: receitaLiquida, aliquotaEfetiva: receitaLiquida > 0 ? pis / receitaLiquida : 0, formula: receitaMonofasica > 0 ? '0,65% receita comum + monofásico' : '0,65% receita (cumulativo)' },
    { nome: 'COFINS', valor: cofins, base: receitaLiquida, aliquotaEfetiva: receitaLiquida > 0 ? cofins / receitaLiquida : 0, formula: receitaMonofasica > 0 ? '3% receita comum + monofásico' : '3% receita (cumulativo)' },
    { nome: 'CPP', valor: cpp, base: input.folha.folhaAnual, aliquotaEfetiva: cppAliq, formula: `${(cppAliq * 100).toFixed(1)}% folha` },
    { nome: 'ICMS', valor: icms, base: receitaMercadorias, aliquotaEfetiva: receitaMercadorias > 0 ? icms / receitaMercadorias : 0, formula: `${(icmsAliq * 100).toFixed(2)}% mercadorias` },
    { nome: 'ISS', valor: iss, base: receitaServicos, aliquotaEfetiva: issAliq, formula: `${(issAliq * 100).toFixed(2)}% serviços` },
  ];
  const totalTributos = tributos.reduce((s, t) => s + t.valor, 0);
  const totalAPagar = Math.max(0, totalTributos - retencoes);

  push(memoria, { grupo: 'TOTAL', descricao: 'Total de tributos', valor: totalTributos });

  if (receitaBruta > LIMITE_ANUAL * 0.9) alertas.push('Faturamento próximo do limite de R$ 78 mi — planejar migração para Lucro Real.');

  return {
    regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: true,
    tributos, retencoesCompensadas: retencoes, totalTributos, totalAPagar,
    receitaBase: receitaBruta,
    cargaEfetiva: receitaBruta > 0 ? (totalAPagar / receitaBruta) * 100 : 0,
    memoria, alertas,
  };
}
