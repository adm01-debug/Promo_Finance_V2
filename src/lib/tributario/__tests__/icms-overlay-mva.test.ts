import { describe, expect, it, afterEach } from 'vitest';
import {
  aplicarOverlayMvaSt,
  definirIndiceMvaStEfetivo,
  resetarIndiceMvaStEfetivo,
  resolverMvaSt,
  descreverBloqueiosMva,
  descreverRejeicoesMva,
  type RegistroProtocoloNcmBanco,
  type RegistroProtocoloUfBanco,
} from '@/lib/tributario/icms/overlay-mva';
import { calcularIcmsSt } from '@/lib/tributario/icms/st';

const UFS_PROTOCOLO: RegistroProtocoloUfBanco[] = [
  { protocolo_id: 'p1', uf: 'SP', papel: 'ORIGEM' },
  { protocolo_id: 'p1', uf: 'BA', papel: 'DESTINO' },
];

const NCM_AUTOPECA: RegistroProtocoloNcmBanco = {
  protocolo_id: 'p1',
  protocolo_codigo: 'ICMS 41/2008',
  ncm_codigo: '87082999',
  mva_original: 40.25,
  cest: '01.049.00',
  vigente_de: '2008-01-01',
  vigente_ate: null,
};

afterEach(() => resetarIndiceMvaStEfetivo());

describe('overlay de MVA/ST — validação defensiva', () => {
  it('normaliza MVA em percentual e indexa por NCM', () => {
    const r = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: UFS_PROTOCOLO });
    expect(r.rejeitadas).toHaveLength(0);
    expect(r.indice['87082999'][0].mvaOriginal).toBeCloseTo(0.4025, 6);
    expect(r.indice['87082999'][0].origens).toEqual(['SP']);
  });

  it('rejeita NCM fora do formato, MVA acima do teto e duplicidade', () => {
    const r = aplicarOverlayMvaSt({
      ncms: [
        { ...NCM_AUTOPECA, ncm_codigo: '8708' },
        { ...NCM_AUTOPECA, ncm_codigo: '87089900', mva_original: 900 },
        NCM_AUTOPECA,
        { ...NCM_AUTOPECA },
      ],
      ufs: UFS_PROTOCOLO,
    });
    const motivos = r.rejeitadas.map((x) => x.motivo);
    expect(motivos).toContain('ncm_invalido');
    expect(motivos).toContain('mva_fora_da_faixa');
    expect(motivos).toContain('duplicado');
    expect(descreverRejeicoesMva(r.rejeitadas)[0]).toContain('Protocolo ICMS 41/2008');
  });

  it('rejeita vínculo sem UF signatária válida', () => {
    const r = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: [] });
    expect(r.rejeitadas[0].motivo).toBe('sem_uf_signataria');
    expect(r.indice['87082999']).toBeUndefined();
  });

  it('descarta vínculo fora de vigência sem tratar como erro', () => {
    const r = aplicarOverlayMvaSt({
      ncms: [{ ...NCM_AUTOPECA, vigente_ate: '2020-12-31' }],
      ufs: UFS_PROTOCOLO,
      referencia: '2026-01-01',
    });
    expect(r.rejeitadas).toHaveLength(0);
    expect(r.aplicadas).toHaveLength(0);
  });
});

describe('preservação das regras jurídicas', () => {
  it('bloqueia MVA de NCM não sujeito a ST', () => {
    const r = aplicarOverlayMvaSt({
      ncms: [NCM_AUTOPECA],
      ufs: UFS_PROTOCOLO,
      regras: { '87082999': { sujeitoSt: false } },
    });
    expect(r.aplicadas).toHaveLength(0);
    expect(r.bloqueadas[0].motivo).toBe('ncm_nao_sujeito_st');
    expect(descreverBloqueiosMva(r.bloqueadas)[0]).toContain('não aplicada');
  });

  it.each(['isenta', 'nao_tributada', 'aliquota_zero'] as const)(
    'bloqueia MVA em operação %s',
    (situacao) => {
      const r = aplicarOverlayMvaSt({
        ncms: [NCM_AUTOPECA],
        ufs: UFS_PROTOCOLO,
        regras: { '87082999': { situacao } },
      });
      expect(r.aplicadas).toHaveLength(0);
      expect(r.bloqueadas).toHaveLength(1);
    },
  );
});

