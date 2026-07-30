// Guarda do OVERLAY DE NCM/TIPI — validação determinística + fuzzing adverso.
import { describe, it, expect, afterEach } from 'vitest';
import {
  aplicarOverlayNcm,
  descreverRejeicoesNcm,
  normalizarAliquotaIpi,
  IPI_ALIQUOTA_MAXIMA,
  type RegistroNcmBanco,
} from '@/lib/tributario/ipi-iss/overlay-ncm';
import {
  TIPI,
  buscarTipi,
  buscarTipiCanonica,
  definirTabelaTipiEfetiva,
  resetarTabelaTipiEfetiva,
  normalizarNcm,
} from '@/lib/tributario/ipi-iss/tabelas';

afterEach(() => resetarTabelaTipiEfetiva());

const reg = (p: Partial<RegistroNcmBanco>): RegistroNcmBanco => ({
  codigo: '96081000',
  descricao: 'Canetas esferográficas',
  aliquota_ipi: 0.0975,
  ...p,
});

describe('normalizarAliquotaIpi', () => {
  it('aceita fração, percentual e string com vírgula', () => {
    expect(normalizarAliquotaIpi(0.0975)).toBe(0.0975);
    expect(normalizarAliquotaIpi(9.75)).toBe(0.0975);
    expect(normalizarAliquotaIpi('9,75')).toBe(0.0975);
    expect(normalizarAliquotaIpi(' 0.15 ')).toBe(0.15);
  });

  it('trata 1 como 100% em fração e 100 como 100% em percentual', () => {
    expect(normalizarAliquotaIpi(1)).toBe(1);
    expect(normalizarAliquotaIpi(100)).toBe(1);
  });

  it('rejeita valores não numéricos, negativos e nulos', () => {
    for (const v of [null, undefined, '', 'abc', NaN, Infinity, -0.1, -5]) {
      expect(normalizarAliquotaIpi(v as never)).toBeNull();
    }
  });
});

describe('aplicarOverlayNcm — base canônica', () => {
  it('sem registros mantém integralmente a TIPI embarcada', () => {
    const r = aplicarOverlayNcm([]);
    expect(Object.keys(r.tabela)).toHaveLength(TIPI.length);
    expect(r.aplicadas).toHaveLength(0);
    expect(r.adicionados).toHaveLength(0);
    expect(r.rejeitadas).toHaveLength(0);
  });

  it('não muta a constante TIPI nem os registros de entrada', () => {
    const antes = JSON.stringify(TIPI);
    const registros = [reg({ aliquota_ipi: 0.25 })];
    const copia = JSON.stringify(registros);
    aplicarOverlayNcm(registros);
    expect(JSON.stringify(TIPI)).toBe(antes);
    expect(JSON.stringify(registros)).toBe(copia);
  });

  it('registro idêntico à TIPI não gera sobreposição', () => {
    const r = aplicarOverlayNcm([reg({ aliquota_ipi: 9.75 })]);
    expect(r.aplicadas).toHaveLength(0);
  });
});

