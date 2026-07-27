import { describe, expect, it } from 'vitest';
import {
  aliquotaInterestadualEsperada,
  resumirPainelCatalogos,
  validarInterestaduais,
} from '../catalogos/painel';
import { ALIQUOTAS_UF } from '../icms/tabelas';
import { obterAnexo } from '../aliquotas-simples';
import type {
  AliquotaInterestadualCatalogo,
  FaixaSimplesCatalogo,
  UfCatalogo,
} from '../catalogos/types';
import type { AnexoSimples } from '../types';

const REGIOES: Record<string, UfCatalogo['regiao']> = {
  AC: 'NORTE', AM: 'NORTE', AP: 'NORTE', PA: 'NORTE', RO: 'NORTE', RR: 'NORTE', TO: 'NORTE',
  AL: 'NORDESTE', BA: 'NORDESTE', CE: 'NORDESTE', MA: 'NORDESTE', PB: 'NORDESTE',
  PE: 'NORDESTE', PI: 'NORDESTE', RN: 'NORDESTE', SE: 'NORDESTE',
  DF: 'CENTRO_OESTE', GO: 'CENTRO_OESTE', MS: 'CENTRO_OESTE', MT: 'CENTRO_OESTE',
  ES: 'SUDESTE', MG: 'SUDESTE', RJ: 'SUDESTE', SP: 'SUDESTE',
  PR: 'SUL', RS: 'SUL', SC: 'SUL',
};

function ufsCoerentes(): UfCatalogo[] {
  return Object.entries(REGIOES).map(([sigla, regiao], i) => ({
    sigla,
    nome: sigla,
    codigo_ibge: 10 + i,
    regiao,
    aliquota_interna_padrao: ALIQUOTAS_UF[sigla as keyof typeof ALIQUOTAS_UF].interna,
    aliquota_fcp: ALIQUOTAS_UF[sigla as keyof typeof ALIQUOTAS_UF].fcp,
    possui_fcp: ALIQUOTAS_UF[sigla as keyof typeof ALIQUOTAS_UF].fcp > 0,
    exige_antecipacao: false,
    difal_base_dupla: true,
  }));
}

function interestaduaisCoerentes(ufs: readonly UfCatalogo[]): AliquotaInterestadualCatalogo[] {
  const linhas: AliquotaInterestadualCatalogo[] = [];
  for (const origem of ufs) {
    for (const destino of ufs) {
      if (origem.sigla === destino.sigla) continue;
      linhas.push({
        uf_origem: origem.sigla,
        uf_destino: destino.sigla,
        aliquota: aliquotaInterestadualEsperada(origem, destino),
        aliquota_importado: 0.04,
        vigente_de: '2024-01-01',
        vigente_ate: null,
      });
    }
  }
  return linhas;
}

function faixasCoerentes(): FaixaSimplesCatalogo[] {
  const anexos: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V'];
  return anexos.flatMap((anexo) =>
    obterAnexo(anexo).map((f) => ({
      anexo,
      faixa: f.faixa,
      rbt12_de: f.rbt12_de,
      rbt12_ate: f.rbt12_ate,
      aliquota: f.aliquota,
      parcela_deduzir: f.pd,
      vigente_de: '2024-01-01',
      vigente_ate: null,
    })),
  );
}

