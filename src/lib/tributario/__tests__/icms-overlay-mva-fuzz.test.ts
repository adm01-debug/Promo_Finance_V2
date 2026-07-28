/**
 * SIMULAÇÃO EM MASSA (FUZZING) DO OVERLAY DE MVA/ST
 *
 * Objetivo: antecipar falhas e lacunas antes da carga real dos protocolos.
 * Centenas de cenários pseudoaleatórios (determinísticos por seed) exercitam
 * o overlay e o motor de ICMS-ST buscando violar invariantes jurídicas e
 * numéricas. Nenhuma entrada — por mais suja que seja — pode gerar exceção,
 * NaN, MVA fora de faixa ou retenção em operação sem tributação subsequente.
 */

import { describe, expect, it, afterEach } from 'vitest';
import {
  aplicarOverlayMvaSt,
  definirIndiceMvaStEfetivo,
  resetarIndiceMvaStEfetivo,
  resolverMvaSt,
  MVA_MAXIMA,
  SITUACOES_SEM_ST,
  type RegistroProtocoloNcmBanco,
  type RegistroProtocoloUfBanco,
} from '@/lib/tributario/icms/overlay-mva';
import { calcularIcmsSt } from '@/lib/tributario/icms/st';
import { UFS } from '@/lib/tributario/icms/tabelas';
import type { SituacaoIcmsSt, UF } from '@/lib/tributario/icms/types';
import type { ResultadoOverlayMva } from '@/lib/tributario/icms/overlay-mva';

