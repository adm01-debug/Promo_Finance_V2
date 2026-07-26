/**
 * Motor de cálculo do ISS e das retenções na fonte sobre serviços.
 *
 * Base normativa: LC 116/2003 (arts. 3º, 6º, 7º e 8º-A), LC 157/2016,
 * Lei 10.833/2003 (arts. 30 e 31 — CSRF), RIR/2018 (arts. 714, 716 e 785 — IRRF)
 * e Lei 8.212/1991, art. 31 (retenção de 11% de INSS).
 */

import {
  CSRF_COFINS,
  CSRF_CSLL,
  CSRF_PIS,
  CSRF_PISO_PAGAMENTO,
  INSS_RETENCAO_CESSAO,
  IRRF_PISO_RECOLHIMENTO,
  ISS_ALIQUOTA_MAXIMA,
  ISS_ALIQUOTA_MINIMA,
  buscarItemLc116,
} from './tabelas';
import type { InputIss, LinhaMemoria, LocalIncidencia, ResultadoIss } from './types';

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const nonNeg = (v: number | undefined) => (Number.isFinite(v) && (v as number) > 0 ? (v as number) : 0);

/** Resolve o município competente segundo o art. 3º da LC 116/2003. */
export function resolverMunicipioCompetente(
  local: LocalIncidencia,
  input: Pick<InputIss, 'municipioPrestador' | 'municipioTomador' | 'municipioExecucao'>,
): string {
  switch (local) {
    case 'local_da_prestacao':
      return input.municipioExecucao?.trim() || input.municipioTomador;
    case 'domicilio_tomador':
      return input.municipioTomador;
    default:
      return input.municipioPrestador;
  }
}

