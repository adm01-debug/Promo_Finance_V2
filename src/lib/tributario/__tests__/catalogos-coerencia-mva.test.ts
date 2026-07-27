/**
 * Guarda de coerência do catálogo de MVA/ST: valida o lastro dos protocolos
 * de substituição tributária frente ao catálogo de NCMs e às regras
 * estruturais do overlay, incluindo um fuzz determinístico de 400 cenários.
 */

import { describe, expect, it } from 'vitest';
import { compararMvaComCatalogo } from '@/lib/tributario/catalogos/coerencia-mva';
import { gerarAlertasCatalogos } from '@/lib/tributario/catalogos/alertas';
import type { NcmBanco } from '@/lib/tributario/catalogos/coerencia-ncm';
import type {
  RegistroProtocoloNcmBanco,
  RegistroProtocoloUfBanco,
} from '@/lib/tributario/icms/overlay-mva';
import { UFS } from '@/lib/tributario/icms/tabelas';

function ncm(codigo: string, over: Partial<NcmBanco> = {}): NcmBanco {
  return {
    codigo,
    descricao: 'teste',
    aliquota_ipi: 0,
    monofasico_pis_cofins: false,
    sujeito_st: true,
    mva_padrao: 0.4,
    ...over,
  };
}

function vinculo(over: Partial<RegistroProtocoloNcmBanco> = {}): RegistroProtocoloNcmBanco {
  return {
    protocolo_id: 'p41',
    protocolo_codigo: 'ICMS 41/2008',
    ncm_codigo: '40111000',
    mva_original: 0.4,
    vigente_de: '2008-01-01',
    vigente_ate: null,
    ...over,
  };
}

const todasUfs = (id = 'p41'): RegistroProtocoloUfBanco[] =>
  UFS.map((uf) => ({ protocolo_id: id, uf, papel: 'AMBOS' }));

