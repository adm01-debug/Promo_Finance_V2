/**
 * Etapa J — simulação massiva do Score de Conformidade Fiscal.
 * Cobre centenas de cenários combinatórios, invariantes e casos-limite.
 */
import { describe, expect, it } from 'vitest';
import {
  calcularConformidade,
  classificarConformidade,
  competenciasAoRedor,
  gerarCalendario,
  type ItemCalendario,
  type RegimeAplicavel,
  type RegistroEntrega,
} from '../obrigacoes';

const item = (over: Partial<ItemCalendario> = {}): ItemCalendario => ({
  obrigacaoId: 'efd-contribuicoes',
  nome: 'EFD-Contribuições',
  orgao: 'RFB',
  competencia: '2025-01',
  prazo: '2025-03-14',
  situacao: 'futura',
  diasRestantes: 30,
  baseLegal: 'IN RFB 2.121/22',
  ...over,
});

describe('classificarConformidade', () => {
  it('mapeia as quatro faixas nos limites exatos', () => {
    expect(classificarConformidade(100)).toBe('excelente');
    expect(classificarConformidade(95)).toBe('excelente');
    expect(classificarConformidade(94.9)).toBe('bom');
    expect(classificarConformidade(85)).toBe('bom');
    expect(classificarConformidade(84.9)).toBe('atencao');
    expect(classificarConformidade(60)).toBe('atencao');
    expect(classificarConformidade(59.9)).toBe('critico');
    expect(classificarConformidade(0)).toBe('critico');
  });
});

describe('calcularConformidade — casos unitários', () => {
  it('retorna 100 para conjunto vazio (sem obrigações, sem risco)', () => {
    const r = calcularConformidade([], []);
    expect(r.score).toBe(100);
    expect(r.nivel).toBe('excelente');
    expect(r.pontualidade).toBe(100);
    expect(r.porOrgao).toEqual([]);
  });

  it('zera o item vencido sem entrega e o marca como crítico', () => {
    const r = calcularConformidade([item({ situacao: 'vencida', diasRestantes: -5 })]);
    expect(r.score).toBe(0);
    expect(r.vencidasPendentes).toBe(1);
    expect(r.criticos).toHaveLength(1);
    expect(r.nivel).toBe('critico');
  });

  it('pontua 60% na entrega em atraso e conta pontualidade', () => {
    const registros: RegistroEntrega[] = [
      { obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'entregue', dataEntrega: '2025-03-20' },
    ];
    const r = calcularConformidade([item({ situacao: 'vencida' })], registros);
    expect(r.score).toBe(60);
    expect(r.entreguesComAtraso).toBe(1);
    expect(r.pontualidade).toBe(0);
    expect(r.vencidasPendentes).toBe(0);
  });

  it('pontua 100% na entrega dentro do prazo', () => {
    const r = calcularConformidade(
      [item({ situacao: 'vencida' })],
      [{ obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'entregue', dataEntrega: '2025-03-10' }]
    );
    expect(r.score).toBe(100);
    expect(r.entreguesComAtraso).toBe(0);
    expect(r.pontualidade).toBe(100);
  });

  it('trata dispensada como conforme sem contar como entrega', () => {
    const r = calcularConformidade(
      [item({ situacao: 'vencida' })],
      [{ obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'dispensada' }]
    );
    expect(r.score).toBe(100);
    expect(r.dispensadas).toBe(1);
    expect(r.entregues).toBe(0);
  });

  it('conta retificada como entregue e respeita o atraso', () => {
    const r = calcularConformidade(
      [item({ situacao: 'vencida' })],
      [{ obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'retificada', dataEntrega: '2025-04-01' }]
    );
    expect(r.retificadas).toBe(1);
    expect(r.entregues).toBe(1);
    expect(r.score).toBe(60);
  });

  it('aplica peso 0,8 para vencimento no dia', () => {
    const r = calcularConformidade([item({ situacao: 'vence_hoje', diasRestantes: 0 })]);
    expect(r.score).toBe(80);
    expect(r.venceHoje).toBe(1);
  });

  it('ignora status pendente persistido e usa a situação do calendário', () => {
    const r = calcularConformidade(
      [item({ situacao: 'futura' })],
      [{ obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'pendente' }]
    );
    expect(r.score).toBe(100);
    expect(r.pendentesNoPrazo).toBe(1);
  });

  it('soma multas registradas e ignora valores negativos ou inválidos', () => {
    const r = calcularConformidade(
      [item({ competencia: '2025-01' }), item({ competencia: '2025-02', prazo: '2025-04-14' })],
      [
        { obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'entregue', valorMulta: 1500.555 },
        { obrigacaoId: 'efd-contribuicoes', competencia: '2025-02', status: 'entregue', valorMulta: -900 },
      ]
    );
    expect(r.multaRegistrada).toBe(1500.56);
  });

  it('a última ocorrência duplicada prevalece', () => {
    const r = calcularConformidade(
      [item({ situacao: 'vencida' })],
      [
        { obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'pendente' },
        { obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status: 'entregue', dataEntrega: '2025-03-01' },
      ]
    );
    expect(r.score).toBe(100);
  });

  it('ordena críticos do prazo mais antigo para o mais recente', () => {
    const r = calcularConformidade([
      item({ competencia: '2025-03', prazo: '2025-05-14', situacao: 'vencida' }),
      item({ competencia: '2025-01', prazo: '2025-03-14', situacao: 'vencida' }),
      item({ competencia: '2025-02', prazo: '2025-04-14', situacao: 'vencida' }),
    ]);
    expect(r.criticos.map((c) => c.prazo)).toEqual(['2025-03-14', '2025-04-14', '2025-05-14']);
  });

  it('agrupa por órgão ordenando do pior score para o melhor', () => {
    const r = calcularConformidade([
      item({ orgao: 'RFB', situacao: 'futura' }),
      item({ orgao: 'SEFAZ', competencia: '2025-02', situacao: 'vencida' }),
      item({ orgao: 'CAIXA', competencia: '2025-03', situacao: 'vence_hoje' }),
    ]);
    expect(r.porOrgao.map((o) => o.orgao)).toEqual(['SEFAZ', 'CAIXA', 'RFB']);
    expect(r.porOrgao[0].vencidas).toBe(1);
  });
});