describe('aplicarOverlayNcm — sobreposição e adição', () => {
  it('sobrepõe a alíquota divergente e reporta o par código × banco', () => {
    const r = aplicarOverlayNcm([reg({ aliquota_ipi: 0.15 })]);
    expect(r.aplicadas).toEqual([
      { ncm: '96081000', campo: 'aliquota_ipi', valorCodigo: 0.0975, valorBanco: 0.15 },
    ]);
    expect(r.tabela['96081000'].aliquota).toBe(0.15);
    expect(r.tabela['96081000'].situacao).toBe('tributada');
  });

  it('NCM novo do banco entra na tabela efetiva como adicionado', () => {
    const r = aplicarOverlayNcm([
      reg({ codigo: '3304.99.90', descricao: 'Cosméticos', aliquota_ipi: 22 }),
    ]);
    expect(r.adicionados).toEqual(['33049990']);
    expect(r.tabela['33049990']).toMatchObject({ aliquota: 0.22, situacao: 'tributada' });
    expect(r.aplicadas).toHaveLength(0);
  });

  it('preserva a qualificação jurídica (imune/NT) quando a alíquota vai a zero', () => {
    const imune = TIPI.find((i) => i.situacao === 'imune')!;
    const nt = TIPI.find((i) => i.situacao === 'nao_tributada')!;
    const r = aplicarOverlayNcm([
      reg({ codigo: imune.ncm, aliquota_ipi: 0 }),
      reg({ codigo: nt.ncm, aliquota_ipi: 0 }),
    ]);
    expect(r.tabela[imune.ncm].situacao).toBe('imune');
    expect(r.tabela[nt.ncm].situacao).toBe('nao_tributada');
  });

  it('NCM antes NT que passa a ser tributado muda de situação', () => {
    const nt = TIPI.find((i) => i.situacao === 'nao_tributada')!;
    const r = aplicarOverlayNcm([reg({ codigo: nt.ncm, aliquota_ipi: 5 })]);
    expect(r.tabela[nt.ncm].situacao).toBe('tributada');
  });

  it('tributado que zera vira alíquota zero, não NT', () => {
    const r = aplicarOverlayNcm([reg({ codigo: '96081000', aliquota_ipi: 0 })]);
    expect(r.tabela['96081000'].situacao).toBe('aliquota_zero');
  });
});

describe('aplicarOverlayNcm — rejeições defensivas', () => {
  it('rejeita código fora de 8 dígitos sem contaminar a tabela', () => {
    const r = aplicarOverlayNcm([reg({ codigo: '2710124' }), reg({ codigo: '' }), reg({ codigo: null })]);
    expect(r.rejeitadas.every((x) => x.motivo === 'codigo_invalido')).toBe(true);
    expect(r.rejeitadas).toHaveLength(3);
    expect(Object.keys(r.tabela)).toHaveLength(TIPI.length);
  });

  it('rejeita duplicidade mantendo a primeira ocorrência', () => {
    const r = aplicarOverlayNcm([
      reg({ aliquota_ipi: 0.15 }),
      reg({ aliquota_ipi: 0.3 }),
    ]);
    expect(r.tabela['96081000'].aliquota).toBe(0.15);
    expect(r.rejeitadas).toEqual([{ ncm: '96081000', motivo: 'duplicado', valor: '96081000' }]);
  });

  it('rejeita alíquota inválida e acima do teto de 300%', () => {
    const r = aplicarOverlayNcm([
      reg({ codigo: '96081000', aliquota_ipi: 'xx' }),
      reg({ codigo: '96170010', aliquota_ipi: -1 }),
      reg({ codigo: '91029900', aliquota_ipi: 350 }),
    ]);
    expect(r.rejeitadas.map((x) => x.motivo)).toEqual([
      'aliquota_invalida',
      'aliquota_invalida',
      'aliquota_fora_da_faixa',
    ]);
    // Nenhuma delas alterou a tabela efetiva.
    expect(r.tabela['91029900'].aliquota).toBe(0.2);
    expect(r.aplicadas).toHaveLength(0);
  });

  it('aceita exatamente o teto de 300%', () => {
    const r = aplicarOverlayNcm([reg({ codigo: '24022000', aliquota_ipi: 300 })]);
    expect(r.rejeitadas).toHaveLength(0);
    expect(r.tabela['24022000'].aliquota).toBe(IPI_ALIQUOTA_MAXIMA);
  });

  it('descreve todas as rejeições em português legível', () => {
    const r = aplicarOverlayNcm([
      reg({ codigo: '123' }),
      reg({}),
      reg({}),
      reg({ codigo: '70133700', aliquota_ipi: null }),
      reg({ codigo: '85234110', aliquota_ipi: 999 }),
    ]);
    const msgs = descreverRejeicoesNcm(r.rejeitadas);
    expect(msgs).toHaveLength(r.rejeitadas.length);
    expect(msgs.every((m) => typeof m === 'string' && m.length > 10)).toBe(true);
  });
});