describe('painel de catálogos fiscais', () => {
  const ufs = ufsCoerentes();
  const inter = interestaduaisCoerentes(ufs);
  const faixas = faixasCoerentes();

  it('reconhece o cenário 100% coerente', () => {
    const resumo = resumirPainelCatalogos({ ufs, interestaduais: inter, faixas });
    expect(resumo.situacaoGeral).toBe('ok');
    expect(resumo.totalProblemas).toBe(0);
    expect(resumo.catalogos).toHaveLength(3);
    expect(resumo.totalRegistros).toBe(27 + 702 + faixas.length);
  });

  it('aplica a regra constitucional de 7% e 12%', () => {
    const sp = ufs.find((u) => u.sigla === 'SP')!;
    const ba = ufs.find((u) => u.sigla === 'BA')!;
    const es = ufs.find((u) => u.sigla === 'ES')!;
    const rj = ufs.find((u) => u.sigla === 'RJ')!;
    expect(aliquotaInterestadualEsperada(sp, ba)).toBe(0.07);
    expect(aliquotaInterestadualEsperada(sp, es)).toBe(0.07);
    expect(aliquotaInterestadualEsperada(es, sp)).toBe(0.12);
    expect(aliquotaInterestadualEsperada(ba, rj)).toBe(0.12);
    expect(aliquotaInterestadualEsperada(sp, rj)).toBe(0.12);
  });

  it('detecta alíquota interestadual adulterada', () => {
    const adulterado = inter.map((a, i) => (i === 0 ? { ...a, aliquota: 0.18 } : a));
    const problemas = validarInterestaduais(ufs, adulterado);
    expect(problemas.some((p) => p.includes('0.18'))).toBe(true);
  });

  it('detecta importado fora de 4% e pares duplicados', () => {
    const quebrado: AliquotaInterestadualCatalogo[] = [
      { ...inter[0], aliquota_importado: 0.12 },
      { ...inter[0] },
    ];
    const problemas = validarInterestaduais(ufs, quebrado);
    expect(problemas.some((p) => p.includes('importado'))).toBe(true);
    expect(problemas.some((p) => p.includes('duplicado'))).toBe(true);
  });

  it('detecta operação interna e UF desconhecida no catálogo interestadual', () => {
    const problemas = validarInterestaduais(ufs, [
      { ...inter[0], uf_origem: 'SP', uf_destino: 'SP' },
      { ...inter[0], uf_origem: 'XX' },
    ]);
    expect(problemas.some((p) => p.includes('interna'))).toBe(true);
    expect(problemas.some((p) => p.includes('inexistente'))).toBe(true);
  });

  it('acusa cobertura interestadual incompleta', () => {
    const problemas = validarInterestaduais(ufs, inter.slice(0, 100));
    expect(problemas.some((p) => p.includes('Cobertura incompleta'))).toBe(true);
  });

  it('marca catálogo vazio sem confundir com divergência', () => {
    const resumo = resumirPainelCatalogos({ ufs: [], interestaduais: [], faixas: [] });
    expect(resumo.catalogos.every((c) => c.situacao === 'vazio')).toBe(true);
    expect(resumo.situacaoGeral).toBe('vazio');
  });

  it('prioriza "divergente" sobre "vazio" na situação geral', () => {
    const ufsDivergentes = ufs.map((u, i) =>
      i === 0 ? { ...u, aliquota_interna_padrao: 0.99 } : u,
    );
    const resumo = resumirPainelCatalogos({
      ufs: ufsDivergentes,
      interestaduais: [],
      faixas: [],
    });
    expect(resumo.situacaoGeral).toBe('divergente');
  });

  it('detecta drift em faixa do Simples Nacional', () => {
    const faixasDrift = faixas.map((f, i) => (i === 3 ? { ...f, aliquota: f.aliquota + 0.01 } : f));
    const resumo = resumirPainelCatalogos({ ufs, interestaduais: inter, faixas: faixasDrift });
    const simples = resumo.catalogos.find((c) => c.id === 'faixas_simples')!;
    expect(simples.situacao).toBe('divergente');
    expect(simples.problemas.length).toBeGreaterThan(0);
  });

  it('detecta marcador possui_fcp inconsistente', () => {
    const ufsQuebradas = ufs.map((u) => (u.sigla === 'SP' ? { ...u, possui_fcp: !u.possui_fcp } : u));
    const resumo = resumirPainelCatalogos({ ufs: ufsQuebradas, interestaduais: inter, faixas });
    expect(resumo.catalogos[0].problemas.some((p) => p.startsWith('SP'))).toBe(true);
  });
});
