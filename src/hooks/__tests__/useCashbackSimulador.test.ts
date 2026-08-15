/**
 * Testes — useCashbackSimulador
 * Cobre elegibilidade (renda + CadÚnico), cálculo de cashback por categoria
 * (LC 214/2025), troca de ano (alíquotas de transição) e gestão da cesta.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCashbackSimulador } from '../useCashbackSimulador';

const CONSUMO_CESTA_PADRAO = 800 + 200 + 120 + 80 + 150 + 100 + 200 + 500; // 2150
const ANO_INICIAL = 2026;

describe('useCashbackSimulador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('estado inicial: elegível, cesta padrão e alíquotas de 2026', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    expect(result.current.ano).toBe(2026);
    expect(result.current.rendaFamiliar).toBe(2500);
    expect(result.current.inscritoCadUnico).toBe(true);
    expect(result.current.elegivel).toBe(true);
    expect(result.current.itensConsumo).toHaveLength(8);
    expect(result.current.resumoMensal.totalConsumo).toBe(CONSUMO_CESTA_PADRAO);
    expect(result.current.aliquotas.cbs).toBe(0.9);
    expect(result.current.aliquotas.ibs).toBe(0.1);
    expect(result.current.categoriasDisponiveis).toHaveLength(8);
  });

  it('calcula cashback por categoria conforme LC 214/2025', () => {
    const { result } = renderHook(() => useCashbackSimulador());
    const resumo = result.current.resumoMensal;

    expect(resumo.porCategoria).toHaveLength(8);
    // cbs 0.9% + ibs 0.1% = 1% de tributos sobre o consumo total
    expect(resumo.totalTributosPagos).toBeCloseTo(CONSUMO_CESTA_PADRAO * 0.01, 2);
    // soma dos cashbacks da cesta padrão em 2026 (ver contas no comentário do arquivo)
    expect(resumo.totalCashback).toBeCloseTo(15.76, 2);
    expect(resumo.economiaEfetiva).toBe(resumo.totalCashback);

    // Cesta básica: devolução de 100% dos tributos
    const cesta = resumo.porCategoria.find((r) => r.categoria === 'cesta_basica');
    expect(cesta?.totalCashback).toBeCloseTo(8, 2);
    expect(cesta?.percentualDevolucao).toBe(100);

    // Telecomunicações: devolução de 20%
    const telecom = resumo.porCategoria.find((r) => r.categoria === 'telecomunicacoes');
    expect(telecom?.totalCashback).toBeCloseTo(0.3, 2);
    expect(telecom?.percentualDevolucao).toBeCloseTo(20, 1);
  });

  it('inelegível quando renda acima do limite (3 salários mínimos)', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    act(() => result.current.setRendaFamiliar(5000));

    expect(result.current.elegivel).toBe(false);
    expect(result.current.resumoMensal.totalCashback).toBe(0);
    expect(result.current.resumoMensal.percentualMedioDevolvido).toBe(0);
  });

  it('inelegível quando não inscrito no CadÚnico', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    act(() => result.current.setInscritoCadUnico(false));

    expect(result.current.elegivel).toBe(false);
    expect(result.current.resumoMensal.totalCashback).toBe(0);
  });

  it('troca de ano aplica alíquotas de transição e recalcula tributos', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    act(() => result.current.setAno(2027));

    expect(result.current.aliquotas.cbs).toBe(8.8);
    const cesta = result.current.resumoMensal.porCategoria.find(
      (r) => r.categoria === 'cesta_basica',
    );
    expect(cesta?.cbsPago).toBeCloseTo(800 * 0.088, 2);
    expect(result.current.resumoMensal.totalCashback).toBeGreaterThan(15.76);
  });

  it('ano sem entrada na transição cai para a primeira alíquota', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    act(() => result.current.setAno(2099));

    expect(result.current.aliquotas.ano).toBe(ANO_INICIAL);
  });

  it('adiciona, atualiza e remove itens; resetarCesta restaura o padrão', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    act(() =>
      result.current.adicionarItem({ categoria: 'demais', descricao: 'Extra', valorMensal: 100 }),
    );
    expect(result.current.itensConsumo).toHaveLength(9);
    expect(result.current.resumoMensal.totalConsumo).toBe(CONSUMO_CESTA_PADRAO + 100);

    const novo = result.current.itensConsumo[8];
    act(() => result.current.atualizarItem(novo.id, { valorMensal: 50 }));
    expect(result.current.itensConsumo[8].valorMensal).toBe(50);
    expect(result.current.resumoMensal.totalConsumo).toBe(CONSUMO_CESTA_PADRAO + 50);

    act(() => result.current.removerItem(novo.id));
    expect(result.current.itensConsumo).toHaveLength(8);
    expect(result.current.resumoMensal.totalConsumo).toBe(CONSUMO_CESTA_PADRAO);

    act(() => result.current.resetarCesta());
    expect(result.current.itensConsumo).toHaveLength(8);
    expect(result.current.resumoMensal.totalConsumo).toBe(CONSUMO_CESTA_PADRAO);
  });

  it('projeta valores anuais (x12)', () => {
    const { result } = renderHook(() => useCashbackSimulador());

    expect(result.current.projecaoAnual.totalConsumo).toBe(CONSUMO_CESTA_PADRAO * 12);
    expect(result.current.projecaoAnual.totalCashback).toBeCloseTo(15.76 * 12, 1);
    expect(result.current.projecaoAnual.totalTributos).toBeCloseTo(
      CONSUMO_CESTA_PADRAO * 0.01 * 12,
      1,
    );
  });
});