describe('tabela efetiva do motor', () => {
  it('buscarTipi passa a refletir o overlay; buscarTipiCanonica não', () => {
    const r = aplicarOverlayNcm([reg({ aliquota_ipi: 0.5 })]);
    definirTabelaTipiEfetiva(r.tabela);
    expect(buscarTipi('9608.10.00')?.aliquota).toBe(0.5);
    expect(buscarTipiCanonica('9608.10.00')?.aliquota).toBe(0.0975);
    resetarTabelaTipiEfetiva();
    expect(buscarTipi('96081000')?.aliquota).toBe(0.0975);
  });
});

// ---------------------------------------------------------------------------
// Fuzzing determinístico: 400 catálogos adversos, 6 registros cada.
// Invariantes que NUNCA podem ser violadas, sob qualquer entrada.
// ---------------------------------------------------------------------------
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000);
}

const PATOLOGIAS: Array<(r: () => number) => RegistroNcmBanco> = [
  () => ({ codigo: null, aliquota_ipi: null }),
  (r) => ({ codigo: '   ', aliquota_ipi: r() * 10 }),
  (r) => ({ codigo: String(Math.floor(r() * 1e7)), aliquota_ipi: r() }),
  (r) => ({ codigo: '96081000', aliquota_ipi: -r() * 100 }),
  (r) => ({ codigo: '96081000', aliquota_ipi: 300 + r() * 1e6 }),
  () => ({ codigo: '9608.10.00', aliquota_ipi: NaN }),
  () => ({ codigo: '96081000', aliquota_ipi: Infinity }),
  (r) => ({ codigo: '96081000', aliquota_ipi: `${(r() * 30).toFixed(2)}`.replace('.', ',') }),
  (r) => ({ codigo: `${Math.floor(10000000 + r() * 89999999)}`, aliquota_ipi: r() * 3 }),
  (r) => ({ codigo: '85234110', descricao: '', aliquota_ipi: r() > 0.5 ? 0 : 15 }),
];

describe('Fuzzing — 400 catálogos adversos de NCM', () => {
  it('nenhuma entrada quebra as invariantes do overlay', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const r = rng(seed);
      const registros = Array.from({ length: 6 }, () =>
        PATOLOGIAS[Math.floor(r() * PATOLOGIAS.length)](r),
      );
      const out = aplicarOverlayNcm(registros);

      // 1. Toda entrada é classificada: aceita (aplicada/adicionada/idêntica) ou rejeitada.
      expect(out.rejeitadas.length).toBeLessThanOrEqual(registros.length);

      // 2. A tabela nunca perde nenhum NCM da TIPI embarcada.
      for (const item of TIPI) expect(out.tabela[item.ncm]).toBeDefined();

      // 3. Todas as chaves têm 8 dígitos e alíquota válida dentro da faixa legal.
      for (const [ncm, item] of Object.entries(out.tabela)) {
        expect(normalizarNcm(ncm)).toBe(ncm);
        expect(ncm).toHaveLength(8);
        expect(Number.isFinite(item.aliquota)).toBe(true);
        expect(item.aliquota).toBeGreaterThanOrEqual(0);
        expect(item.aliquota).toBeLessThanOrEqual(IPI_ALIQUOTA_MAXIMA);
        expect(item.descricao.length).toBeGreaterThan(0);
      }

      // 4. Coerência situação × alíquota.
      for (const item of Object.values(out.tabela)) {
        if (item.aliquota > 0) expect(item.situacao).toBe('tributada');
      }

      // 5. Adicionados e aplicadas são disjuntos e sempre presentes na tabela.
      const adicionados = new Set(out.adicionados);
      for (const a of out.aplicadas) expect(adicionados.has(a.ncm)).toBe(false);
      for (const ncm of adicionados) expect(out.tabela[ncm]).toBeDefined();

      // 6. Idempotência: reaplicar sobre a própria saída não muda nada.
      const segunda = aplicarOverlayNcm(registros, Object.values(out.tabela));
      expect(segunda.aplicadas).toHaveLength(0);
      expect(Object.keys(segunda.tabela).sort()).toEqual(Object.keys(out.tabela).sort());

      // 7. Descrições de rejeição nunca lançam.
      expect(() => descreverRejeicoesNcm(out.rejeitadas)).not.toThrow();
    }
  });
});
