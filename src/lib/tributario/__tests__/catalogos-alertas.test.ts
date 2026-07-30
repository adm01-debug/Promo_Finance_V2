import { describe, expect, it } from 'vitest';
import { gerarAlertasCatalogos } from '../catalogos/alertas';
import { aliquotaInterestadualEsperada } from '../catalogos/painel';
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
    vigente_de: '2024-01-01',
    vigente_ate: null,
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

describe('alertas proativos de catálogos fiscais', () => {
  const ufs = ufsCoerentes();
  const interestaduais = interestaduaisCoerentes(ufs);
  const faixas = faixasCoerentes();

  it('não gera alerta quando todos os catálogos estão coerentes', () => {
    const resumo = gerarAlertasCatalogos({ ufs, interestaduais, faixas });
    expect(resumo.total).toBe(0);
    expect(resumo.criticos).toBe(0);
    expect(resumo.catalogosAfetados).toEqual([]);
  });

  it('aponta o item e o campo divergentes de uma UF adulterada', () => {
    const adulteradas = ufs.map((u) =>
      u.sigla === 'SP' ? { ...u, aliquota_interna_padrao: 0.25 } : u,
    );
    const { alertas } = gerarAlertasCatalogos({
      ufs: adulteradas,
      interestaduais,
      faixas,
    });

    const alerta = alertas.find((a) => a.catalogo === 'ufs' && a.item === 'SP');
    expect(alerta).toBeDefined();
    expect(alerta!.campo).toBe('aliquota_interna');
    expect(alerta!.valorBanco).toBe(0.25);
    expect(alerta!.valorMotor).toBe(ALIQUOTAS_UF.SP.interna);
    expect(alerta!.severidade).toBe('critico');
  });

  it('sinaliza catálogo vazio como divergência crítica', () => {
    const resumo = gerarAlertasCatalogos({ ufs: [], interestaduais, faixas });
    const vazio = resumo.alertas.find((a) => a.campo === 'catalogo_vazio');
    expect(vazio).toBeDefined();
    expect(vazio!.catalogo).toBe('ufs');
    expect(vazio!.severidade).toBe('critico');
  });

  it('detecta faixa do Simples adulterada indicando anexo e faixa', () => {
    const adulteradas = faixas.map((f, i) => (i === 0 ? { ...f, aliquota: f.aliquota + 0.05 } : f));
    const { alertas } = gerarAlertasCatalogos({ ufs, interestaduais, faixas: adulteradas });

    const alerta = alertas.find((a) => a.catalogo === 'faixas_simples');
    expect(alerta).toBeDefined();
    expect(alerta!.item).toMatch(/^Anexo .+ · faixa \d+$/);
    expect(alerta!.campo).toBe('aliquota');
  });

  it('detecta divergência interestadual e identifica o par de UFs', () => {
    const adulterado = interestaduais.map((a, i) => (i === 0 ? { ...a, aliquota: 0.18 } : a));
    const { alertas } = gerarAlertasCatalogos({ ufs, interestaduais: adulterado, faixas });

    const alerta = alertas.find((a) => a.catalogo === 'interestaduais');
    expect(alerta).toBeDefined();
    expect(alerta!.item).toMatch(/->/);
  });

  it('ordena alertas críticos antes dos de atenção e conta por gravidade', () => {
    const ufsQuebradas = ufs.map((u) => {
      if (u.sigla === 'SP') return { ...u, aliquota_interna_padrao: 0.25 };
      if (u.sigla === 'RJ') return { ...u, possui_fcp: !u.possui_fcp };
      return u;
    });
    const resumo = gerarAlertasCatalogos({ ufs: ufsQuebradas, interestaduais, faixas });

    expect(resumo.total).toBe(resumo.criticos + resumo.atencoes);
    expect(resumo.criticos).toBeGreaterThan(0);
    expect(resumo.alertas[0].severidade).toBe('critico');
    const primeiraAtencao = resumo.alertas.findIndex((a) => a.severidade === 'atencao');
    if (primeiraAtencao >= 0) {
      expect(
        resumo.alertas.slice(primeiraAtencao).every((a) => a.severidade === 'atencao'),
      ).toBe(true);
    }
  });

  it('produz ids estáveis e únicos por alerta', () => {
    const adulteradas = ufs.map((u) =>
      u.sigla === 'SP' ? { ...u, aliquota_interna_padrao: 0.25, aliquota_fcp: 0.04 } : u,
    );
    const { alertas } = gerarAlertasCatalogos({ ufs: adulteradas, interestaduais, faixas });
    const ids = alertas.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
