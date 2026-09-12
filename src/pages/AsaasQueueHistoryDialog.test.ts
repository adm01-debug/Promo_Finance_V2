import { describe, expect, it } from 'vitest';
import { formatarTimestampFila } from './asaasQueueHistory.helpers';

describe('formatarTimestampFila', () => {
  it('não deixa um timestamp ausente ou inválido interromper o histórico', () => {
    expect(formatarTimestampFila(undefined)).toBe('Data indisponível');
    expect(formatarTimestampFila('timestamp-inválido')).toBe('Data indisponível');
  });

  it('mantém a formatação para timestamp ISO válido', () => {
    expect(formatarTimestampFila('2026-09-12T14:30:00.000Z')).not.toBe('Data indisponível');
  });
});
