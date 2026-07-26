import { describe, expect, it } from 'vitest';
import {
  CODIGOS_RECEITA,
  MULTA_MORA_TETO,
  VALOR_MINIMO_DARF,
  anteciparDiaUtil,
  calcularAcrescimos,
  calcularVencimento,
  consolidarDarf,
  exportarDarfCsv,
  isDiaUtil,
  parsePeriodo,
  selicAcumulada,
  somarMeses,
} from '../darf';

const periodos = Array.from({ length: 24 }, (_, i) => somarMeses('2024-01', i));

describe('darf/tabelas — calendário', () => {
  it('reconhece fins de semana e feriados nacionais', () => {
    expect(isDiaUtil(new Date('2025-01-01T00:00:00Z'))).toBe(false); // confraternização
    expect(isDiaUtil(new Date('2025-04-18T00:00:00Z'))).toBe(false); // sexta-feira santa
    expect(isDiaUtil(new Date('2025-03-04T00:00:00Z'))).toBe(false); // carnaval (terça)
    expect(isDiaUtil(new Date('2025-06-19T00:00:00Z'))).toBe(false); // corpus christi
    expect(isDiaUtil(new Date('2025-01-04T00:00:00Z'))).toBe(false); // sábado
    expect(isDiaUtil(new Date('2025-01-02T00:00:00Z'))).toBe(true);
  });

  it('antecipa sempre para um dia útil', () => {
    for (let i = 0; i < 400; i += 1) {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      const ant = anteciparDiaUtil(d);
      expect(isDiaUtil(ant)).toBe(true);
      expect(ant.getTime()).toBeLessThanOrEqual(d.getTime());
    }
  });

  it('não possui códigos de receita duplicados', () => {
    const set = new Set(CODIGOS_RECEITA.map((c) => c.codigo));
    expect(set.size).toBe(CODIGOS_RECEITA.length);
  });
});

describe('darf/vencimento — 24 competências x todos os códigos', () => {
  it('gera vencimento útil, no mês seguinte e coerente com a regra', () => {
    for (const periodo of periodos) {
      for (const cod of CODIGOS_RECEITA) {
        const venc = calcularVencimento(periodo, cod.regraVencimento);
        const data = new Date(`${venc}T00:00:00Z`);
        expect(isDiaUtil(data)).toBe(true);
        expect(venc.slice(0, 7)).toBe(somarMeses(periodo, 1));
        const dia = data.getUTCDate();
        if (cod.regraVencimento === 'dia_25_mes_seguinte') expect(dia).toBeLessThanOrEqual(25);
        if (cod.regraVencimento === 'dia_20_mes_seguinte') expect(dia).toBeLessThanOrEqual(20);
        if (cod.regraVencimento === 'ultimo_dia_util_mes_seguinte') expect(dia).toBeGreaterThan(24);
      }
    }
  });

  it('rejeita períodos malformados', () => {
    expect(() => parsePeriodo('2024/01')).toThrow();
    expect(() => parsePeriodo('2024-13')).toThrow();
  });
});

