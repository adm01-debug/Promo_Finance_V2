/**
 * Testes do resumo de cobertura do overlay de MVA/ST e da carga real de
 * protocolos, reproduzindo os registros semeados no catálogo versionado.
 */

import { describe, expect, it } from 'vitest';
import {
  aplicarOverlayMvaSt,
  type RegistroProtocoloNcmBanco,
  type RegistroProtocoloUfBanco,
} from '@/lib/tributario/icms/overlay-mva';
import { resumirOverlayMvaSt, formatarFaixaMva } from '@/lib/tributario/catalogos/resumo-mva';
import { UFS } from '@/lib/tributario/icms/tabelas';

/** Espelho da carga aplicada no banco (protocolos nacionais). */
const CARGA: Array<[string, string, string, number]> = [
  ['p41', 'ICMS 41/2008', '87082999', 0.3656],
  ['p41', 'ICMS 41/2008', '87089990', 0.3656],
  ['p41', 'ICMS 41/2008', '87083090', 0.3656],
  ['p41', 'ICMS 41/2008', '87081000', 0.3656],
  ['p41', 'ICMS 41/2008', '85122029', 0.3656],
  ['p85', 'ICMS 85/1993', '40111000', 0.42],
  ['p85', 'ICMS 85/1993', '40112010', 0.42],
  ['p85', 'ICMS 85/1993', '40130010', 0.45],
  ['p11', 'ICM 11/1985', '25232910', 0.2],
  ['p11', 'ICM 11/1985', '25232100', 0.2],
];

const ncms: RegistroProtocoloNcmBanco[] = CARGA.map(([id, codigo, ncm, mva]) => ({
  protocolo_id: id,
  protocolo_codigo: codigo,
  ncm_codigo: ncm,
  mva_original: mva,
  cest: null,
  vigente_de: '1985-10-01',
  vigente_ate: null,
}));

const ufs: RegistroProtocoloUfBanco[] = ['p41', 'p85', 'p11'].flatMap((id) =>
  UFS.map((uf) => ({ protocolo_id: id, uf, papel: 'AMBOS' })),
);

describe('resumo de cobertura da carga real de protocolos', () => {
  const overlay = aplicarOverlayMvaSt({ ncms, ufs });
  const resumo = resumirOverlayMvaSt(overlay);

  it('aceita integralmente a carga semeada, sem rejeições', () => {
    expect(overlay.rejeitadas).toEqual([]);
    expect(overlay.bloqueadas).toEqual([]);
    expect(resumo.totalVinculos).toBe(CARGA.length);
    expect(resumo.totalNcms).toBe(CARGA.length);
  });

  it('cobre as 27 unidades federadas em todos os protocolos', () => {
    expect(resumo.totalProtocolos).toBe(3);
    expect(resumo.ufsCobertas).toHaveLength(27);
    expect(resumo.ufsSemCobertura).toEqual([]);
    expect(resumo.situacao).toBe('ok');
    for (const p of resumo.protocolos) expect(p.ufsAusentes).toEqual([]);
  });

  it('descreve a faixa de MVA por protocolo', () => {
    const porCodigo = Object.fromEntries(resumo.protocolos.map((p) => [p.protocoloCodigo, p]));
    expect(formatarFaixaMva(porCodigo['ICMS 41/2008'])).toBe('36.56%');
    expect(formatarFaixaMva(porCodigo['ICMS 85/1993'])).toBe('42.00% a 45.00%');
    expect(formatarFaixaMva(porCodigo['ICM 11/1985'])).toBe('20.00%');
  });

  it('sinaliza cobertura parcial quando faltam UFs signatárias', () => {
    const parcial = aplicarOverlayMvaSt({
      ncms: ncms.filter((n) => n.protocolo_id === 'p41'),
      ufs: [
        { protocolo_id: 'p41', uf: 'SP', papel: 'ORIGEM' },
        { protocolo_id: 'p41', uf: 'BA', papel: 'DESTINO' },
      ],
    });
    const r = resumirOverlayMvaSt(parcial);
    expect(r.situacao).toBe('parcial');
    expect(r.ufsSemCobertura.length).toBe(25);
    expect(r.protocolos[0].origens).toEqual(['SP']);
    expect(r.protocolos[0].destinos).toEqual(['BA']);
  });

  it('reporta situação vazia quando não há protocolo com efeito', () => {
    const r = resumirOverlayMvaSt(aplicarOverlayMvaSt({ ncms: [], ufs: [] }));
    expect(r.situacao).toBe('vazio');
    expect(r.totalProtocolos).toBe(0);
    expect(r.ufsSemCobertura).toHaveLength(27);
  });
});
