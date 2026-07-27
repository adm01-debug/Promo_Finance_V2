// Overlay monofásico: o catálogo `ncms` como fonte de verdade do enquadramento.
import { afterEach, describe, expect, it } from 'vitest';
import {
  aplicarOverlayMonofasico,
  descreverRejeicoesMonofasico,
} from '@/lib/tributario/monofasico/overlay-monofasico';
import {
  classificarNcmMonofasico,
  classificarNcmMonofasicoCanonico,
  definirOverrideMonofasico,
  resetarOverrideMonofasico,
} from '@/lib/tributario/monofasico/classificar';
import { calcularItemMonofasico } from '@/lib/tributario/monofasico/calcular';

afterEach(() => resetarOverrideMonofasico());

describe('aplicarOverlayMonofasico', () => {
  it('não gera override quando o banco confirma o catálogo embarcado', () => {
    const r = aplicarOverlayMonofasico([
      { codigo: '30041000', monofasico_pis_cofins: true },
      { codigo: '69120000', monofasico_pis_cofins: false },
    ]);
    expect(r.override).toEqual({});
    expect(r.inclusoes).toEqual([]);
    expect(r.exclusoes).toEqual([]);
  });

  it('registra inclusão de NCM não coberto pelo motor', () => {
    const r = aplicarOverlayMonofasico([
      { codigo: '69120000', descricao: 'Louça de mesa', monofasico_pis_cofins: true },
    ]);
    expect(r.override['69120000']).toBe(true);
    expect(r.inclusoes).toEqual([{ ncm: '69120000', descricao: 'Louça de mesa' }]);
  });

  it('registra exclusão de NCM classificado pelo motor', () => {
    const r = aplicarOverlayMonofasico([{ codigo: '30041000', monofasico_pis_cofins: false }]);
    expect(r.override['30041000']).toBe(false);
    expect(r.exclusoes[0]?.ncm).toBe('30041000');
  });

  it('rejeita código fora do formato de 8 dígitos e duplicados', () => {
    const r = aplicarOverlayMonofasico([
      { codigo: '2710', monofasico_pis_cofins: true },
      { codigo: '69120000', monofasico_pis_cofins: true },
      { codigo: '6912.00.00', monofasico_pis_cofins: false },
      { codigo: null, monofasico_pis_cofins: true },
    ]);
    expect(r.rejeitadas.map((x) => x.motivo)).toEqual(['codigo_invalido', 'duplicado', 'codigo_invalido']);
    expect(r.override['69120000']).toBe(true);
    expect(descreverRejeicoesMonofasico(r.rejeitadas)).toHaveLength(3);
  });

  it('é puro: entrada vazia ou nula não quebra', () => {
    expect(aplicarOverlayMonofasico([]).override).toEqual({});
  });
});

describe('classificador com override em runtime', () => {
  it('mantém a versão canônica intacta para as guardas de coerência', () => {
    definirOverrideMonofasico({ '30041000': false });
    expect(classificarNcmMonofasicoCanonico('30041000')).not.toBeNull();
    expect(classificarNcmMonofasico('30041000')).toBeNull();
  });

  it('classifica NCM incluído pelo banco no grupo genérico do catálogo', () => {
    definirOverrideMonofasico({ '69120000': true });
    const c = classificarNcmMonofasico('69120000');
    expect(c?.grupo.chave).toBe('CATALOGO_BANCO');
    expect(c?.grupo.industria).toBeUndefined();
  });

  it('não aplica override a códigos com menos de 8 dígitos', () => {
    definirOverrideMonofasico({ '69120000': true });
    expect(classificarNcmMonofasico('6912')).toBeNull();
  });

  it('reset restaura o comportamento canônico', () => {
    definirOverrideMonofasico({ '30041000': false });
    resetarOverrideMonofasico();
    expect(classificarNcmMonofasico('30041000')).not.toBeNull();
  });
});

describe('efeito no cálculo', () => {
  it('NCM excluído pelo catálogo volta ao regime normal', () => {
    definirOverrideMonofasico({ '30041000': false });
    const r = calcularItemMonofasico({ ncm: '3004.10.00', receita: 100000 }, 'revenda', 'real');
    expect(r.monofasico).toBe(false);
    expect(r.total).toBeCloseTo(100000 * (0.0165 + 0.076), 2);
  });

  it('NCM incluído pelo catálogo zera PIS/COFINS na revenda', () => {
    definirOverrideMonofasico({ '69120000': true });
    const r = calcularItemMonofasico({ ncm: '6912.00.00', receita: 100000 }, 'revenda', 'real');
    expect(r.monofasico).toBe(true);
    expect(r.total).toBe(0);
    expect(r.economia).toBeGreaterThan(0);
  });

  it('NCM incluído sem grupo legal alerta na indústria em vez de presumir alíquota', () => {
    definirOverrideMonofasico({ '69120000': true });
    const r = calcularItemMonofasico({ ncm: '6912.00.00', receita: 50000 }, 'industria', 'real');
    expect(r.alerta).toMatch(/sem alíquota de indústria/i);
    expect(r.total).toBe(0);
  });
});
