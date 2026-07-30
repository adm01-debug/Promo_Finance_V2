import { describe, it, expect } from 'vitest';
import * as api from '@/lib/sped-generator';

describe('sped-generator — regressão de API pública', () => {
  it('preserva exports históricos após modularização', () => {
    expect(typeof api.gerarEFD_IBS_CBS).toBe('function');
    expect(typeof api.gerarEFD_Contribuicoes).toBe('function');
    expect(typeof api.downloadArquivoSPED).toBe('function');
    expect(typeof api.validarArquivoSPED).toBe('function');
  });

  it('validarArquivoSPED rejeita conteúdo inválido', () => {
    const r = api.validarArquivoSPED('lixo');
    expect(r.valido).toBe(false);
    expect(r.erros.length).toBeGreaterThan(0);
  });
});
