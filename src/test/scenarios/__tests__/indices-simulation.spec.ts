/**
 * Simulação exaustiva do domínio `indices`.
 *
 * Gera centenas de balancetes sintéticos (PL negativo, receita zero, contas
 * ausentes, sinais invertidos, empresa sem movimento) e valida invariantes
 * antes de qualquer consumo do núcleo de índices em produção.
 */
import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { calcularIndices, classificar, type AgregadosContabeis } from '@/lib/contabil/indices';

type Perfil =
  | 'saudavel'
  | 'alavancada'
  | 'pl_negativo'
  | 'sem_movimento'
  | 'receita_zero'
  | 'contas_ausentes'
  | 'sinais_invertidos'
  | 'prejuizo';

const PERFIS: Perfil[] = [
  'saudavel',
  'alavancada',
  'pl_negativo',
  'sem_movimento',
  'receita_zero',
  'contas_ausentes',
  'sinais_invertidos',
  'prejuizo',
];

function gerar(perfil: Perfil, seed: number): AgregadosContabeis {
  const rng = createRng(seed);
  const v = (max: number) => Math.round(rng.next() * max * 100) / 100;

  const disponibilidades = v(50_000);
  const clientes = v(120_000);
  const estoques = v(90_000);
  const ativoCirculante = disponibilidades + clientes + estoques + v(20_000);
  const realizavelLp = v(40_000);
  const imobilizado = v(200_000);
  const ativoNaoCirculante = realizavelLp + imobilizado;
  const ativoTotal = ativoCirculante + ativoNaoCirculante;
  const fornecedores = v(80_000);
  const passivoCirculante = fornecedores + v(60_000);
  const passivoNaoCirculante = v(150_000);
  const receitaBruta = v(500_000);
  const deducoesReceita = receitaBruta * 0.1;
  const receitaLiquida = receitaBruta - deducoesReceita;
  const cmv = receitaLiquida * (0.4 + rng.next() * 0.4);

  const a: AgregadosContabeis = {
    ativoTotal,
    ativoCirculante,
    ativoNaoCirculante,
    realizavelLp,
    imobilizado,
    disponibilidades,
    clientes,
    estoques,
    passivoCirculante,
    passivoNaoCirculante,
    fornecedores,
    patrimonioLiquido: ativoTotal - passivoCirculante - passivoNaoCirculante,
    receitaBruta,
    deducoesReceita,
    receitaLiquida,
    cmv,
    lucroLiquido: receitaLiquida - cmv - v(80_000),
    diasPeriodo: rng.pick([28, 30, 31, 90, 180, 365]),
  };

  switch (perfil) {
    case 'alavancada':
      return { ...a, passivoCirculante: a.ativoTotal * 0.9, patrimonioLiquido: a.ativoTotal * 0.05 };
    case 'pl_negativo':
      return { ...a, patrimonioLiquido: -Math.abs(a.patrimonioLiquido) - 1 };
    case 'sem_movimento':
      return Object.fromEntries(
        Object.entries(a).map(([k, val]) => [k, k === 'diasPeriodo' ? val : 0]),
      ) as unknown as AgregadosContabeis;
    case 'receita_zero':
      return { ...a, receitaBruta: 0, deducoesReceita: 0, receitaLiquida: 0, cmv: 0, lucroLiquido: 0 };
    case 'contas_ausentes':
      return { ...a, estoques: 0, clientes: 0, fornecedores: 0, imobilizado: 0 };
    case 'sinais_invertidos':
      return { ...a, passivoCirculante: -a.passivoCirculante, estoques: -a.estoques };
    case 'prejuizo':
      return { ...a, lucroLiquido: -Math.abs(a.lucroLiquido) - 1000 };
    default:
      return a;
  }
}

describe('simulação de índices contábeis', () => {
  const CENARIOS = 480;
  const specs = Array.from({ length: CENARIOS }, (_, i) => ({
    id: `idx-${String(i).padStart(4, '0')}-${PERFIS[i % PERFIS.length]}`,
    perfil: PERFIS[i % PERFIS.length],
    seed: ((1337 + i * 2654435761) >>> 0) || 1,
  }));

  it(`executa ${CENARIOS} cenários sem NaN, Infinity ou exceção`, () => {
    const falhas: string[] = [];
    for (const spec of specs) {
      const agg = gerar(spec.perfil, spec.seed);
      let indices: ReturnType<typeof calcularIndices>;
      try {
        indices = calcularIndices(agg);
      } catch (e) {
        falhas.push(`${spec.id}: exceção ${(e as Error).message}`);
        continue;
      }
      for (const i of indices) {
        if (i.valor !== null && !Number.isFinite(i.valor)) {
          falhas.push(`${spec.id}: ${i.chave} = ${i.valor}`);
        }
        if (i.valor === null && i.faixa !== 'indefinido') {
          falhas.push(`${spec.id}: ${i.chave} sem valor mas faixa=${i.faixa}`);
        }
        if (i.valor === null && !i.motivo) {
          falhas.push(`${spec.id}: ${i.chave} indefinido sem motivo`);
        }
      }
    }
    expect(falhas.slice(0, 10)).toEqual([]);
  });

  it('empresa sem movimento não gera indicadores de razão zerados (usa "sem dados")', () => {
    const agg = gerar('sem_movimento', 7);
    const indices = calcularIndices(agg);
    const razoes = ['liquidez_corrente', 'roe', 'margem_liquida', 'pmr'];
    for (const chave of razoes) {
      const ind = indices.find((i) => i.chave === chave);
      expect(ind?.valor, chave).toBeNull();
      expect(ind?.motivo, chave).toBeTruthy();
    }
  });

  it('classificação é monotônica em relação ao valor', () => {
    const ordem = { critico: 0, atencao: 1, bom: 2, neutro: 1, indefinido: -1 } as const;
    let anterior = -1;
    for (let v = 0; v <= 4; v += 0.05) {
      const atual = ordem[classificar(v, { bom: 1.5, atencao: 1 })];
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });

  it('reconcilia Ativo = Passivo + PL nos cenários balanceados', () => {
    for (const spec of specs.filter((s) => s.perfil === 'saudavel' || s.perfil === 'prejuizo')) {
      const a = gerar(spec.perfil, spec.seed);
      const diff = a.ativoTotal - (a.passivoCirculante + a.passivoNaoCirculante + a.patrimonioLiquido);
      expect(Math.abs(diff), spec.id).toBeLessThan(0.01);
    }
  });

  it('é determinístico por seed', () => {
    const a = calcularIndices(gerar('saudavel', 99));
    const b = calcularIndices(gerar('saudavel', 99));
    expect(a).toEqual(b);
  });
});
