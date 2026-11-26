import { describe, expect, it, vi } from 'vitest';

const { linhas } = vi.hoisted(() => ({
  linhas: [
    {
      // mesmo par cClassTrib/CST em outro conjunto: a API repete a linha por
      // conjunto de tributo, com texto proprio
      cclasstrib: '200035',
      cst: '000',
      conjunto_tributo: 'CBS',
      descricao_cclasstrib: 'Tributacao integral',
      descricao_cst: 'Tributacao integral',
      texto: 'Art. 11. Texto do CBS isolado.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
    },
    {
      cclasstrib: '200035',
      cst: '000',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: 'Tributacao integral',
      descricao_cst: 'Tributacao integral',
      texto: 'Art. 11. Texto do artigo 11.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
    },
    {
      cclasstrib: '200035',
      cst: '410',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: 'Tributacao integral',
      descricao_cst: 'Isencao',
      texto: 'Art. 12. Texto do artigo 12.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
    },
    {
      // mesmo cClassTrib e mesmo conjunto, CSTs diferentes: sem desempate a
      // primeira linha da lista dependeria da ordem que o banco devolveu
      cclasstrib: '210001',
      cst: '510',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: 'Tributacao integral',
      descricao_cst: 'Diferimento',
      texto: 'artigo 13. Texto do CST 510.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
    },
    {
      cclasstrib: '210001',
      cst: '200',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: 'Tributacao integral',
      descricao_cst: 'Aliquota reduzida',
      texto: 'artigo 14. Texto do CST 200.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
    },
    {
      // vigencia futura: nao vale para a data de referencia
      cclasstrib: '999999',
      cst: '000',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: null,
      descricao_cst: null,
      texto: 'Art. 99. Vigencia futura.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2027-01-01',
      fim_vigencia: null,
    },
    {
      // vigencia encerrada antes da data de referencia
      cclasstrib: '200035',
      cst: '200',
      conjunto_tributo: 'CBS e IBS',
      descricao_cclasstrib: null,
      descricao_cst: null,
      texto: 'Art. 10. Vigencia encerrada.',
      texto_curto: 'LC 214/2025',
      referencia_normativa: 'LC 214/2025',
      inicio_vigencia: '2024-01-01',
      fim_vigencia: '2025-12-31',
    },
  ],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: linhas, error: null }),
      }),
    }),
  },
}));

import {
  buscarFundamentosLegais,
  chaveFundamentoLegal,
  escolherFundamento,
  fundamentosVazios,
  resumoFundamento,
} from '../catalogos/fundamentacao-legal';

describe('buscarFundamentosLegais', () => {
  it('indexa apenas as linhas vigentes na data de referencia', async () => {
    const f = await buscarFundamentosLegais(['200035', '999999'], '2026-06-01');
    expect(f.referencia).toBe('2026-06-01');
    expect(f.carregado).toBe(true);
    // 4 linhas vigentes do cClassTrib 200035 (000 no conjunto CBS, 000 e 410 no
    // CBS e IBS) e nada do 999999
    expect(f.porCclasstrib.get('200035')).toHaveLength(3);
    expect(f.porCclasstrib.has('999999')).toBe(false);
    expect(f.porCst.get(chaveFundamentoLegal('200035', '410'))?.texto).toContain('artigo 12');
    // CST 200 so tem vigencia encerrada
    expect(f.porCst.has(chaveFundamentoLegal('200035', '200'))).toBe(false);
  });

  it('sem codigo nao consulta e devolve o vazio', async () => {
    const f = await buscarFundamentosLegais(['  ', ''], '2026-06-01');
    expect(f.carregado).toBe(false);
    expect(f.porCst.size).toBe(0);
    expect(f.referencia).toBe('2026-06-01');
  });
});

describe('escolherFundamento', () => {
  it('prefere o par cClassTrib/CST declarado', async () => {
    const f = await buscarFundamentosLegais(['200035'], '2026-06-01');
    expect(escolherFundamento(f, '200035', '410')?.texto).toContain('artigo 12');
  });

  it('cai na primeira linha do cClassTrib quando o CST diverge', async () => {
    const f = await buscarFundamentosLegais(['200035'], '2026-06-01');
    expect(escolherFundamento(f, '200035', '999')?.texto).toContain('artigo 11');
  });

  it('prefere o conjunto CBS e IBS quando o par existe em dois conjuntos', async () => {
    const f = await buscarFundamentosLegais(['200035'], '2026-06-01');
    expect(f.porCst.get(chaveFundamentoLegal('200035', '000'))?.conjuntoTributo).toBe('CBS e IBS');
    expect(f.porCclasstrib.get('200035')?.[0].conjuntoTributo).toBe('CBS e IBS');
  });

  it('cai na primeira linha do cClassTrib desempatando pelo CST', async () => {
    // o banco devolveu 510 antes de 200 no mesmo conjunto; a lista tem de sair
    // em ordem estavel de CST, nao na ordem da resposta
    const f = await buscarFundamentosLegais(['210001'], '2026-06-01');
    expect(f.porCclasstrib.get('210001')?.map((l) => l.cst)).toEqual(['200', '510']);
    expect(escolherFundamento(f, '210001', '999')?.texto).toContain('artigo 14');
  });

  it('sem linha devolve undefined', async () => {
    const f = await buscarFundamentosLegais(['200035'], '2026-06-01');
    expect(escolherFundamento(f, '123456', '000')).toBeUndefined();
    expect(escolherFundamento(fundamentosVazios('2026-06-01'), '', '000')).toBeUndefined();
  });
});

describe('resumoFundamento', () => {
  it('usa a referencia curta e o texto integral', () => {
    const r = resumoFundamento({
      cclasstrib: '200035',
      cst: '000',
      conjuntoTributo: 'CBS e IBS',
      descricaoCClassTrib: null,
      descricaoCST: null,
      texto: 'Art. 11. Texto.\nArt. 11-A. Complemento.',
      textoCurto: 'LC 214/2025',
      referenciaNormativa: 'LC 214/2025',
    });
    expect(r?.referencia).toBe('LC 214/2025');
    expect(r?.texto).toContain('Art. 11-A');
  });

  it('sem referencia curta usa a primeira linha do texto', () => {
    const r = resumoFundamento({
      cclasstrib: '200035',
      cst: '000',
      conjuntoTributo: 'CBS e IBS',
      descricaoCClassTrib: null,
      descricaoCST: null,
      texto: '\n  Art. 33. Primeira linha util.\nArt. 34. Resto.',
      textoCurto: null,
      referenciaNormativa: null,
    });
    expect(r?.referencia).toBe('Art. 33. Primeira linha util.');
  });

  it('sem texto devolve undefined', () => {
    expect(
      resumoFundamento({
        cclasstrib: '200035',
        cst: '000',
        conjuntoTributo: 'CBS e IBS',
        descricaoCClassTrib: null,
        descricaoCST: null,
        texto: '   ',
        textoCurto: 'LC 214/2025',
        referenciaNormativa: null,
      })
    ).toBeUndefined();
  });
});
