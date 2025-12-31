import { describe, it, expect } from 'vitest';

describe('Bitrix24 Integration', () => {
  it('deve buscar deals', async () => {
    const response = await fetch(process.env.BITRIX24_WEBHOOK + 'crm.deal.list');
    expect(response.ok).toBe(true);
  });
});
