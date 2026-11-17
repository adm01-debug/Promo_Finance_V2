import { describe, it, expect } from 'vitest';
import {
  computeBalanceteTotais,
  filterBalancete,
  round2,
  splitSaldo,
  type BalanceteRow,
} from '../balancete-utils';

function row(partial: Partial<BalanceteRow> & { codigo: string }): BalanceteRow {
  return {
    conta_id: partial.codigo,
    nome: partial.nome ?? `Conta ${partial.codigo}`,
    tipo: partial.tipo ?? 'ativo',
    natureza: partial.natureza ?? 'devedora',
    nivel: partial.nivel ?? 1,
    aceita_lancamento: partial.aceita_lancamento ?? true,
    saldo_anterior: partial.saldo_anterior ?? 0,
    debitos: partial.debitos ?? 0,
    creditos: partial.creditos ?? 0,
    saldo_final: partial.saldo_final ?? 0,
    codigo: partial.codigo,
  };
}

describe('round2', () => {
  it('elimina ruído de ponto flutuante', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
  });
});

describe('splitSaldo', () => {
  it('classifica saldo positivo como devedor', () => {
    expect(splitSaldo(150.5)).toEqual({ devedor: 150.5, credor: 0 });
  });

  it('classifica saldo negativo como credor em valor absoluto', () => {
    expect(splitSaldo(-90)).toEqual({ devedor: 0, credor: 90 });
  });

  it('zera ambos quando o saldo é nulo', () => {
    expect(splitSaldo(0)).toEqual({ devedor: 0, credor: 0 });
  });
});

describe('computeBalanceteTotais', () => {
  it('ignora contas sintéticas para não duplicar valores', () => {
    const rows = [
      row({ codigo: '1', aceita_lancamento: false, debitos: 300, saldo_final: 1300 }),
      row({ codigo: '1.1', debitos: 300, saldo_final: 300 }),
      row({ codigo: '3', creditos: 300, saldo_final: -300 }),
    ];
    const t = computeBalanceteTotais(rows);
    expect(t.debitos).toBe(300);
    expect(t.creditos).toBe(300);
    expect(t.contas).toBe(2);
  });

  it('acusa desbalanceamento entre débitos e créditos', () => {
    const t = computeBalanceteTotais([
      row({ codigo: '1.1', debitos: 100 }),
      row({ codigo: '3', creditos: 90 }),
    ]);
    expect(t.balanceado).toBe(false);
    expect(t.diferenca).toBe(10);
  });

  it('considera balanceado dentro da tolerância de arredondamento', () => {
    const t = computeBalanceteTotais([
      row({ codigo: '1.1', debitos: 100.001 }),
      row({ codigo: '3', creditos: 100 }),
    ]);
    expect(t.balanceado).toBe(true);
  });

  it('separa saldos devedores e credores', () => {
    const t = computeBalanceteTotais([
      row({ codigo: '1.1', saldo_final: 1000 }),
      row({ codigo: '3', saldo_final: -400 }),
    ]);
    expect(t.saldoDevedor).toBe(1000);
    expect(t.saldoCredor).toBe(400);
  });

  it('retorna zeros para período sem lançamentos', () => {
    const t = computeBalanceteTotais([]);
    expect(t).toMatchObject({ debitos: 0, creditos: 0, diferenca: 0, balanceado: true, contas: 0 });
  });
});

describe('filterBalancete', () => {
  const rows = [
    row({ codigo: '1', nivel: 1, aceita_lancamento: false, saldo_final: 100 }),
    row({ codigo: '1.1', nivel: 2, debitos: 100, saldo_final: 100 }),
    row({ codigo: '1.2', nivel: 2, nome: 'Bancos conta movimento' }),
  ];

  it('respeita o nível máximo', () => {
    expect(filterBalancete(rows, { nivelMax: 1 }).map((r) => r.codigo)).toEqual(['1']);
  });

  it('oculta contas totalmente zeradas quando solicitado', () => {
    expect(filterBalancete(rows, { apenasComMovimento: true }).map((r) => r.codigo)).toEqual([
      '1',
      '1.1',
    ]);
  });

  it('busca por código ou nome, sem diferenciar maiúsculas', () => {
    expect(filterBalancete(rows, { busca: 'BANCOS' }).map((r) => r.codigo)).toEqual(['1.2']);
    expect(filterBalancete(rows, { busca: '1.1' }).map((r) => r.codigo)).toEqual(['1.1']);
  });

  it('sem opções devolve tudo', () => {
    expect(filterBalancete(rows)).toHaveLength(3);
  });
});

/**
 * Achado F09: `Number(x) || 0` transformava NaN/Infinity em zero, e o
 * balancete podia devolver `balanceado: true` somando valor que nao existe.
 * A unica barreira era o Zod de `useBalancete`, FORA desta funcao pura.
 */
describe('computeBalanceteTotais com valor nao finito (F09)', () => {
  const linha = (over: Partial<BalanceteRow>): BalanceteRow => ({
    conta_id: 'c1',
    codigo: '1.1.01',
    nome: 'Caixa',
    tipo: 'ativo',
    natureza: 'devedora',
    nivel: 3,
    aceita_lancamento: true,
    saldo_anterior: 0,
    debitos: 0,
    creditos: 0,
    saldo_final: 0,
    ...over,
  });

  it('debito NaN NAO fecha o balancete e a linha sai da soma', () => {
    const t = computeBalanceteTotais([
      linha({ debitos: Number.NaN, creditos: 100, saldo_final: -100 }),
      linha({ conta_id: 'c2', debitos: 50, creditos: 50, saldo_final: 0 }),
    ]);
    expect(t.linhasInvalidas).toBe(1);
    expect(t.balanceado).toBe(false);
    // a linha invalida nao entra: sobra so o par 50/50
    expect(t.debitos).toBe(50);
    expect(t.creditos).toBe(50);
  });

  it('Infinity em credito tambem impede o fechamento', () => {
    const t = computeBalanceteTotais([
      linha({ debitos: 10, creditos: Number.POSITIVE_INFINITY, saldo_final: 10 }),
    ]);
    expect(t.linhasInvalidas).toBe(1);
    expect(t.balanceado).toBe(false);
    expect(Number.isFinite(t.creditos)).toBe(true);
  });

  it('saldo_final NaN nao contamina saldo devedor/credor', () => {
    const t = computeBalanceteTotais([
      linha({ debitos: 100, creditos: 100, saldo_final: Number.NaN }),
    ]);
    expect(t.linhasInvalidas).toBe(1);
    expect(t.saldoDevedor).toBe(0);
    expect(t.saldoCredor).toBe(0);
    expect(t.balanceado).toBe(false);
  });

  it('sem valor invalido, nada muda: continua fechando', () => {
    const t = computeBalanceteTotais([
      linha({ debitos: 1234.56, creditos: 1234.56, saldo_final: 0 }),
    ]);
    expect(t.linhasInvalidas).toBe(0);
    expect(t.balanceado).toBe(true);
  });
});
