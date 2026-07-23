import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  COLLECTION_STAGES,
  calculateCollectionStage,
  calculateDynamicScore,
} from '../collection-engine';

const FIXED_TODAY = new Date('2026-07-23T12:00:00Z');

const daysFromToday = (offset: number): string => {
  const d = new Date(FIXED_TODAY);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

describe('collection-engine :: calculateCollectionStage', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TODAY);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it('retorna null para status pago ou cancelado', () => {
    expect(calculateCollectionStage(daysFromToday(-30), 'pago')).toBeNull();
    expect(calculateCollectionStage(daysFromToday(-30), 'cancelado')).toBeNull();
  });

  it('classifica como PREVENTIVA quando ainda não venceu', () => {
    expect(calculateCollectionStage(daysFromToday(10), 'aberto')).toBe(COLLECTION_STAGES.PREVENTIVA);
  });

  it('classifica como LEMBRETE entre 0 e 5 dias de atraso', () => {
    expect(calculateCollectionStage(daysFromToday(0), 'aberto')).toBe(COLLECTION_STAGES.LEMBRETE);
    expect(calculateCollectionStage(daysFromToday(-5), 'aberto')).toBe(COLLECTION_STAGES.LEMBRETE);
  });

  it('classifica como COBRANCA entre 6 e 15 dias', () => {
    expect(calculateCollectionStage(daysFromToday(-6), 'aberto')).toBe(COLLECTION_STAGES.COBRANCA);
    expect(calculateCollectionStage(daysFromToday(-15), 'aberto')).toBe(COLLECTION_STAGES.COBRANCA);
  });

  it('classifica como NEGOCIACAO entre 16 e 30 dias', () => {
    expect(calculateCollectionStage(daysFromToday(-16), 'aberto')).toBe(COLLECTION_STAGES.NEGOCIACAO);
    expect(calculateCollectionStage(daysFromToday(-30), 'aberto')).toBe(COLLECTION_STAGES.NEGOCIACAO);
  });

  it('escalona para JURIDICO acima de 30 dias', () => {
    expect(calculateCollectionStage(daysFromToday(-31), 'aberto')).toBe(COLLECTION_STAGES.JURIDICO);
    expect(calculateCollectionStage(daysFromToday(-365), 'aberto')).toBe(COLLECTION_STAGES.JURIDICO);
  });
});

describe('collection-engine :: calculateDynamicScore', () => {
  it('retorna score base 600 sem histórico', () => {
    expect(calculateDynamicScore([])).toBe(600);
  });

  it('retorna score máximo para 100% de pontualidade', () => {
    const history = [
      { days_overdue: 0 },
      { days_overdue: -3 },
      { days_overdue: -1 },
    ];
    expect(calculateDynamicScore(history)).toBe(1000);
  });

  it('penaliza histórico com atrasos médios altos', () => {
    const history = [
      { days_overdue: 30 },
      { days_overdue: 45 },
      { days_overdue: 60 },
    ];
    const score = calculateDynamicScore(history);
    expect(score).toBeLessThan(600);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('mistura atraso e pontualidade proporcionalmente', () => {
    const history = [
      { days_overdue: 0 },
      { days_overdue: 10 },
    ];
    // punctuality = 0.5 → +200 ; avgDelay = 5 → -50 ; base 600 → 750
    expect(calculateDynamicScore(history)).toBe(750);
  });

  it('nunca ultrapassa faixa 0..1000', () => {
    const extreme = Array.from({ length: 5 }, () => ({ days_overdue: 10000 }));
    expect(calculateDynamicScore(extreme)).toBe(0);
  });

  it('arredonda o resultado para inteiro', () => {
    const history = [
      { days_overdue: 0 },
      { days_overdue: 1 },
      { days_overdue: 2 },
    ];
    const score = calculateDynamicScore(history);
    expect(Number.isInteger(score)).toBe(true);
  });
});