describe('coerência do catálogo de MVA/ST', () => {
  it('não acusa divergência quando o catálogo está íntegro', () => {
    const d = compararMvaComCatalogo({
      vinculos: [vinculo()],
      ufs: todasUfs(),
      ncms: [ncm('40111000')],
    });
    expect(d).toEqual([]);
  });

  it('acusa NCM sujeito à ST sem protocolo vigente', () => {
    const d = compararMvaComCatalogo({
      vinculos: [],
      ufs: [],
      ncms: [ncm('40111000')],
    });
    expect(d).toEqual([
      { item: 'NCM 40111000', campo: 'sem_protocolo', valorCodigo: true, valorBanco: null },
    ]);
  });

  it('acusa MVA fora dos limites defensivos', () => {
    const campos = compararMvaComCatalogo({
      vinculos: [
        vinculo({ ncm_codigo: '40111000', mva_original: 0 }),
        vinculo({ protocolo_id: 'p85', ncm_codigo: '40112010', mva_original: 900 }),
      ],
      ufs: [...todasUfs(), ...todasUfs('p85')],
      ncms: [ncm('40111000'), ncm('40112010')],
    }).map((d) => d.campo);
    expect(campos.filter((c) => c === 'mva_invalida')).toHaveLength(2);
  });

  it('acusa divergência entre a MVA do protocolo e a mva_padrao do NCM', () => {
    const d = compararMvaComCatalogo({
      vinculos: [vinculo({ mva_original: 0.55 })],
      ufs: todasUfs(),
      ncms: [ncm('40111000', { mva_padrao: 0.4 })],
    });
    expect(d).toEqual([
      { item: 'NCM 40111000', campo: 'mva_divergente', valorCodigo: 0.4, valorBanco: 0.55 },
    ]);
  });

  it('acusa vínculo duplicado, vigência invertida e UF inválida', () => {
    const campos = compararMvaComCatalogo({
      vinculos: [
        vinculo({ vigente_de: '2020-01-01', vigente_ate: '2019-01-01' }),
        vinculo(),
      ],
      ufs: [...todasUfs(), { protocolo_id: 'p41', uf: 'XX', papel: 'AMBOS' }],
      ncms: [ncm('40111000')],
    }).map((d) => d.campo);
    expect(campos).toContain('vigencia_invalida');
    expect(campos).toContain('vinculo_duplicado');
    expect(campos).toContain('uf_invalida');
  });

  it('acusa protocolo sem UFs signatárias e cobertura parcial', () => {
    const semUfs = compararMvaComCatalogo({
      vinculos: [vinculo()],
      ufs: [],
      ncms: [ncm('40111000')],
    });
    expect(semUfs.map((d) => d.campo)).toContain('protocolo_sem_ufs');

    const parcial = compararMvaComCatalogo({
      vinculos: [vinculo()],
      ufs: [{ protocolo_id: 'p41', uf: 'SP', papel: 'ORIGEM' }],
      ncms: [ncm('40111000')],
    });
    const cobertura = parcial.find((d) => d.campo === 'cobertura_parcial');
    expect(cobertura).toMatchObject({ valorCodigo: 27, valorBanco: 1 });
  });

  it('acusa NCM desconhecido pelo catálogo e código malformado', () => {
    const campos = compararMvaComCatalogo({
      vinculos: [vinculo({ ncm_codigo: '123' }), vinculo({ ncm_codigo: '99999999' })],
      ufs: todasUfs(),
      ncms: [ncm('40111000', { sujeito_st: false })],
    }).map((d) => d.campo);
    expect(campos.filter((c) => c === 'ncm_desconhecido')).toHaveLength(2);
  });

  it('propaga as divergências para os alertas proativos do dashboard', () => {
    const resumo = gerarAlertasCatalogos({
      ufs: [],
      interestaduais: [],
      faixas: [],
      ncms: [ncm('40111000')],
      mvaSt: { vinculos: [vinculo({ mva_original: -1 })], ufs: [] },
    });
    const doMva = resumo.alertas.filter((a) => a.catalogo === 'protocolos_st');
    expect(doMva.length).toBeGreaterThan(0);
    expect(doMva.every((a) => a.catalogoTitulo === 'Protocolos de ST (MVA)')).toBe(true);
    expect(doMva.some((a) => a.severidade === 'critico')).toBe(true);
  });

  it('fuzz determinístico: 400 catálogos aleatórios nunca lançam exceção', () => {
    let seed = 20260727;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const mvas: Array<number | string | null> = [0.4, 40, '40,25', -3, 0, 999, null, 'abc'];
    const codigos = ['40111000', '123', '', null, '87082999', '9999999999'];

    for (let i = 0; i < 400; i++) {
      const vinculos = Array.from({ length: 1 + Math.floor(rnd() * 5) }, () =>
        vinculo({
          protocolo_id: `p${Math.floor(rnd() * 3)}`,
          ncm_codigo: codigos[Math.floor(rnd() * codigos.length)] as string | null,
          mva_original: mvas[Math.floor(rnd() * mvas.length)],
          vigente_de: rnd() > 0.8 ? 'data-ruim' : '2010-01-01',
          vigente_ate: rnd() > 0.9 ? '2000-01-01' : null,
        }),
      );
      const ufs = Array.from({ length: Math.floor(rnd() * 30) }, () => ({
        protocolo_id: `p${Math.floor(rnd() * 3)}`,
        uf: rnd() > 0.9 ? 'ZZ' : UFS[Math.floor(rnd() * UFS.length)],
        papel: 'AMBOS',
      }));
      const catalogo = [ncm('40111000', { sujeito_st: rnd() > 0.5 }), ncm('87082999')];

      const divergencias = compararMvaComCatalogo({ vinculos, ufs, ncms: catalogo });
      expect(Array.isArray(divergencias)).toBe(true);
      for (const d of divergencias) {
        expect(typeof d.item).toBe('string');
        expect(d.item.length).toBeGreaterThan(0);
        expect(typeof d.campo).toBe('string');
      }
    }
  });
});
