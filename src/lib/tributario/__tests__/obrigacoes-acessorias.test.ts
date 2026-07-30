import { describe, expect, it } from 'vitest';
import { isDiaUtil } from '@/lib/tributario/darf/tabelas';
import {
  OBRIGACOES,
  buscarObrigacao,
  calcularMultaAtraso,
  calcularPrazo,
  chaveItem,
  competenciasAoRedor,
  enesimoDiaUtil,
  exportarCalendarioCsv,
  gerarCalendario,
  postergarDiaUtil,
  ultimoDiaUtil,
} from '@/lib/tributario/obrigacoes';

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('obrigações acessórias — dias úteis', () => {
  it('postergarDiaUtil pula fim de semana e feriado', () => {
    // 2025-01-01 é feriado (quarta) → 02/01
    expect(postergarDiaUtil(parse('2025-01-01')).toISOString().slice(0, 10)).toBe('2025-01-02');
    // 2025-03-08 é sábado → 10/03
    expect(postergarDiaUtil(parse('2025-03-08')).toISOString().slice(0, 10)).toBe('2025-03-10');
  });

  it('enesimoDiaUtil retorna sempre um dia útil dentro do mês', () => {
    for (let ano = 2024; ano <= 2027; ano += 1) {
      for (let mes = 1; mes <= 12; mes += 1) {
        for (let n = 1; n <= 10; n += 1) {
          const d = enesimoDiaUtil(ano, mes, n);
          expect(isDiaUtil(d)).toBe(true);
          expect(d.getUTCFullYear()).toBe(ano);
          expect(d.getUTCMonth() + 1).toBe(mes);
        }
      }
    }
  });

  it('enesimoDiaUtil é monotônico crescente', () => {
    for (let mes = 1; mes <= 12; mes += 1) {
      let anterior = 0;
      for (let n = 1; n <= 10; n += 1) {
        const dia = enesimoDiaUtil(2026, mes, n).getUTCDate();
        expect(dia).toBeGreaterThan(anterior);
        anterior = dia;
      }
    }
  });

  it('ultimoDiaUtil nunca cai em fim de semana ou feriado', () => {
    for (let ano = 2024; ano <= 2030; ano += 1) {
      for (let mes = 1; mes <= 12; mes += 1) {
        expect(isDiaUtil(ultimoDiaUtil(ano, mes))).toBe(true);
      }
    }
  });

  it('rejeita n inválido', () => {
    expect(() => enesimoDiaUtil(2026, 1, 0)).toThrow();
  });
});