describe('darf/acrescimos — grade de 300 cenários de atraso', () => {
  const principais = [10, 137.42, 1000, 25_000, 1_250_000];
  const atrasos = [0, 1, 5, 15, 30, 61, 100, 200, 365, 900];

  it('respeita teto de multa, monotonicidade e não negatividade', () => {
    for (const principal of principais) {
      let anterior = -1;
      for (const dias of atrasos) {
        for (const selic of [0, 0.0089, 0.011]) {
          const vencimento = '2024-03-20';
          const pagamento = new Date(Date.parse(`${vencimento}T00:00:00Z`) + dias * 86_400_000)
            .toISOString()
            .slice(0, 10);
          const a = calcularAcrescimos({
            principal,
            vencimento,
            dataPagamento: pagamento,
            selicPadraoMensal: selic,
          });
          expect(a.multaMora).toBeGreaterThanOrEqual(0);
          expect(a.juros).toBeGreaterThanOrEqual(0);
          expect(a.percentualMulta).toBeLessThanOrEqual(MULTA_MORA_TETO + 1e-12);
          expect(a.diasAtraso).toBe(dias);
          if (dias === 0) {
            expect(a.multaMora).toBe(0);
            expect(a.juros).toBe(0);
          }
          if (selic === 0.0089 && dias >= anterior) anterior = dias;
        }
      }
    }
  });

  it('multa atinge exatamente o teto a partir de 61 dias', () => {
    const a = calcularAcrescimos({
      principal: 1000,
      vencimento: '2024-01-22',
      dataPagamento: '2024-03-23',
    });
    expect(a.percentualMulta).toBeCloseTo(0.2, 10);
    expect(a.multaMora).toBeCloseTo(200, 2);
  });

  it('juros mínimos de 1% no mês do vencimento', () => {
    expect(selicAcumulada('2024-01-22', '2024-01-30')).toBeCloseTo(0.01, 10);
    expect(selicAcumulada('2024-01-22', '2024-04-10', {}, 0.01)).toBeCloseTo(0.03, 10);
  });
});

describe('darf/consolidar — regras de agregação', () => {
  it('soma débitos do mesmo código e competência', () => {
    const r = consolidarDarf({
      debitos: [
        { codigo: '5856', periodoApuracao: '2024-05', principal: 1000, origem: 'PIS/COFINS' },
        { codigo: '5856', periodoApuracao: '2024-05', principal: 500, origem: 'Ajuste' },
      ],
    });
    expect(r.darfs).toHaveLength(1);
    expect(r.darfs[0].principal).toBe(1500);
    expect(r.darfs[0].origens).toEqual(['PIS/COFINS', 'Ajuste']);
    expect(r.totalGeral).toBe(1500);
  });

  it('difere DARF abaixo de R$ 10,00 para a competência seguinte', () => {
    const r = consolidarDarf({
      debitos: [
        { codigo: '8109', periodoApuracao: '2024-01', principal: 4 },
        { codigo: '8109', periodoApuracao: '2024-02', principal: 4 },
        { codigo: '8109', periodoApuracao: '2024-03', principal: 50 },
      ],
    });
    expect(r.darfs).toHaveLength(1);
    expect(r.darfs[0].periodoApuracao).toBe('2024-03');
    expect(r.darfs[0].principal).toBe(58);
    expect(r.darfs[0].principalAcumulado).toBe(8);
    expect(r.diferidos).toHaveLength(0);
  });

  it('mantém como diferido quando não há competência posterior', () => {
    const r = consolidarDarf({
      debitos: [{ codigo: '8109', periodoApuracao: '2024-01', principal: 3.5 }],
    });
    expect(r.darfs).toHaveLength(0);
    expect(r.diferidos).toHaveLength(1);
    expect(r.diferidos[0].total).toBe(3.5);
  });

  it('ignora valores inválidos ou não positivos', () => {
    const r = consolidarDarf({
      debitos: [
        { codigo: '2172', periodoApuracao: '2024-04', principal: 0 },
        { codigo: '2172', periodoApuracao: '2024-04', principal: -100 },
        { codigo: '2172', periodoApuracao: '2024-04', principal: Number.NaN },
        { codigo: '2172', periodoApuracao: '2024-04', principal: 900 },
      ],
    });
    expect(r.darfs).toHaveLength(1);
    expect(r.darfs[0].principal).toBe(900);
  });

  it('sinaliza código não catalogado sem quebrar', () => {
    const r = consolidarDarf({
      debitos: [{ codigo: '9999', periodoApuracao: '2024-06', principal: 100 }],
    });
    expect(r.darfs[0].observacoes.join(' ')).toContain('não catalogado');
  });

  it('parcela IRPJ trimestral em 3 quotas com juros progressivos', () => {
    const r = consolidarDarf({
      debitos: [{ codigo: '0220', periodoApuracao: '2024-03', principal: 30_000 }],
      parcelarEmQuotas: true,
    });
    const darf = r.darfs[0];
    expect(darf.quotas).toHaveLength(3);
    expect(darf.quotas[0].jurosSelic).toBe(0);
    expect(darf.quotas[2].jurosSelic).toBeGreaterThan(darf.quotas[1].jurosSelic);
    const somaPrincipal = darf.quotas.reduce((s, q) => s + q.principal, 0);
    expect(somaPrincipal).toBeCloseTo(30_000, 2);
  });

  it('não parcela quando a quota mínima de R$ 1.000 não é atingida', () => {
    const r = consolidarDarf({
      debitos: [{ codigo: '0220', periodoApuracao: '2024-03', principal: 1500 }],
      parcelarEmQuotas: true,
    });
    expect(r.darfs[0].quotas).toHaveLength(0);
    expect(r.darfs[0].observacoes.join(' ')).toContain('cota única');
  });

  it('ordena por vencimento e exporta CSV consistente', () => {
    const r = consolidarDarf({
      debitos: [
        { codigo: '0220', periodoApuracao: '2024-06', principal: 5000 },
        { codigo: '0561', periodoApuracao: '2024-06', principal: 2000 },
        { codigo: '5856', periodoApuracao: '2024-06', principal: 3000 },
      ],
    });
    const vencs = r.darfs.map((d) => d.vencimento);
    expect([...vencs].sort()).toEqual(vencs);
    const csv = exportarDarfCsv(r);
    expect(csv.split('\n')).toHaveLength(4);
    expect(csv.startsWith('codigo;tributo')).toBe(true);
  });
});

