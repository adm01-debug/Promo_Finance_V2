import { describe, expect, it } from 'vitest';
import {
  avaliarFrescorCatalogosRfb,
  DIAS_ALERTA_CATALOGO_RFB,
  DIAS_ALERTA_CATALOGO_RFB_SEMANAL,
  entradaIndisponivel,
  entradaSemLinhas,
  escolherRunComEscopo,
  escolherUltimaCarga,
  exigeProvaDeEscopo,
  TITULOS_CATALOGO_RFB,
  type LinhaLedgerRun,
} from '../catalogos/saude';

const HOJE = new Date('2026-11-26T12:00:00Z');

const emDias = (dias: number) => new Date(HOJE.getTime() - dias * 86_400_000).toISOString();

describe('avaliarFrescorCatalogosRfb', () => {
  it('marca como critico o catalogo nunca sincronizado', () => {
    const r = avaliarFrescorCatalogosRfb([{ id: 'ncm', ultimaCarga: null }], HOJE);
    expect(r.status).toBe('critico');
    expect(r.nuncaSincronizados).toBe(1);
    expect(r.catalogos[0]).toMatchObject({
      id: 'ncm',
      titulo: TITULOS_CATALOGO_RFB.ncm,
      ultimaCarga: null,
      diasSemSync: null,
      status: 'critico',
      detalhe: 'Nunca sincronizado',
    });
    expect(r.resumo).toContain('nunca sincronizado');
  });

  it('mantem em dia o catalogo carregado hoje', () => {
    const r = avaliarFrescorCatalogosRfb([{ id: 'cclasstrib', ultimaCarga: emDias(0) }], HOJE);
    expect(r.status).toBe('ok');
    expect(r.catalogos[0].diasSemSync).toBe(0);
    expect(r.catalogos[0].detalhe).toBe('Sincronizado hoje');
  });

  it('trata o dia do limite como em dia e o excedente (mesmo parcial) como alerta', () => {
    const limite = avaliarFrescorCatalogosRfb(
      [{ id: 'aliquota_cbs', ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB) }],
      HOJE
    );
    expect(limite.catalogos[0].status).toBe('ok');
    expect(limite.status).toBe('ok');

    // 7 dias e 12 horas já é atraso: `diasSemSync` trunca em 7, mas o alerta
    // não pode esperar o dia 8 para aparecer.
    const meioDiaDepois = avaliarFrescorCatalogosRfb(
      [{ id: 'aliquota_cbs', ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB + 0.5) }],
      HOJE
    );
    expect(meioDiaDepois.catalogos[0].diasSemSync).toBe(DIAS_ALERTA_CATALOGO_RFB);
    expect(meioDiaDepois.catalogos[0].status).toBe('atencao');
    expect(meioDiaDepois.catalogos[0].detalhe).toContain('mais de 7 dias');
    expect(meioDiaDepois.desatualizados).toBe(1);
    expect(meioDiaDepois.status).toBe('atencao');

    const passou = avaliarFrescorCatalogosRfb(
      [{ id: 'aliquota_cbs', ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB + 1) }],
      HOJE
    );
    expect(passou.catalogos[0].status).toBe('atencao');
    expect(passou.desatualizados).toBe(1);
    expect(passou.resumo).toContain('além do prazo');
  });

  it('respeita o prazo semanal do escopo municipal', () => {
    const oito = avaliarFrescorCatalogosRfb(
      [
        {
          id: 'aliquota_ibs_mun',
          ultimaCarga: emDias(8),
          limiteDias: DIAS_ALERTA_CATALOGO_RFB_SEMANAL,
        },
      ],
      HOJE
    );
    expect(oito.status).toBe('ok');

    const dez = avaliarFrescorCatalogosRfb(
      [
        {
          id: 'aliquota_ibs_mun',
          ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB_SEMANAL + 0.5),
          limiteDias: DIAS_ALERTA_CATALOGO_RFB_SEMANAL,
        },
      ],
      HOJE
    );
    expect(dez.status).toBe('atencao');
    expect(dez.catalogos[0].detalhe).toContain('mais de 9 dias');
  });

  it('agrega o pior status e conta cada grupo', () => {
    const r = avaliarFrescorCatalogosRfb(
      [
        { id: 'cclasstrib', ultimaCarga: emDias(1), versaoIt: '1.71' },
        { id: 'ncm', ultimaCarga: emDias(9) },
        { id: 'aliquota_ibs_mun', ultimaCarga: emDias(30) },
        { id: 'fundamentacao', ultimaCarga: null },
      ],
      HOJE
    );
    expect(r.status).toBe('critico');
    expect(r.desatualizados).toBe(2);
    expect(r.nuncaSincronizados).toBe(1);
    expect(r.resumo).toContain('1 catálogo nunca sincronizado');
    expect(r.resumo).toContain('2 catálogos sem sincronizar além do prazo');
    expect(r.catalogos[0].versaoIt).toBe('1.71');
    expect(r.catalogos[1].versaoIt).toBeNull();
  });

  it('data invalida e relogio adiantado nao quebram a avaliacao', () => {
    const invalida = avaliarFrescorCatalogosRfb([{ id: 'ncm', ultimaCarga: 'x' }], HOJE);
    expect(invalida.catalogos[0].status).toBe('critico');
    expect(invalida.catalogos[0].ultimaCarga).toBeNull();

    const futuro = avaliarFrescorCatalogosRfb([{ id: 'ncm', ultimaCarga: emDias(-3) }], HOJE);
    expect(futuro.catalogos[0].diasSemSync).toBe(0);
    expect(futuro.status).toBe('ok');
  });

  it('lista vazia nao inventa problema', () => {
    const r = avaliarFrescorCatalogosRfb([], HOJE);
    expect(r.status).toBe('ok');
    expect(r.catalogos).toEqual([]);
    expect(r.resumo).toContain('dentro do prazo');
  });

  it('cada escopo de aliquota e o NBS avaliam o proprio frescor', () => {
    const r = avaliarFrescorCatalogosRfb(
      [
        { id: 'aliquota_cbs', ultimaCarga: emDias(0) },
        { id: 'aliquota_ibs_uf', ultimaCarga: emDias(0) },
        { id: 'aliquota_ibs_mun', ultimaCarga: null },
        { id: 'nbs', ultimaCarga: null },
      ],
      HOJE
    );
    expect(r.catalogos.map((c) => c.id)).toEqual([
      'aliquota_cbs',
      'aliquota_ibs_uf',
      'aliquota_ibs_mun',
      'nbs',
    ]);
    expect(r.catalogos.map((c) => c.status)).toEqual(['ok', 'ok', 'critico', 'critico']);
    expect(r.nuncaSincronizados).toBe(2);
    expect(r.resumo).toContain('2 catálogos nunca sincronizados');
  });
});

