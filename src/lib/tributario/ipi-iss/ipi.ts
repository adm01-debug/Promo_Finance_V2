/**
 * Motor de cálculo do IPI.
 *
 * Base normativa: Decreto 7.212/2010 (RIPI), arts. 190 (base de cálculo),
 * 226 (crédito) e 259 (apuração por período); Decreto 11.158/2022 (TIPI).
 */

import { buscarTipi, normalizarNcm } from './tabelas';
import type { InputIpi, LinhaMemoria, ResultadoIpi, SituacaoIpi } from './types';

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const nonNeg = (v: number | undefined) => (Number.isFinite(v) && (v as number) > 0 ? (v as number) : 0);

/** Situações em que não há débito de IPI, ainda que exista base contábil. */
const SEM_DEBITO: readonly SituacaoIpi[] = ['isenta', 'nao_tributada', 'aliquota_zero', 'suspensa', 'imune'];

export function calcularIpi(input: InputIpi): ResultadoIpi {
  const alertas: string[] = [];
  const memoria: LinhaMemoria[] = [];

  const valorProduto = nonNeg(input.valorProduto);
  const frete = nonNeg(input.frete);
  const seguro = nonNeg(input.seguro);
  const outras = nonNeg(input.outrasDespesas);
  const descontos = nonNeg(input.descontosIncondicionais);
  const contribuinte = input.contribuinte ?? true;

  const tipi = input.ncm ? buscarTipi(input.ncm) : undefined;
  if (input.ncm && !tipi) {
    alertas.push(`NCM ${normalizarNcm(input.ncm)} não catalogado na TIPI embarcada — informe a alíquota manualmente.`);
  }

  let situacao: SituacaoIpi = input.situacao ?? tipi?.situacao ?? 'tributada';
  let aliquota = input.aliquotaManual ?? tipi?.aliquota ?? 0;
  if (aliquota < 0) aliquota = 0;
  if (aliquota > 1) {
    alertas.push('Alíquota informada acima de 100% — normalizada para 100%.');
    aliquota = 1;
  }

  if (!contribuinte) {
    situacao = 'nao_tributada';
    alertas.push('Estabelecimento não industrial nem equiparado: não é contribuinte do IPI (RIPI, art. 24).');
  }

  if (situacao === 'tributada' && aliquota === 0) {
    situacao = 'aliquota_zero';
    alertas.push('Alíquota zero na TIPI: há fato gerador, mas sem débito de imposto.');
  }

  /**
   * RIPI, art. 190, §1º, I: os descontos incondicionais NÃO podem ser
   * excluídos da base de cálculo do IPI (súmula fiscal consolidada), ao
   * contrário do que ocorre no ICMS.
   */
  const baseCalculo = round2(valorProduto + frete + seguro + outras);
  if (descontos > 0) {
    alertas.push('Descontos incondicionais não reduzem a base do IPI (RIPI, art. 190, §1º, I).');
  }

  const semDebito = SEM_DEBITO.includes(situacao);
  const ipiDevido = semDebito ? 0 : round2(baseCalculo * aliquota);

  memoria.push({
    rubrica: 'Base de cálculo do IPI',
    base: baseCalculo,
    aliquota: 0,
    valor: baseCalculo,
    fundamento: 'RIPI/2010, art. 190 — valor da operação, incluídos frete, seguro e demais despesas acessórias.',
  });
  memoria.push({
    rubrica: `IPI (${situacao})`,
    base: baseCalculo,
    aliquota,
    valor: ipiDevido,
    fundamento: 'TIPI — Decreto 11.158/2022; RIPI/2010, art. 189.',
  });

  const creditoEntradas = nonNeg(input.creditoEntradas);
  if (creditoEntradas > 0) {
    memoria.push({
      rubrica: 'Crédito de IPI das entradas',
      base: creditoEntradas,
      aliquota: 0,
      valor: -creditoEntradas,
      fundamento: 'RIPI/2010, art. 226 — não cumulatividade.',
    });
  }
  if (semDebito && creditoEntradas > 0 && situacao !== 'imune') {
    alertas.push('Saída sem débito com crédito na entrada: verifique a necessidade de estorno (RIPI, art. 254).');
  }

  const saldoApurado = round2(ipiDevido - creditoEntradas);
  if (saldoApurado < 0) {
    alertas.push('Saldo credor de IPI apurado — transportar para o período seguinte (RIPI, art. 256).');
  }

  const valorTotalNota = round2(valorProduto + frete + seguro + outras - descontos + ipiDevido);

  return {
    baseCalculo,
    aliquota,
    situacao,
    ipiDevido,
    creditoEntradas,
    saldoApurado,
    valorTotalNota,
    ncmResolvido: tipi?.ncm ?? (input.ncm ? normalizarNcm(input.ncm) : undefined),
    descricaoNcm: tipi?.descricao,
    alertas,
    memoria,
  };
}
