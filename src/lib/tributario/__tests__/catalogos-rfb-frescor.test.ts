import { describe, expect, it } from 'vitest';
import {
  avaliarFrescorCatalogosRfb,
  DIAS_ALERTA_CATALOGO_RFB,
  TITULOS_CATALOGO_RFB,
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

  it('trata o dia do limite como em dia e o seguinte como alerta', () => {
    const limite = avaliarFrescorCatalogosRfb(
      [{ id: 'aliquota', ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB) }],
      HOJE
    );
    expect(limite.catalogos[0].status).toBe('ok');
    expect(limite.status).toBe('ok');

    const passou = avaliarFrescorCatalogosRfb(
      [{ id: 'aliquota', ultimaCarga: emDias(DIAS_ALERTA_CATALOGO_RFB + 1) }],
      HOJE
    );
    expect(passou.catalogos[0].status).toBe('atencao');
    expect(passou.desatualizados).toBe(1);
    expect(passou.resumo).toContain('mais de 7 dias');
  });

  it('agrega o pior status e conta cada grupo', () => {
    const r = avaliarFrescorCatalogosRfb(
      [
        { id: 'cclasstrib', ultimaCarga: emDias(1), versaoIt: '1.71' },
        { id: 'ncm', ultimaCarga: emDias(9) },
        { id: 'aliquota', ultimaCarga: emDias(30) },
        { id: 'fundamentacao', ultimaCarga: null },
      ],
      HOJE
    );
    expect(r.status).toBe('critico');
    expect(r.desatualizados).toBe(2);
    expect(r.nuncaSincronizados).toBe(1);
    expect(r.resumo).toContain('1 catálogo nunca sincronizado');
    expect(r.resumo).toContain('2 catálogos sem sincronizar há mais de 7 dias');
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
    expect(r.resumo).toContain('últimos 7 dias');
  });
});
