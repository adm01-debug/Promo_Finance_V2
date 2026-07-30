import { describe, it, expect } from 'vitest';
import {
  calcularIndices,
  classificar,
  safeDiv,
  round2,
  variacao,
  formatarIndice,
  AGREGADOS_ZERO,
  type AgregadosContabeis,
} from '@/lib/contabil/indices';

const base: AgregadosContabeis = {
  ...AGREGADOS_ZERO,
  ativoTotal: 1000,
  ativoCirculante: 600,
  ativoNaoCirculante: 400,
  realizavelLp: 100,
  imobilizado: 300,
  disponibilidades: 150,
  clientes: 250,
  estoques: 200,
  passivoCirculante: 300,
  passivoNaoCirculante: 200,
  fornecedores: 120,
  patrimonioLiquido: 500,
  receitaBruta: 1100,
  deducoesReceita: 100,
  receitaLiquida: 1000,
  cmv: 600,
  lucroLiquido: 120,
  diasPeriodo: 30,
};

function valor(a: AgregadosContabeis, chave: string) {
  return calcularIndices(a).find((i) => i.chave === chave)?.valor ?? null;
}

describe('safeDiv / round2', () => {
  it('divide normalmente', () => expect(safeDiv(10, 4)).toBe(2.5));
  it('retorna null para divisor zero', () => expect(safeDiv(10, 0)).toBeNull());
  it('retorna null para divisor infinitesimal', () => expect(safeDiv(1, 1e-12)).toBeNull());
  it('retorna null para NaN', () => expect(safeDiv(Number.NaN, 2)).toBeNull());
  it('arredonda a duas casas', () => expect(round2(1.005)).toBe(1.01));
});

describe('classificar', () => {
  it('maior é melhor', () => {
    expect(classificar(2, { bom: 1.5, atencao: 1 })).toBe('bom');
    expect(classificar(1.2, { bom: 1.5, atencao: 1 })).toBe('atencao');
    expect(classificar(0.5, { bom: 1.5, atencao: 1 })).toBe('critico');
  });
  it('menor é melhor', () => {
    expect(classificar(30, { bom: 50, atencao: 70 }, false)).toBe('bom');
    expect(classificar(60, { bom: 50, atencao: 70 }, false)).toBe('atencao');
    expect(classificar(90, { bom: 50, atencao: 70 }, false)).toBe('critico');
  });
  it('null vira indefinido', () => expect(classificar(null, { bom: 1, atencao: 0 })).toBe('indefinido'));
});

describe('calcularIndices — caminho feliz', () => {
  const idx = calcularIndices(base);

  it('produz todos os indicadores sem NaN/Infinity', () => {
    expect(idx.length).toBeGreaterThanOrEqual(20);
    for (const i of idx) {
      if (i.valor !== null) expect(Number.isFinite(i.valor)).toBe(true);
    }
  });

  it('liquidez corrente = AC / PC', () => expect(valor(base, 'liquidez_corrente')).toBe(2));
  it('liquidez seca desconsidera estoques', () => expect(valor(base, 'liquidez_seca')).toBeCloseTo(1.33, 2));
  it('liquidez imediata usa disponibilidades', () => expect(valor(base, 'liquidez_imediata')).toBe(0.5));
  it('liquidez geral soma longo prazo', () => expect(valor(base, 'liquidez_geral')).toBe(1.4));
  it('endividamento geral em percentual', () => expect(valor(base, 'endividamento_geral')).toBe(50));
  it('composição do endividamento', () => expect(valor(base, 'composicao_endividamento')).toBe(60));
  it('imobilização do PL', () => expect(valor(base, 'imobilizacao_pl')).toBe(60));
  it('margem bruta', () => expect(valor(base, 'margem_bruta')).toBe(40));
  it('margem líquida', () => expect(valor(base, 'margem_liquida')).toBe(12));
  it('ROA', () => expect(valor(base, 'roa')).toBe(12));
  it('ROE', () => expect(valor(base, 'roe')).toBe(24));
  it('giro do ativo', () => expect(valor(base, 'giro_ativo')).toBe(1));
  it('PMR', () => expect(valor(base, 'pmr')).toBe(7.5));
  it('PMP', () => expect(valor(base, 'pmp')).toBe(6));
  it('PME', () => expect(valor(base, 'pme')).toBe(10));
  it('ciclo operacional = PME + PMR', () => expect(valor(base, 'ciclo_operacional')).toBe(17.5));
  it('ciclo financeiro = ciclo operacional - PMP', () =>
    expect(valor(base, 'ciclo_financeiro')).toBe(11.5));
  it('CCL', () => expect(valor(base, 'ccl')).toBe(300));
  it('NCG', () => expect(valor(base, 'ncg')).toBe(330));
  it('saldo em tesouraria = CCL - NCG', () => expect(valor(base, 'saldo_tesouraria')).toBe(-30));
});

describe('calcularIndices — divisores zero', () => {
  const vazio = { ...AGREGADOS_ZERO };
  const idx = calcularIndices(vazio);

  it('nunca retorna NaN ou Infinity', () => {
    for (const i of idx) {
      expect(i.valor === null || Number.isFinite(i.valor)).toBe(true);
      expect(Number.isNaN(i.valor as number)).toBe(false);
    }
  });

  it('índices de razão ficam indefinidos com motivo', () => {
    const lc = idx.find((i) => i.chave === 'liquidez_corrente');
    expect(lc?.valor).toBeNull();
    expect(lc?.faixa).toBe('indefinido');
    expect(lc?.motivo).toMatch(/zero/i);
  });

  it('índices absolutos permanecem calculáveis em zero', () => {
    expect(idx.find((i) => i.chave === 'ccl')?.valor).toBe(0);
  });

  it('receita zero não zera a margem — deixa indefinida', () => {
    expect(valor({ ...base, receitaLiquida: 0 }, 'margem_liquida')).toBeNull();
  });

  it('CMV zero deixa PME/PMP/ciclos indefinidos', () => {
    const a = { ...base, cmv: 0 };
    expect(valor(a, 'pme')).toBeNull();
    expect(valor(a, 'pmp')).toBeNull();
    expect(valor(a, 'ciclo_financeiro')).toBeNull();
  });
});

describe('calcularIndices — valores negativos', () => {
  const pl = { ...base, patrimonioLiquido: -200, lucroLiquido: -50 };

  it('PL negativo produz ROE negativo finito', () => {
    expect(valor(pl, 'roe')).toBe(25);
  });
  it('prejuízo produz margem negativa', () => {
    expect(valor(pl, 'margem_liquida')).toBe(-5);
  });
  it('CCL negativo é crítico', () => {
    const idx = calcularIndices({ ...base, ativoCirculante: 100 });
    expect(idx.find((i) => i.chave === 'ccl')?.faixa).toBe('critico');
  });
});

describe('variacao e formatação', () => {
  it('variação percentual', () => expect(variacao(120, 100)).toBe(20));
  it('variação com base negativa usa módulo', () => expect(variacao(-50, -100)).toBe(50));
  it('variação indefinida com base zero', () => expect(variacao(10, 0)).toBeNull());
  it('variação indefinida com null', () => expect(variacao(null, 10)).toBeNull());
  it('formata percentual', () => expect(formatarIndice(12.34, 'percentual')).toContain('%'));
  it('formata dias', () => expect(formatarIndice(7.5, 'dias')).toBe('8 d'));
  it('formata ausência de dado', () => expect(formatarIndice(null, 'indice')).toBe('—'));
});