describe('resolução em runtime', () => {
  it('resolve somente o par de UFs signatárias', () => {
    const { indice } = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: UFS_PROTOCOLO });
    definirIndiceMvaStEfetivo(indice);

    expect(resolverMvaSt({ ncm: '87082999', ufOrigem: 'SP', ufDestino: 'BA' }).encontrado).toBe(true);
    // BA não é signatária como remetente nesse protocolo.
    expect(resolverMvaSt({ ncm: '87082999', ufOrigem: 'BA', ufDestino: 'SP' }).encontrado).toBe(false);
  });

  it('prevalece a maior MVA quando há protocolos concorrentes', () => {
    const { indice } = aplicarOverlayMvaSt({
      ncms: [
        NCM_AUTOPECA,
        { ...NCM_AUTOPECA, protocolo_id: 'p2', protocolo_codigo: 'ICMS 97/2010', mva_original: 71.78 },
      ],
      ufs: [...UFS_PROTOCOLO, { protocolo_id: 'p2', uf: 'SP', papel: 'AMBOS' }, { protocolo_id: 'p2', uf: 'BA', papel: 'AMBOS' }],
    });
    definirIndiceMvaStEfetivo(indice);
    const r = resolverMvaSt({ ncm: '87082999', ufOrigem: 'SP', ufDestino: 'BA' });
    expect(r.mvaOriginal).toBeCloseTo(0.7178, 6);
    expect(r.alertas.some((a) => a.includes('protocolos aplicáveis'))).toBe(true);
  });
});

describe('motor de ICMS-ST com overlay', () => {
  it('usa a MVA do protocolo quando não há MVA informada', () => {
    const { indice } = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: UFS_PROTOCOLO });
    definirIndiceMvaStEfetivo(indice);

    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'BA', valorProduto: 10_000, ncm: '87082999',
    });
    expect(r.protocoloSt).toBe('ICMS 41/2008');
    expect(r.cestSt).toBe('01.049.00');
    expect(r.mvaOriginal).toBeCloseTo(0.4025, 6);
    expect(r.icmsSt).toBeGreaterThan(0);
  });

  it('MVA informada manualmente prevalece sobre o protocolo', () => {
    const { indice } = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: UFS_PROTOCOLO });
    definirIndiceMvaStEfetivo(indice);

    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'BA', valorProduto: 10_000, ncm: '87082999', mvaOriginal: 0.5,
    });
    expect(r.mvaOriginal).toBeCloseTo(0.5, 6);
    expect(r.protocoloSt).toBeNull();
  });

  it('afasta a ST integralmente em operação isenta, ainda que haja MVA', () => {
    const { indice } = aplicarOverlayMvaSt({ ncms: [NCM_AUTOPECA], ufs: UFS_PROTOCOLO });
    definirIndiceMvaStEfetivo(indice);

    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'BA', valorProduto: 10_000, ncm: '87082999',
      mvaOriginal: 0.4025, situacaoIcms: 'isenta', aplicarFcp: true, pmpf: 20_000,
    });
    expect(r.stAfastadaPorRegraJuridica).toBe(true);
    expect(r.baseSt).toBe(0);
    expect(r.icmsSt).toBe(0);
    expect(r.fcpSt).toBe(0);
    expect(r.totalRecolher).toBe(0);
  });

  it('mantém compatibilidade com chamadas sem NCM', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'BA', valorProduto: 10_000, mvaOriginal: 0.4025,
    });
    expect(r.protocoloSt).toBeNull();
    expect(r.mvaOriginal).toBeCloseTo(0.4025, 6);
    expect(r.icmsSt).toBeGreaterThan(0);
  });
});
