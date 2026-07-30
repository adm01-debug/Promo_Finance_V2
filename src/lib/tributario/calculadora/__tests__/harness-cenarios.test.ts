// Harness: 200 cenários aleatórios validando invariantes do motor tributário
import { describe, it, expect } from 'vitest';
import { calcularTodosRegimes, type InputCalculadora } from '@/lib/tributario/calculadora';

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function gerarCenario(): InputCalculadora {
  const receita = rand(100_000, 50_000_000);
  const percServ = rand(0, 100);
  const folha = rand(0, receita * 0.5);
  const creditos = rand(0, receita * 0.6);
  const receitas = { receitaBrutaAnual: receita, percentualServicos: percServ };
  const folhaCfg = { folhaAnual: folha, aliquotaRat: 0.02, aliquotaTerceiros: 0.058 };
  const em = { aliquotaIcms: 0.18, aliquotaIss: 0.05, creditoIcmsCompras: creditos * 0.3 };
  return {
    lucroReal: {
      receitas, folha: folhaCfg, estadualMunicipal: em,
      lucroContabil: rand(-100_000, receita * 0.4),
      lalur: { adicoesOutras: rand(0, 50_000), exclusoesOutras: rand(0, 30_000) },
      prejuizoAcumulado: rand(0, 500_000),
      csllAliquotaFinanceira: false,
      creditosPisCofins: { insumos: creditos },
      modo: 'anual_estimativa',
    },
    lucroPresumido: {
      receitas, folha: folhaCfg, estadualMunicipal: em,
      atividade: pick(['comercio', 'industria', 'servicos_geral', 'transporte_cargas'] as const),
    },
    simples: {
      receitas,
      anexo: pick(['I', 'II', 'III', 'V'] as const),
      rbt12: receita,
      folha12m: folha,
    },
    reforma: {
      receitas,
      anoReferencia: pick([2026, 2028, 2030, 2033]),
      categoriaImpostoSeletivo: 'nenhum',
    },
  };
}

describe('Harness — 200 cenários aleatórios da Calculadora', () => {
  const N = 200;
  const seeds = Array.from({ length: N }, (_, i) => i);

  it.each(seeds)('cenário #%i respeita invariantes', () => {
    const input = gerarCenario();
    const r = calcularTodosRegimes(input);

    // 1. Sempre retorna 4 cenários
    expect(r.cenarios.length).toBe(4);

    for (const c of r.cenarios) {
      // 2. Totais nunca negativos
      expect(c.totalTributos).toBeGreaterThanOrEqual(0);
      expect(c.totalAPagar).toBeGreaterThanOrEqual(0);
      // 3. Carga efetiva ∈ [0, 200%]
      expect(c.cargaEfetiva).toBeGreaterThanOrEqual(0);
      expect(c.cargaEfetiva).toBeLessThan(200);
      // 4. Cada tributo individual ≥ 0
      for (const t of c.tributos) expect(t.valor).toBeGreaterThanOrEqual(0);
      // 5. Retenções nunca deixam totalAPagar negativo
      expect(c.totalAPagar).toBe(Math.max(0, c.totalTributos - c.retencoesCompensadas));
      // 6. Memória sempre ordenada 1..N
      c.memoria.forEach((l, i) => expect(l.ordem).toBe(i + 1));
    }

    // 7. Simples inelegível se RBT12 > 4.8mi
    const s = r.cenarios.find((c) => c.regime === 'simples_nacional')!;
    if (input.simples!.rbt12 > 4_800_000) expect(s.elegivel).toBe(false);

    // 8. Presumido inelegível se receita > 78mi
    const p = r.cenarios.find((c) => c.regime === 'lucro_presumido')!;
    if (input.lucroPresumido!.receitas.receitaBrutaAnual > 78_000_000) expect(p.elegivel).toBe(false);

    // 9. Melhor cenário existe se há pelo menos 1 elegível
    const elegiveis = r.cenarios.filter((c) => c.elegivel && c.regime !== 'reforma');
    if (elegiveis.length > 0) expect(r.melhorCenario).not.toBeNull();

    // 10. Economia sempre ≥ 0
    expect(r.economiaAnualVsPior).toBeGreaterThanOrEqual(0);
  });
});