describe('darf/consolidar — simulação combinatória massiva', () => {
  it('mantém invariantes em 24 competências x 15 códigos x 3 atrasos', () => {
    let executados = 0;
    for (const periodo of periodos) {
      for (const cod of CODIGOS_RECEITA) {
        for (const offset of [0, 45, 400]) {
          const principal = 250 + (periodo.charCodeAt(6) % 7) * 137.77;
          const venc = calcularVencimento(periodo, cod.regraVencimento);
          const pagamento = new Date(Date.parse(`${venc}T00:00:00Z`) + offset * 86_400_000)
            .toISOString()
            .slice(0, 10);
          const r = consolidarDarf({
            debitos: [{ codigo: cod.codigo, periodoApuracao: periodo, principal }],
            dataPagamento: pagamento,
            parcelarEmQuotas: true,
          });
          expect(r.darfs).toHaveLength(1);
          const d = r.darfs[0];
          expect(d.total).toBeGreaterThanOrEqual(d.principal);
          expect(d.principal).toBeGreaterThanOrEqual(VALOR_MINIMO_DARF);
          expect(d.acrescimos.percentualMulta).toBeLessThanOrEqual(MULTA_MORA_TETO + 1e-12);
          expect(r.totalGeral).toBeCloseTo(r.totalPrincipal + r.totalAcrescimos, 2);
          if (offset === 0) expect(d.total).toBe(d.principal);
          executados += 1;
        }
      }
    }
    expect(executados).toBe(periodos.length * CODIGOS_RECEITA.length * 3);
  });

  it('conserva o somatório de principal em carteiras aleatórias determinísticas', () => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let caso = 0; caso < 120; caso += 1) {
      const debitos = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => ({
        codigo: CODIGOS_RECEITA[Math.floor(rnd() * CODIGOS_RECEITA.length)].codigo,
        periodoApuracao: periodos[Math.floor(rnd() * periodos.length)],
        principal: Math.round(rnd() * 500_000) / 100 + 50,
      }));
      const esperado = debitos.reduce((s, d) => s + d.principal, 0);
      const r = consolidarDarf({ debitos });
      const obtido =
        r.darfs.reduce((s, d) => s + d.principal, 0) +
        r.diferidos.reduce((s, d) => s + d.principal, 0);
      expect(obtido).toBeCloseTo(esperado, 1);
    }
  });
});