/** PRNG determinístico (mulberry32) — reprodutibilidade total das falhas. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SITUACOES: SituacaoIcmsSt[] = [
  'tributada', 'isenta', 'nao_tributada', 'aliquota_zero', 'imune', 'suspensa',
];

const NCM_SUJOS: Array<string | null> = [
  '87082999', '2203.00.00', '  33030010  ', '8708', '', null, 'ABCDEFGH',
  '870829990', '3303.00.10',
];

const MVA_SUJAS: Array<number | string | null> = [
  0.4025, 40.25, '71,78', '0.5', 0, -3, 1200, Number.NaN, Number.POSITIVE_INFINITY,
  null, '', 'abc', 1, 100, 299.9, 300.1,
];

const DATAS: Array<string | null> = [
  null, '2000-01-01', '2020-12-31', '2026-01-01', '2030-01-01', 'ontem', '2026-13-45',
];

function escolher<T>(rnd: () => number, lista: readonly T[]): T {
  return lista[Math.floor(rnd() * lista.length) % lista.length];
}

interface Cenario {
  ncms: RegistroProtocoloNcmBanco[];
  ufs: RegistroProtocoloUfBanco[];
  regras: Record<string, { sujeitoSt?: boolean | null; situacao?: SituacaoIcmsSt | null }>;
  referencia: string | null;
  ufOrigem: UF;
  ufDestino: UF;
  situacao: SituacaoIcmsSt;
  valorProduto: number;
  pmpf: number;
  mvaManual: number | undefined;
  ncmConsulta: string;
}

function gerarCenario(rnd: () => number): Cenario {
  const qtdProtocolos = 1 + Math.floor(rnd() * 3);
  const ncms: RegistroProtocoloNcmBanco[] = [];
  const ufs: RegistroProtocoloUfBanco[] = [];

  for (let p = 0; p < qtdProtocolos; p += 1) {
    const protocoloId = rnd() < 0.05 ? '' : `p${p}`;
    const papeis = ['ORIGEM', 'DESTINO', 'AMBOS', 'remetente', null, ''];
    const qtdUfs = Math.floor(rnd() * 4);
    for (let u = 0; u < qtdUfs; u += 1) {
      ufs.push({
        protocolo_id: protocoloId,
        uf: rnd() < 0.1 ? escolher(rnd, ['XX', '', null, 'sp']) : escolher(rnd, UFS),
        papel: escolher(rnd, papeis),
      });
    }
    const qtdNcms = 1 + Math.floor(rnd() * 3);
    for (let n = 0; n < qtdNcms; n += 1) {
      ncms.push({
        protocolo_id: protocoloId,
        protocolo_codigo: rnd() < 0.2 ? null : `ICMS ${p}/2020`,
        ncm_codigo: escolher(rnd, NCM_SUJOS),
        mva_original: escolher(rnd, MVA_SUJAS),
        cest: rnd() < 0.5 ? '01.049.00' : null,
        vigente_de: escolher(rnd, DATAS),
        vigente_ate: escolher(rnd, DATAS),
      });
    }
  }

  const regras: Cenario['regras'] = {};
  if (rnd() < 0.6) {
    regras['87082999'] = {
      sujeitoSt: rnd() < 0.5 ? true : rnd() < 0.5 ? false : null,
      situacao: rnd() < 0.5 ? escolher(rnd, SITUACOES) : null,
    };
  }

  return {
    ncms,
    ufs,
    regras,
    referencia: escolher(rnd, DATAS),
    ufOrigem: escolher(rnd, UFS),
    ufDestino: escolher(rnd, UFS),
    situacao: escolher(rnd, SITUACOES),
    valorProduto: escolher(rnd, [0, 1, 1234.56, 10_000, 9_999_999, -50, Number.NaN]),
    pmpf: escolher(rnd, [0, 5_000, 25_000, -1]),
    mvaManual: escolher(rnd, [undefined, 0, 0.4, 2.9, -1, Number.NaN]),
    ncmConsulta: escolher(rnd, NCM_SUJOS) ?? '',
  };
}

const TOTAL_CENARIOS = 750;

describe('fuzzing do overlay de MVA/ST — 750 cenários', () => {
  afterEach(() => resetarIndiceMvaStEfetivo());

  it('nenhuma entrada malformada quebra o overlay ou viola invariantes', () => {
    const rnd = prng(20260727);
    const falhas: string[] = [];

    for (let i = 0; i < TOTAL_CENARIOS; i += 1) {
      const c = gerarCenario(rnd);
      let resultado: ResultadoOverlayMva;
      try {
        resultado = aplicarOverlayMvaSt({
          ncms: c.ncms, ufs: c.ufs, regras: c.regras, referencia: c.referencia,
        });
      } catch (erro) {
        falhas.push(`#${i} exceção no overlay: ${String(erro)}`);
        continue;
      }

      for (const entrada of resultado.aplicadas) {
        if (!/^\d{8}$/.test(entrada.ncm)) falhas.push(`#${i} NCM inválido indexado: ${entrada.ncm}`);
        if (!Number.isFinite(entrada.mvaOriginal)) falhas.push(`#${i} MVA não finita`);
        if (entrada.mvaOriginal < 0 || entrada.mvaOriginal > MVA_MAXIMA) {
          falhas.push(`#${i} MVA fora da faixa: ${entrada.mvaOriginal}`);
        }
        if (entrada.origens.length === 0 && entrada.destinos.length === 0) {
          falhas.push(`#${i} entrada sem UF signatária`);
        }
      }

      // O índice não pode conter entradas duplicadas por protocolo.
      for (const [ncm, entradas] of Object.entries(resultado.indice)) {
        const chaves = entradas.map((e) => e.protocoloId);
        if (new Set(chaves).size !== chaves.length) falhas.push(`#${i} protocolo duplicado em ${ncm}`);
      }

      // Bloqueios jurídicos jamais viram MVA aplicável.
      for (const bloqueio of resultado.bloqueadas) {
        const noIndice = (resultado.indice[bloqueio.ncm] ?? []).some(
          (e) => e.protocoloId === bloqueio.protocolo || e.protocoloCodigo === bloqueio.protocolo,
        );
        if (noIndice) falhas.push(`#${i} bloqueio ${bloqueio.motivo} vazou para o índice`);
      }

      definirIndiceMvaStEfetivo(resultado.indice);

      let resolucao;
      try {
        resolucao = resolverMvaSt({
          ncm: c.ncmConsulta, ufOrigem: c.ufOrigem, ufDestino: c.ufDestino, situacao: c.situacao,
        });
      } catch (erro) {
        falhas.push(`#${i} exceção na resolução: ${String(erro)}`);
        continue;
      }

      if (!Number.isFinite(resolucao.mvaOriginal) || resolucao.mvaOriginal < 0) {
        falhas.push(`#${i} MVA resolvida inválida: ${resolucao.mvaOriginal}`);
      }
      if (SITUACOES_SEM_ST.includes(c.situacao) && resolucao.mvaOriginal !== 0) {
        falhas.push(`#${i} MVA resolvida em operação ${c.situacao}`);
      }
      if (resolucao.encontrado) {
        const entradas = resolucao.protocoloId
          ? (resultado.indice[c.ncmConsulta.replace(/\D/g, '')] ?? [])
          : [];
        const casa = entradas.some(
          (e) => e.origens.includes(c.ufOrigem) && e.destinos.includes(c.ufDestino),
        );
        if (!casa) falhas.push(`#${i} MVA resolvida sem casamento de UFs signatárias`);
      }

      let calculo;
      try {
        calculo = calcularIcmsSt({
          ufOrigem: c.ufOrigem,
          ufDestino: c.ufDestino,
          valorProduto: c.valorProduto,
          ncm: c.ncmConsulta,
          situacaoIcms: c.situacao,
          mvaOriginal: c.mvaManual,
          pmpf: c.pmpf,
          aplicarFcp: true,
        });
      } catch (erro) {
        falhas.push(`#${i} exceção no motor de ST: ${String(erro)}`);
        continue;
      }

      for (const [campo, valor] of Object.entries({
        baseSt: calculo.baseSt, icmsSt: calculo.icmsSt, fcpSt: calculo.fcpSt,
        icmsProprio: calculo.icmsProprio, totalRecolher: calculo.totalRecolher,
        mvaOriginal: calculo.mvaOriginal, mvaAjustada: calculo.mvaAjustada,
      })) {
        if (!Number.isFinite(valor)) falhas.push(`#${i} ${campo} não finito`);
        if (valor < 0) falhas.push(`#${i} ${campo} negativo: ${valor}`);
      }

      if (SITUACOES_SEM_ST.includes(c.situacao)) {
        if (calculo.totalRecolher !== 0 || calculo.baseSt !== 0 || calculo.icmsSt !== 0 || calculo.fcpSt !== 0) {
          falhas.push(`#${i} retenção de ST em operação ${c.situacao}`);
        }
        if (!calculo.stAfastadaPorRegraJuridica) falhas.push(`#${i} bandeira jurídica não sinalizada`);
      }

      if (calculo.totalRecolher !== 0) {
        const soma = Math.round((calculo.icmsSt + calculo.fcpSt) * 100) / 100;
        if (Math.abs(soma - calculo.totalRecolher) > 0.011) {
          falhas.push(`#${i} total divergente da soma das rubricas`);
        }
      }

      resetarIndiceMvaStEfetivo();
    }

    expect(falhas.slice(0, 15)).toEqual([]);
  });

  it('monotonicidade: MVA maior nunca reduz o ICMS-ST, mantidos os demais parâmetros', () => {
    const rnd = prng(777);
    const falhas: string[] = [];
    for (let i = 0; i < 200; i += 1) {
      const ufOrigem = escolher(rnd, UFS);
      const ufDestino = escolher(rnd, UFS);
      const valorProduto = 500 + rnd() * 50_000;
      const menor = rnd() * 1.2;
      const maior = menor + 0.05 + rnd();
      const base = { ufOrigem, ufDestino, valorProduto, aplicarFcp: true } as const;
      const a = calcularIcmsSt({ ...base, mvaOriginal: menor });
      const b = calcularIcmsSt({ ...base, mvaOriginal: maior });
      if (b.icmsSt + 0.011 < a.icmsSt) {
        falhas.push(`#${i} ${ufOrigem}->${ufDestino} MVA ${menor}->${maior} reduziu ST`);
      }
      if (b.baseSt + 0.011 < a.baseSt) falhas.push(`#${i} base ST regrediu`);
    }
    expect(falhas.slice(0, 10)).toEqual([]);
  });

  it('operação interna converge a MVA ajustada para a MVA original em todas as UFs', () => {
    const falhas: string[] = [];
    for (const uf of UFS) {
      const r = calcularIcmsSt({ ufOrigem: uf, ufDestino: uf, valorProduto: 10_000, mvaOriginal: 0.4 });
      if (Math.abs(r.mvaAjustada - 0.4) > 1e-9) falhas.push(`${uf}: ${r.mvaAjustada}`);
    }
    expect(falhas).toEqual([]);
  });
});
