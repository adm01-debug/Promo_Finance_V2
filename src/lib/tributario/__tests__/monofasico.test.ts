import { describe, it, expect } from 'vitest';
import {
  classificarNcmMonofasico,
  isNcmMonofasico,
  normalizarNcm,
  calcularItemMonofasico,
  calcularMixMonofasico,
  calcularRecuperacaoRetroativa,
  GRUPOS_MONOFASICOS,
} from '@/lib/tributario/monofasico';
import { calcularLucroPresumido } from '@/lib/tributario/calculadora/lucro-presumido';

describe('normalizarNcm', () => {
  it('remove pontuação e limita a 8 dígitos', () => {
    expect(normalizarNcm('3004.10.00')).toBe('30041000');
    expect(normalizarNcm('2710.12.4')).toBe('2710124');
    expect(normalizarNcm('')).toBe('');
  });
});

describe('classificarNcmMonofasico', () => {
  it('classifica cerveja em BEBIDAS_FRIAS', () => {
    expect(classificarNcmMonofasico('22030000')?.grupo.chave).toBe('BEBIDAS_FRIAS');
  });

  it('classifica perfume em PERFUMARIA_COSMETICOS', () => {
    expect(classificarNcmMonofasico('33030010')?.grupo.chave).toBe('PERFUMARIA_COSMETICOS');
  });

  it('prioriza lista positiva sobre lista negativa no match exato', () => {
    expect(classificarNcmMonofasico('3004.10.00')?.grupo.chave).toBe('MEDICAMENTOS_LISTA_POSITIVA');
  });

  it('cai na lista negativa quando o NCM 3004 não está na positiva', () => {
    const r = classificarNcmMonofasico('3004.90.99');
    expect(r?.grupo.chave).toBe('MEDICAMENTOS_LISTA_NEGATIVA');
    expect(r?.origem).toBe('prefixo_grupo');
  });

  it('retorna null para NCM não monofásico', () => {
    expect(classificarNcmMonofasico('6912.00.00')).toBeNull();
    expect(isNcmMonofasico('6912.00.00')).toBe(false);
  });

  it('retorna null para NCM curto demais', () => {
    expect(classificarNcmMonofasico('271')).toBeNull();
  });

  it('todo grupo do catálogo tem alíquota de revenda definida', () => {
    for (const g of GRUPOS_MONOFASICOS) {
      expect(g.revenda).toBeDefined();
      expect(g.baseLegal.length).toBeGreaterThan(0);
    }
  });
});

describe('calcularItemMonofasico', () => {
  it('farmácia revendendo medicamento: PIS/COFINS zero', () => {
    const r = calcularItemMonofasico({ ncm: '3004.10.00', receita: 1_000_000 }, 'varejo', 'presumido');
    expect(r.monofasico).toBe(true);
    expect(r.pis).toBe(0);
    expect(r.cofins).toBe(0);
    expect(r.economia).toBe(36_500);
  });

  it('indústria de contraceptivo: 2,10% PIS + 9,80% COFINS', () => {
    const r = calcularItemMonofasico({ ncm: '3006.60.00', receita: 1_000_000 }, 'industria', 'real');
    expect(r.pis).toBe(21_000);
    expect(r.cofins).toBe(98_000);
    expect(r.total).toBe(119_000);
  });

  it('posto de gasolina (revenda): zero', () => {
    const r = calcularItemMonofasico({ ncm: '2710.12.4', receita: 500_000 }, 'varejo', 'presumido');
    expect(r.total).toBe(0);
  });

  it('distribuidora de perfume: zero', () => {
    const r = calcularItemMonofasico({ ncm: '3303.00.10', receita: 2_000_000 }, 'distribuidor', 'presumido');
    expect(r.total).toBe(0);
  });

  it('NCM não monofásico aplica regime presumido normal (3,65%)', () => {
    const r = calcularItemMonofasico({ ncm: '6912.00.00', receita: 100_000 }, 'industria', 'presumido');
    expect(r.monofasico).toBe(false);
    expect(r.total).toBe(3_650);
    expect(r.economia).toBe(0);
  });

  it('NCM não monofásico no Lucro Real aplica 9,25%', () => {
    const r = calcularItemMonofasico({ ncm: '6912.00.00', receita: 100_000 }, 'industria', 'real');
    expect(r.total).toBe(9_250);
  });

  it('posição inválida gera alerta e zera o tributo', () => {
    const r = calcularItemMonofasico(
      { ncm: '2203.00.00', receita: 1000, posicao: 'inexistente' as never },
      'varejo',
      'presumido',
    );
    expect(r.alerta).toContain('inválida');
    expect(r.total).toBe(0);
  });

  it('receita negativa ou inválida é tratada como zero', () => {
    expect(calcularItemMonofasico({ ncm: '2203.00.00', receita: -50 }, 'industria', 'real').total).toBe(0);
    expect(calcularItemMonofasico({ ncm: '2203.00.00', receita: NaN }, 'industria', 'real').total).toBe(0);
  });

  it('grupo sem alíquota de indústria alerta em vez de lançar erro', () => {
    const r = calcularItemMonofasico({ ncm: '2710.19.99', receita: 1000 }, 'industria', 'presumido');
    expect(r.monofasico).toBe(true);
    expect(r.alerta).toContain('sem alíquota de indústria');
  });
});