describe('entradaSemLinhas', () => {
  it('escopo vazio com run recente fica em dia e explica que nao ha linha', () => {
    const r = avaliarFrescorCatalogosRfb([entradaSemLinhas('nbs', emDias(0))], HOJE);
    expect(r.status).toBe('ok');
    expect(r.catalogos[0].ultimaCarga).not.toBeNull();
    expect(r.catalogos[0].detalhe).toContain('Nenhuma linha carregada');
  });

  it('escopo vazio com run atrasado continua alertando', () => {
    const r = avaliarFrescorCatalogosRfb([entradaSemLinhas('nbs', emDias(20))], HOJE);
    expect(r.status).toBe('atencao');
    expect(r.catalogos[0].detalhe).toContain('Nenhuma linha carregada');
  });

  it('sem run nenhum volta a ser nunca sincronizado', () => {
    const r = avaliarFrescorCatalogosRfb([entradaSemLinhas('nbs', null)], HOJE);
    expect(r.status).toBe('critico');
    expect(r.catalogos[0].detalhe).toBe('Nunca sincronizado');
  });
});

describe('escolherUltimaCarga', () => {
  const run = new Date('2026-11-20T03:00:00Z');
  const tabela = new Date('2026-09-01T03:00:00Z');

  it('usa o run quando o carimbo do catalogo congelou', () => {
    expect(escolherUltimaCarga(tabela, run)).toBe(run.toISOString());
  });

  it('usa o carimbo do catalogo quando ele e mais novo que o run', () => {
    expect(escolherUltimaCarga(run, tabela)).toBe(run.toISOString());
    const maisNovo = new Date('2026-11-25T03:00:00Z');
    expect(escolherUltimaCarga(maisNovo, run)).toBe(maisNovo.toISOString());
  });

  it('aceita ISO, Date e devolve null quando nao ha evidencia', () => {
    expect(escolherUltimaCarga(tabela.toISOString(), run)).toBe(run.toISOString());
    expect(escolherUltimaCarga(null, run)).toBe(run.toISOString());
    expect(escolherUltimaCarga(tabela, null)).toBe(tabela.toISOString());
    expect(escolherUltimaCarga(null, null)).toBeNull();
    expect(escolherUltimaCarga('x', null)).toBeNull();
    expect(escolherUltimaCarga(null, 'x')).toBeNull();
  });
});