export function calcularIss(input: InputIss): ResultadoIss {
  const alertas: string[] = [];
  const memoria: LinhaMemoria[] = [];

  const item = buscarItemLc116(input.itemLc116);
  if (!item) {
    throw new Error(
      `Item ${input.itemLc116} não encontrado na lista anexa da LC 116/2003 embarcada.`,
    );
  }

  const valorServico = nonNeg(input.valorServico);
  const materiais = nonNeg(input.materiais);
  const subempreitadas = nonNeg(input.subempreitadas);

  let deducoes = 0;
  if (item.permiteDeducaoMateriais) {
    deducoes = Math.min(materiais + subempreitadas, valorServico);
    if (materiais + subempreitadas > valorServico) {
      alertas.push('Deduções superiores ao valor do serviço — limitadas ao valor da nota.');
    }
  } else if (materiais + subempreitadas > 0) {
    alertas.push(
      `O item ${item.item} não admite dedução de materiais/subempreitadas na base do ISS (LC 116, art. 7º, §2º).`,
    );
  }

  const baseCalculo = round2(valorServico - deducoes);

  let aliquota = input.aliquotaMunicipal;
  if (!Number.isFinite(aliquota) || aliquota < 0) aliquota = ISS_ALIQUOTA_MINIMA;
  if (aliquota < ISS_ALIQUOTA_MINIMA) {
    alertas.push('Alíquota abaixo do piso de 2% — ajustada (LC 116/2003, art. 8º-A).');
    aliquota = ISS_ALIQUOTA_MINIMA;
  }
  if (aliquota > ISS_ALIQUOTA_MAXIMA) {
    alertas.push('Alíquota acima do teto de 5% — ajustada (LC 116/2003, art. 8º, II).');
    aliquota = ISS_ALIQUOTA_MAXIMA;
  }

  const issDevido = round2(baseCalculo * aliquota);
  const municipioCompetente = resolverMunicipioCompetente(item.local, input);

  if (item.local === 'estabelecimento_prestador' && input.municipioPrestador !== input.municipioTomador) {
    alertas.push(
      'Serviço tributado no estabelecimento prestador: eventual exigência pelo município do tomador é indevida (LC 116, art. 3º, caput).',
    );
  }

  memoria.push({
    rubrica: 'Base de cálculo do ISS',
    base: valorServico,
    aliquota: 0,
    valor: baseCalculo,
    fundamento: deducoes > 0
      ? 'LC 116/2003, art. 7º, §2º, I — dedução de materiais e subempreitadas.'
      : 'LC 116/2003, art. 7º — preço do serviço.',
  });
  memoria.push({
    rubrica: `ISS — ${municipioCompetente}`,
    base: baseCalculo,
    aliquota,
    valor: issDevido,
    fundamento: `LC 116/2003, art. 3º — competência: ${item.local.replace(/_/g, ' ')}.`,
  });

  const simples = input.prestadorSimplesNacional === true;
  const tomadorPj = input.tomadorPessoaJuridica === true || input.tomadorOrgaoPublico === true;

  const issRetido = item.retencaoIssPadrao && tomadorPj;
  const issRetencao = issRetido ? issDevido : 0;
  if (issRetido) {
    memoria.push({
      rubrica: 'ISS retido pelo tomador',
      base: baseCalculo,
      aliquota,
      valor: -issRetencao,
      fundamento: 'LC 116/2003, art. 6º, §2º — responsabilidade do tomador.',
    });
  }

  // --- Retenções federais ---
  let irrf = 0;
  let pis = 0;
  let cofins = 0;
  let csll = 0;
  let inss = 0;

  if (simples) {
    alertas.push('Prestador optante pelo Simples Nacional: dispensadas as retenções de IRRF e CSRF (IN RFB 2.110/2022 e Lei 10.833, art. 32).');
  } else if (tomadorPj) {
    if (item.irrfAliquota > 0) {
      const bruto = round2(valorServico * item.irrfAliquota);
      if (bruto >= IRRF_PISO_RECOLHIMENTO) {
        irrf = bruto;
        memoria.push({
          rubrica: 'IRRF sobre serviços',
          base: valorServico,
          aliquota: item.irrfAliquota,
          valor: -irrf,
          fundamento: 'RIR/2018, arts. 714 e 716 — serviços profissionais e de natureza não profissional.',
        });
      } else {
        alertas.push(`IRRF de ${bruto.toFixed(2)} dispensado por ser inferior a R$ 10,00 (RIR/2018, art. 785).`);
      }
    }

    if (valorServico > CSRF_PISO_PAGAMENTO) {
      pis = round2(valorServico * CSRF_PIS);
      cofins = round2(valorServico * CSRF_COFINS);
      csll = round2(valorServico * CSRF_CSLL);
      memoria.push({
        rubrica: 'CSRF (PIS/COFINS/CSLL 4,65%)',
        base: valorServico,
        aliquota: CSRF_PIS + CSRF_COFINS + CSRF_CSLL,
        valor: -round2(pis + cofins + csll),
        fundamento: 'Lei 10.833/2003, arts. 30 e 31, com a redação da Lei 13.137/2015.',
      });
    } else {
      alertas.push(`Pagamento de até R$ ${CSRF_PISO_PAGAMENTO.toFixed(2)}: CSRF dispensada (Lei 10.833, art. 31, §3º).`);
    }
  }

  const cessao = input.cessaoMaoDeObra ?? item.retencaoInss11;
  if (cessao && tomadorPj && !simples) {
    inss = round2(valorServico * INSS_RETENCAO_CESSAO);
    memoria.push({
      rubrica: 'Retenção previdenciária 11%',
      base: valorServico,
      aliquota: INSS_RETENCAO_CESSAO,
      valor: -inss,
      fundamento: 'Lei 8.212/1991, art. 31 — cessão de mão de obra ou empreitada.',
    });
  }

  const total = round2(issRetencao + irrf + pis + cofins + csll + inss);
  const valorLiquidoRecebido = round2(valorServico - total);

  return {
    itemLc116: item.item,
    descricaoItem: item.descricao,
    baseCalculo,
    aliquota,
    issDevido,
    municipioCompetente,
    local: item.local,
    issRetidoPeloTomador: issRetido,
    retencoes: { iss: issRetencao, irrf, pis, cofins, csll, inss, total },
    valorLiquidoRecebido,
    alertas,
    memoria,
  };
}