describe('cálculo de prazos — simulação massiva', () => {
  const competencias = competenciasAoRedor('2026-01', 24, 24);

  it('gera 49 competências ao redor da base', () => {
    expect(competencias).toHaveLength(49);
    expect(competencias[0]).toBe('2024-01');
    expect(competencias.at(-1)).toBe('2028-01');
  });

  it('todo prazo é uma data válida, posterior à competência e em dia útil quando exigido', () => {
    let total = 0;
    for (const obrigacao of OBRIGACOES) {
      for (const comp of competencias) {
        const chave = obrigacao.periodicidade === 'anual' ? comp.slice(0, 4) : comp;
        const prazo = calcularPrazo(obrigacao, chave);
        total += 1;
        expect(prazo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(prazo.slice(0, 7) >= comp.slice(0, 7)).toBe(true);
        expect(isDiaUtil(parse(prazo))).toBe(true);
      }
    }
    expect(total).toBe(OBRIGACOES.length * competencias.length);
  });

  it('EFD-Contribuições vence no 10º dia útil do 2º mês subsequente', () => {
    const efd = buscarObrigacao('efd_contribuicoes')!;
    expect(calcularPrazo(efd, '2026-01')).toBe(
      enesimoDiaUtil(2026, 3, 10).toISOString().slice(0, 10),
    );
    expect(calcularPrazo(efd, '2026-11')).toBe(
      enesimoDiaUtil(2027, 1, 10).toISOString().slice(0, 10),
    );
  });

  it('DCTFWeb antecipa o dia 15 quando não é dia útil', () => {
    const dctf = buscarObrigacao('dctfweb')!;
    // competência 2026-01 → 15/02/2026 é domingo → antecipa para 13/02 (sexta)
    expect(calcularPrazo(dctf, '2026-01')).toBe('2026-02-13');
  });

  it('EFD ICMS/IPI posterga o dia 20 quando não é dia útil', () => {
    const efd = buscarObrigacao('efd_icms_ipi')!;
    // competência 2026-05 → 20/06/2026 é sábado → posterga para 22/06
    expect(calcularPrazo(efd, '2026-05')).toBe('2026-06-22');
  });

  it('ECD e ECF usam último dia útil de maio/julho do ano seguinte', () => {
    expect(calcularPrazo(buscarObrigacao('ecd')!, '2025')).toBe(
      ultimoDiaUtil(2026, 5).toISOString().slice(0, 10),
    );
    expect(calcularPrazo(buscarObrigacao('ecf')!, '2025')).toBe(
      ultimoDiaUtil(2026, 7).toISOString().slice(0, 10),
    );
  });

  it('rejeita competência inválida', () => {
    expect(() => calcularPrazo(buscarObrigacao('dctfweb')!, '2026-13')).toThrow();
    expect(() => calcularPrazo(buscarObrigacao('ecd')!, 'abcd')).toThrow();
  });
});

describe('geração do calendário', () => {
  const hoje = '2026-03-10';

  it('filtra por regime tributário', () => {
    const simples = gerarCalendario({ competencias: ['2026-01'], regime: 'simples', hoje });
    const ids = new Set(simples.map((i) => i.obrigacaoId));
    expect(ids.has('darf_das')).toBe(true);
    expect(ids.has('efd_contribuicoes')).toBe(false);

    const real = gerarCalendario({ competencias: ['2026-01'], regime: 'real', hoje });
    const idsReal = new Set(real.map((i) => i.obrigacaoId));
    expect(idsReal.has('efd_contribuicoes')).toBe(true);
    expect(idsReal.has('darf_das')).toBe(false);
    // obrigações "todos" aparecem em ambos
    expect(ids.has('dctfweb') && idsReal.has('dctfweb')).toBe(true);
  });

  it('deduplica obrigações anuais em competências do mesmo exercício', () => {
    const itens = gerarCalendario({
      competencias: competenciasAoRedor('2026-06', 5, 5),
      regime: 'real',
      hoje,
    });
    const ecd = itens.filter((i) => i.obrigacaoId === 'ecd');
    expect(ecd).toHaveLength(1);
    expect(ecd[0].competencia).toBe('2026');
  });

  it('ordena por prazo crescente', () => {
    const itens = gerarCalendario({
      competencias: competenciasAoRedor('2026-01', 6, 6),
      regime: 'todos',
      hoje,
    });
    for (let i = 1; i < itens.length; i += 1) {
      expect(itens[i - 1].prazo <= itens[i].prazo).toBe(true);
    }
  });

  it('classifica situações de forma coerente com a data de referência', () => {
    const itens = gerarCalendario({
      competencias: competenciasAoRedor('2026-01', 12, 12),
      regime: 'todos',
      hoje,
      entregues: new Set([chaveItem('dctfweb', '2025-12')]),
    });
    expect(itens.some((i) => i.situacao === 'entregue')).toBe(true);
    for (const item of itens) {
      if (item.situacao === 'entregue') continue;
      if (item.diasRestantes < 0) expect(item.situacao).toBe('vencida');
      else if (item.diasRestantes === 0) expect(item.situacao).toBe('vence_hoje');
      else if (item.diasRestantes <= 7) expect(item.situacao).toBe('proxima');
      else expect(item.situacao).toBe('futura');
    }
  });

  it('respeita o filtro "somente" e ignora competências malformadas', () => {
    const itens = gerarCalendario({
      competencias: ['2026-01', 'xx', '2026/02'],
      regime: 'todos',
      hoje,
      somente: ['dctfweb'],
    });
    expect(itens).toHaveLength(1);
    expect(itens[0].obrigacaoId).toBe('dctfweb');
  });

  it('exporta CSV com cabeçalho e uma linha por item', () => {
    const itens = gerarCalendario({ competencias: ['2026-01'], regime: 'real', hoje });
    const csv = exportarCalendarioCsv(itens).split('\n');
    expect(csv[0]).toContain('obrigacao;orgao;competencia');
    expect(csv).toHaveLength(itens.length + 1);
    expect(csv.every((l) => l.split(';').length === 7)).toBe(true);
  });
});

describe('multa por atraso na entrega', () => {
  it('não há multa quando entregue no prazo ou antes', () => {
    const m = calcularMultaAtraso({
      obrigacaoId: 'dctfweb',
      prazo: '2026-02-13',
      dataEntrega: '2026-02-10',
      baseCalculo: 100_000,
    });
    expect(m.valorDevido).toBe(0);
    expect(m.diasAtraso).toBe(0);
  });

  it('aplica 2% ao mês ou fração sobre tributos declarados', () => {
    const m = calcularMultaAtraso({
      obrigacaoId: 'dctfweb',
      prazo: '2026-02-13',
      dataEntrega: '2026-03-20',
      baseCalculo: 100_000,
    });
    expect(m.mesesAtraso).toBe(2);
    expect(m.percentual).toBeCloseTo(0.04, 10);
    expect(m.valorDevido).toBe(4000);
  });

  it('respeita o teto de 20%', () => {
    const m = calcularMultaAtraso({
      obrigacaoId: 'dctfweb',
      prazo: '2026-01-15',
      dataEntrega: '2028-01-15',
      baseCalculo: 100_000,
    });
    expect(m.aplicouTeto).toBe(true);
    expect(m.valorDevido).toBe(20_000);
  });

  it('aplica o piso quando o cálculo percentual é irrisório', () => {
    const m = calcularMultaAtraso({
      obrigacaoId: 'efd_contribuicoes',
      prazo: '2026-03-13',
      dataEntrega: '2026-03-20',
      baseCalculo: 1_000,
    });
    expect(m.aplicouPiso).toBe(true);
    expect(m.valorDevido).toBe(500);
  });

  it('obrigações de multa fixa retornam sempre o valor mínimo', () => {
    const m = calcularMultaAtraso({
      obrigacaoId: 'defis',
      prazo: '2026-03-31',
      dataEntrega: '2027-03-31',
    });
    expect(m.valorDevido).toBe(200);
    expect(m.percentual).toBe(0);
  });

  it('monotonicidade e limites em 500 cenários determinísticos', () => {
    const ids = OBRIGACOES.map((o) => o.id);
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 500; i += 1) {
      const obrigacao = OBRIGACOES[Math.floor(rnd() * ids.length)];
      const base = Math.round(rnd() * 5_000_000);
      const atrasoA = 1 + Math.floor(rnd() * 300);
      const atrasoB = atrasoA + 1 + Math.floor(rnd() * 300);
      const prazo = '2026-02-13';
      const entrega = (dias: number) =>
        new Date(Date.parse(`${prazo}T00:00:00Z`) + dias * 86_400_000)
          .toISOString()
          .slice(0, 10);

      const a = calcularMultaAtraso({
        obrigacaoId: obrigacao.id,
        prazo,
        dataEntrega: entrega(atrasoA),
        baseCalculo: base,
      });
      const b = calcularMultaAtraso({
        obrigacaoId: obrigacao.id,
        prazo,
        dataEntrega: entrega(atrasoB),
        baseCalculo: base,
      });

      expect(b.valorDevido).toBeGreaterThanOrEqual(a.valorDevido);
      expect(a.valorDevido).toBeGreaterThanOrEqual(0);
      expect(a.percentual).toBeLessThanOrEqual(obrigacao.multaTeto);
      if (obrigacao.multaMensal > 0 && base > 0) {
        expect(a.valorDevido).toBeGreaterThanOrEqual(
          Math.min(obrigacao.multaMinima, obrigacao.multaTeto * base) - 0.01,
        );
      }
      expect(Number.isFinite(a.valorDevido)).toBe(true);
    }
  });

  it('rejeita obrigação inexistente', () => {
    expect(() =>
      calcularMultaAtraso({ obrigacaoId: 'inexistente', prazo: '2026-01-01', dataEntrega: '2026-02-01' }),
    ).toThrow();
  });
});

describe('integridade do catálogo', () => {
  it('ids são únicos e campos obrigatórios preenchidos', () => {
    const ids = new Set<string>();
    for (const o of OBRIGACOES) {
      expect(ids.has(o.id)).toBe(false);
      ids.add(o.id);
      expect(o.nome.length).toBeGreaterThan(2);
      expect(o.baseLegal.length).toBeGreaterThan(5);
      expect(o.regimes.length).toBeGreaterThan(0);
      expect(o.multaTeto).toBeGreaterThanOrEqual(o.multaMensal);
      expect(o.multaMinima).toBeGreaterThanOrEqual(0);
    }
  });
});