describe('calcularMixMonofasico', () => {
  it('separa receita monofásica da comum e apura economia', () => {
    const resumo = calcularMixMonofasico(
      [
        { ncm: '3004.10.00', receita: 1_000_000 },
        { ncm: '6912.00.00', receita: 500_000 },
      ],
      'varejo',
      'presumido',
    );
    expect(resumo.receitaTotal).toBe(1_500_000);
    expect(resumo.receitaMonofasica).toBe(1_000_000);
    expect(resumo.receitaNaoMonofasica).toBe(500_000);
    expect(resumo.totalMonofasico).toBe(0);
    expect(resumo.economiaAnual).toBe(36_500);
  });

  it('mix vazio devolve zeros sem erro', () => {
    const resumo = calcularMixMonofasico([], 'varejo', 'presumido');
    expect(resumo.receitaTotal).toBe(0);
    expect(resumo.economiaAnual).toBe(0);
    expect(resumo.itens).toHaveLength(0);
  });

  it('Simples Nacional alerta sobre segregação no PGDAS-D', () => {
    const resumo = calcularMixMonofasico([{ ncm: '2203.00.00', receita: 100_000 }], 'varejo', 'simples');
    expect(resumo.alertas.join(' ')).toContain('PGDAS-D');
  });

  it('nenhum valor retorna NaN ou Infinity', () => {
    const resumo = calcularMixMonofasico(
      [{ ncm: '', receita: 0 }, { ncm: '3004.10.00', receita: Number.POSITIVE_INFINITY }],
      'varejo',
      'real',
    );
    for (const v of [resumo.receitaTotal, resumo.totalMonofasico, resumo.economiaAnual]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe('calcularRecuperacaoRetroativa', () => {
  it('limita a 60 meses (art. 168 do CTN)', () => {
    const r = calcularRecuperacaoRetroativa(100_000, 'presumido', 120);
    expect(r.meses).toBe(60);
    expect(r.creditoMensalMedio).toBe(3_650);
    expect(r.totalRecuperavel).toBe(219_000);
  });

  it('receita zero devolve crédito zero', () => {
    expect(calcularRecuperacaoRetroativa(0).totalRecuperavel).toBe(0);
  });
});

describe('integração com o motor de Lucro Presumido', () => {
  const base = {
    receitas: { receitaBrutaAnual: 10_000_000, percentualServicos: 0 },
    atividade: 'comercio' as const,
    folha: { folhaAnual: 0 },
    estadualMunicipal: { aliquotaIcms: 0, aliquotaIss: 0 },
  };

  it('farmácia com 100% de receita monofásica não recolhe PIS/COFINS', () => {
    const semMono = calcularLucroPresumido(base);
    const comMono = calcularLucroPresumido({
      ...base,
      receitas: {
        ...base.receitas,
        monofasico: { posicaoPadrao: 'varejo', itens: [{ ncm: '3004.10.00', receita: 10_000_000 }] },
      },
    });

    const pisCofins = (r: typeof semMono) =>
      r.tributos.filter((t) => t.nome === 'PIS' || t.nome === 'COFINS').reduce((s, t) => s + t.valor, 0);

    expect(pisCofins(semMono)).toBeCloseTo(365_000, 2);
    expect(pisCofins(comMono)).toBe(0);
    expect(comMono.totalAPagar).toBeLessThan(semMono.totalAPagar);
  });

  it('receita monofásica maior que a receita líquida não gera base negativa', () => {
    const r = calcularLucroPresumido({
      ...base,
      receitas: {
        ...base.receitas,
        monofasico: { posicaoPadrao: 'varejo', itens: [{ ncm: '3004.10.00', receita: 99_000_000 }] },
      },
    });
    for (const t of r.tributos) expect(t.valor).toBeGreaterThanOrEqual(0);
  });
});