describe('calcularConformidade — simulação combinatória', () => {
  const situacoes = ['entregue', 'vencida', 'vence_hoje', 'proxima', 'futura'] as const;
  const statuses = [null, 'pendente', 'entregue', 'dispensada', 'retificada'] as const;
  const atrasos = [null, '2025-03-01', '2025-03-20'] as const;

  it('mantém invariantes em 375 combinações situação × status × data', () => {
    let cenarios = 0;
    for (const situacao of situacoes) {
      for (const status of statuses) {
        for (const dataEntrega of atrasos) {
          for (const orgao of ['RFB', 'SEFAZ', 'CAIXA', 'MTE'] as const) {
            cenarios += 1;
            const itens = [item({ situacao, orgao })];
            const registros: RegistroEntrega[] =
              status === null ? [] : [{ obrigacaoId: 'efd-contribuicoes', competencia: '2025-01', status, dataEntrega }];
            const r = calcularConformidade(itens, registros);

            expect(r.total).toBe(1);
            expect(r.score).toBeGreaterThanOrEqual(0);
            expect(r.score).toBeLessThanOrEqual(100);
            expect(r.pontualidade).toBeGreaterThanOrEqual(0);
            expect(r.pontualidade).toBeLessThanOrEqual(100);
            expect(r.nivel).toBe(classificarConformidade(r.score));
            expect(r.criticos.length).toBe(r.vencidasPendentes);
            expect(
              r.entregues + r.dispensadas + r.vencidasPendentes + r.venceHoje + r.pendentesNoPrazo
            ).toBe(1);
            expect(r.porOrgao).toHaveLength(1);
            expect(r.porOrgao[0].orgao).toBe(orgao);
          }
        }
      }
    }
    expect(cenarios).toBe(300);
  });

  it('score é monotônico: entregar uma vencida nunca reduz o score', () => {
    const base = Array.from({ length: 12 }, (_, i) =>
      item({ competencia: `2025-${String(i + 1).padStart(2, '0')}`, situacao: 'vencida' })
    );
    let anterior = calcularConformidade(base).score;
    const registros: RegistroEntrega[] = [];
    for (const it of base) {
      registros.push({
        obrigacaoId: it.obrigacaoId,
        competencia: it.competencia,
        status: 'entregue',
        dataEntrega: it.prazo,
      });
      const atual = calcularConformidade(base, registros).score;
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
    expect(anterior).toBe(100);
  });

  it('integra com o calendário real em 4 regimes × 13 competências', () => {
    const regimes: RegimeAplicavel[] = ['simples', 'presumido', 'real', 'todos'];
    const competencias = competenciasAoRedor('2025-06', 6, 6);
    expect(competencias).toHaveLength(13);

    for (const regime of regimes) {
      const itens = gerarCalendario({ competencias, regime, hoje: '2025-06-15', entregues: new Set() });
      const semEntrega = calcularConformidade(itens);
      expect(semEntrega.total).toBe(itens.length);
      expect(semEntrega.score).toBeLessThanOrEqual(100);

      const todosEntregues: RegistroEntrega[] = itens.map((i) => ({
        obrigacaoId: i.obrigacaoId,
        competencia: i.competencia,
        status: 'entregue',
        dataEntrega: i.prazo,
      }));
      const comEntrega = calcularConformidade(itens, todosEntregues);
      expect(comEntrega.score).toBe(100);
      expect(comEntrega.vencidasPendentes).toBe(0);
      expect(comEntrega.criticos).toEqual([]);
    }
  });
});