describe('entradaIndisponivel', () => {
  it('declara estado desconhecido em vez de catalogo vazio ou em dia', () => {
    const r = avaliarFrescorCatalogosRfb([entradaIndisponivel('nbs')], HOJE);
    expect(r.catalogos[0]).toMatchObject({
      id: 'nbs',
      status: 'atencao',
      indisponivel: true,
      detalhe: 'N\u00e3o foi poss\u00edvel consultar o cat\u00e1logo',
    });
    expect(r.indisponiveis).toBe(1);
    // Leitura falhada nao e "sem sincronizar alem do prazo": e outro estado.
    expect(r.desatualizados).toBe(0);
    expect(r.nuncaSincronizados).toBe(0);
    expect(r.status).toBe('atencao');
    expect(r.resumo).toContain('sem leitura');
  });

  it('nao contamina o veredito dos outros catalogos', () => {
    const r = avaliarFrescorCatalogosRfb(
      [entradaIndisponivel('nbs'), { id: 'ncm', ultimaCarga: emDias(1) }],
      HOJE
    );
    expect(r.catalogos[0].indisponivel).toBe(true);
    expect(r.catalogos[1]).toMatchObject({ status: 'ok', indisponivel: false });
    expect(r.resumo).toBe('1 cat\u00e1logo sem leitura');
  });
});

describe('escolherRunComEscopo', () => {
  const linha = (
    event: 'sync concluido' | 'request_end',
    request_id: string,
    status_code: number | null,
    metadata: Record<string, unknown>,
    created_at: string
  ): LinhaLedgerRun => ({ created_at, event, status_code, metadata: { request_id, ...metadata } });

  it('so exige prova propria nos escopos que dividem o job', () => {
    expect(exigeProvaDeEscopo('ncm')).toBe(true);
    expect(exigeProvaDeEscopo('nbs')).toBe(true);
    expect(exigeProvaDeEscopo('aliquota_ibs_mun')).toBe(true);
    expect(exigeProvaDeEscopo('cclasstrib')).toBe(false);
    expect(exigeProvaDeEscopo('aliquota_ibs_uf')).toBe(false);
  });

  it('ignora o run do job quando o escopo nao foi consultado', () => {
    // Job diario de NCM/NBS que respondeu 200: o NBS pode ter sido pulado.
    const linhas = [
      linha(
        'sync concluido',
        'r1',
        null,
        { recebidos_ncm: 420, recebidos_nbs: 0 },
        '2026-11-25T03:00:00Z'
      ),
      linha('request_end', 'r1', 200, {}, '2026-11-25T03:00:00Z'),
    ];
    expect(escolherRunComEscopo('nbs', linhas)).toBeNull();
    expect(escolherRunComEscopo('ncm', linhas)).toBe('2026-11-25T03:00:00Z');
  });

  it('aceita o run que consultou o escopo mesmo sem gravar linha', () => {
    const linhas = [
      linha(
        'sync concluido',
        'r1',
        null,
        { recebidos_nbs: 12, nbs_gravados: 0 },
        '2026-11-25T03:00:00Z'
      ),
      linha('request_end', 'r1', 200, {}, '2026-11-25T03:00:00Z'),
    ];
    expect(escolherRunComEscopo('nbs', linhas)).toBe('2026-11-25T03:00:00Z');
  });

  it('descarta requisicao que falhou ou que ainda nao terminou', () => {
    const falhou = [
      linha('sync concluido', 'r1', null, { recebidos_nbs: 12 }, '2026-11-25T03:00:00Z'),
      linha('request_end', 'r1', 502, {}, '2026-11-25T03:00:00Z'),
    ];
    expect(escolherRunComEscopo('nbs', falhou)).toBeNull();
    const semFim = [
      linha('sync concluido', 'r1', null, { recebidos_nbs: 12 }, '2026-11-25T03:00:00Z'),
    ];
    expect(escolherRunComEscopo('nbs', semFim)).toBeNull();
  });

  it('nao deixa a rotina diaria datar o escopo municipal', () => {
    const diaria = [
      linha(
        'sync concluido',
        'diaria',
        null,
        { escopo: 'uf', uf_consultados: 27, municipio_consultados: 0 },
        '2026-11-25T03:00:00Z'
      ),
      linha('request_end', 'diaria', 200, {}, '2026-11-25T03:00:00Z'),
    ];
    expect(escolherRunComEscopo('aliquota_ibs_mun', diaria)).toBeNull();

    const semanal = [
      linha(
        'sync concluido',
        'semanal',
        null,
        { escopo: 'municipio', municipio_consultados: 40, municipio_gravados: 0 },
        '2026-11-23T03:00:00Z'
      ),
      linha('request_end', 'semanal', 200, {}, '2026-11-23T03:00:00Z'),
      ...diaria,
    ];
    expect(escolherRunComEscopo('aliquota_ibs_mun', semanal)).toBe('2026-11-23T03:00:00Z');
  });
});
