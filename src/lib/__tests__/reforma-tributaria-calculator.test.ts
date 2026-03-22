import { describe, it, expect } from 'vitest';
import {
  determinarFaseTransicao,
  obterAliquotasTransicao,
  aplicarRegimeEspecial,
  obterAliquotaIS,
  verificarIsencao,
  calcularTributosReforma,
  calcularCreditos,
  simularComparativo,
  type DadosOperacao,
} from '../reforma-tributaria-calculator';

describe('Reforma Tributária Calculator', () => {
  // ========================
  // determinarFaseTransicao
  // ========================
  describe('determinarFaseTransicao', () => {
    it('2025 → 2026_teste', () => expect(determinarFaseTransicao(2025)).toBe('2026_teste'));
    it('2026 → 2026_teste', () => expect(determinarFaseTransicao(2026)).toBe('2026_teste'));
    it('2027 → 2027_cbs_plena', () => expect(determinarFaseTransicao(2027)).toBe('2027_cbs_plena'));
    it('2028 → 2028_cbs_plena', () => expect(determinarFaseTransicao(2028)).toBe('2028_cbs_plena'));
    it('2029 → 2029_transicao', () => expect(determinarFaseTransicao(2029)).toBe('2029_transicao'));
    it('2030 → 2030_transicao', () => expect(determinarFaseTransicao(2030)).toBe('2030_transicao'));
    it('2031 → 2031_transicao', () => expect(determinarFaseTransicao(2031)).toBe('2031_transicao'));
    it('2032 → 2032_transicao', () => expect(determinarFaseTransicao(2032)).toBe('2032_transicao'));
    it('2033 → 2033_pleno', () => expect(determinarFaseTransicao(2033)).toBe('2033_pleno'));
    it('2040 → 2033_pleno', () => expect(determinarFaseTransicao(2040)).toBe('2033_pleno'));
  });

  // ========================
  // obterAliquotasTransicao
  // ========================
  describe('obterAliquotasTransicao', () => {
    it('ano < 2026 retorna zerado com residuais 100%', () => {
      const aliq = obterAliquotasTransicao(2024);
      expect(aliq.cbs).toBe(0);
      expect(aliq.ibs).toBe(0);
      expect(aliq.icmsResidual).toBe(100);
      expect(aliq.pisResidual).toBe(100);
    });

    it('ano > 2033 retorna alíquotas plenas sem residuais', () => {
      const aliq = obterAliquotasTransicao(2040);
      expect(aliq.cbs).toBeGreaterThan(0);
      expect(aliq.ibs).toBeGreaterThan(0);
      expect(aliq.icmsResidual).toBe(0);
      expect(aliq.pisResidual).toBe(0);
    });

    it('retorna objeto com campos obrigatórios', () => {
      const aliq = obterAliquotasTransicao(2029);
      expect(aliq).toHaveProperty('ano');
      expect(aliq).toHaveProperty('cbs');
      expect(aliq).toHaveProperty('ibs');
      expect(aliq).toHaveProperty('icmsResidual');
      expect(aliq).toHaveProperty('cofinsResidual');
    });
  });

  // ========================
  // aplicarRegimeEspecial
  // ========================
  describe('aplicarRegimeEspecial', () => {
    it('sem regime retorna alíquotas originais', () => {
      const r = aplicarRegimeEspecial(8.8, 17.7);
      expect(r.cbs).toBe(8.8);
      expect(r.ibs).toBe(17.7);
    });

    it('regime "nenhum" retorna alíquotas originais', () => {
      const r = aplicarRegimeEspecial(8.8, 17.7, 'nenhum');
      expect(r.cbs).toBe(8.8);
      expect(r.ibs).toBe(17.7);
    });

    it('regime especial reduz alíquotas', () => {
      const r = aplicarRegimeEspecial(8.8, 17.7, 'zona_franca_manaus');
      expect(r.cbs).toBeLessThanOrEqual(8.8);
      expect(r.ibs).toBeLessThanOrEqual(17.7);
    });

    it('regime inexistente retorna original', () => {
      const r = aplicarRegimeEspecial(8.8, 17.7, 'regime_fake' as any);
      expect(r.cbs).toBe(8.8);
      expect(r.ibs).toBe(17.7);
    });
  });

  // ========================
  // obterAliquotaIS
  // ========================
  describe('obterAliquotaIS', () => {
    it('sem categoria retorna 0', () => {
      expect(obterAliquotaIS()).toBe(0);
    });

    it('alíquota customizada tem prioridade', () => {
      expect(obterAliquotaIS('bebidas_alcoolicas', 25)).toBe(25);
    });

    it('categoria válida retorna alíquota base', () => {
      const aliq = obterAliquotaIS('bebidas_alcoolicas');
      expect(aliq).toBeGreaterThan(0);
    });
  });

  // ========================
  // verificarIsencao
  // ========================
  describe('verificarIsencao', () => {
    const dadosBase: DadosOperacao = {
      valorOperacao: 10000,
      tipoOperacao: 'venda',
      ufOrigem: 'SP',
      ufDestino: 'RJ',
      cfop: '5102',
    };

    it('operação normal não é isenta', () => {
      const r = verificarIsencao(dadosBase);
      expect(r.isento).toBe(false);
    });

    it('exportação é isenta', () => {
      const r = verificarIsencao({ ...dadosBase, isExportacao: true });
      expect(r.isento).toBe(true);
      expect(r.motivo).toContain('Exportação');
    });

    it('CFOP 7xxx (exportação) é isento', () => {
      const r = verificarIsencao({ ...dadosBase, cfop: '7101' });
      expect(r.isento).toBe(true);
    });
  });

  // ========================
  // calcularTributosReforma
  // ========================
  describe('calcularTributosReforma', () => {
    const dadosVenda: DadosOperacao = {
      valorOperacao: 100000,
      tipoOperacao: 'venda',
      ufOrigem: 'SP',
      ufDestino: 'RJ',
      cfop: '6102',
    };

    it('operação normal calcula CBS e IBS', () => {
      const r = calcularTributosReforma(dadosVenda, 2033);
      expect(r.valorCBS).toBeGreaterThan(0);
      expect(r.valorIBS).toBeGreaterThan(0);
      expect(r.totalTributosNovos).toBe(r.valorCBS + r.valorIBS + r.valorIS);
    });

    it('exportação retorna tudo zero', () => {
      const r = calcularTributosReforma({ ...dadosVenda, isExportacao: true }, 2033);
      expect(r.totalTributosNovos).toBe(0);
      expect(r.valorLiquido).toBe(100000);
    });

    it('ano 2024 não tem tributos novos', () => {
      const r = calcularTributosReforma(dadosVenda, 2024);
      expect(r.valorCBS).toBe(0);
      expect(r.valorIBS).toBe(0);
    });

    it('split payment CBS ativo a partir de 2026', () => {
      const r2025 = calcularTributosReforma(dadosVenda, 2025);
      const r2027 = calcularTributosReforma(dadosVenda, 2027);
      expect(r2025.valorSplitPaymentCBS).toBe(0);
      expect(r2027.valorSplitPaymentCBS).toBeGreaterThanOrEqual(0);
    });

    it('carga tributária percentual é consistente', () => {
      const r = calcularTributosReforma(dadosVenda, 2033);
      const cargaEsperada = ((r.totalTributosNovos + r.totalTributosAntigos) / r.valorBase) * 100;
      expect(r.cargaTributariaPercentual).toBeCloseTo(cargaEsperada, 2);
    });

    it('detalhamento contém informações úteis', () => {
      const r = calcularTributosReforma(dadosVenda, 2033);
      expect(r.detalhamento.length).toBeGreaterThan(0);
      expect(r.detalhamento.some(d => d.includes('Base de cálculo'))).toBe(true);
    });

    it('IBS dividido 75% estadual 25% municipal', () => {
      const r = calcularTributosReforma(dadosVenda, 2033);
      expect(r.aliquotaIBSEstadual).toBeCloseTo(r.aliquotaIBS * 0.75, 4);
      expect(r.aliquotaIBSMunicipal).toBeCloseTo(r.aliquotaIBS * 0.25, 4);
    });

    it('com IS (bebidas alcoólicas) adiciona imposto seletivo', () => {
      const r = calcularTributosReforma({ ...dadosVenda, categoriaIS: 'bebidas_alcoolicas' }, 2033);
      expect(r.valorIS).toBeGreaterThan(0);
      expect(r.aliquotaIS).toBeGreaterThan(0);
    });
  });

  // ========================
  // calcularCreditos
  // ========================
  describe('calcularCreditos', () => {
    it('calcula créditos CBS e IBS', () => {
      const r = calcularCreditos({ valorAquisicao: 50000, tipoOperacao: 'compra', anoReferencia: 2033 });
      expect(r.creditoCBS).toBeGreaterThan(0);
      expect(r.creditoIBS).toBeGreaterThan(0);
      expect(r.creditoTotal).toBe(r.creditoCBS + r.creditoIBS);
    });

    it('não-cumulatividade plena ativa', () => {
      const r = calcularCreditos({ valorAquisicao: 50000, tipoOperacao: 'compra', anoReferencia: 2033 });
      expect(r.naoCumulatividadePlena).toBe(true);
    });

    it('regime especial pode reduzir crédito', () => {
      const normal = calcularCreditos({ valorAquisicao: 50000, tipoOperacao: 'compra', anoReferencia: 2033 });
      const regime = calcularCreditos({ valorAquisicao: 50000, tipoOperacao: 'compra', regimeEspecial: 'saude', anoReferencia: 2033 });
      // Regime may or may not reduce depending on config
      expect(regime.creditoTotal).toBeLessThanOrEqual(normal.creditoTotal);
    });
  });

  // ========================
  // simularComparativo
  // ========================
  describe('simularComparativo', () => {
    const dados = {
      faturamentoAnual: 1000000,
      comprasAnual: 400000,
      servicosTomadosAnual: 100000,
      percentualVendas: 70,
      percentualServicos: 30,
    };

    it('retorna comparativo sistema antigo vs novo', () => {
      const r = simularComparativo(dados, 2033);
      expect(r.totalAntigo).toBeGreaterThan(0);
      expect(r.totalNovo).toBeGreaterThan(0);
      expect(r.impacto).toMatch(/economia|aumento|neutro/);
    });

    it('diferença absoluta coerente', () => {
      const r = simularComparativo(dados, 2033);
      expect(r.diferencaAbsoluta).toBeCloseTo(r.totalNovo - r.totalAntigo, 2);
    });

    it('carga percentual calculada sobre faturamento', () => {
      const r = simularComparativo(dados, 2033);
      expect(r.cargaAntigaPercentual).toBeCloseTo((r.totalAntigo / dados.faturamentoAnual) * 100, 2);
      expect(r.cargaNovaPercentual).toBeCloseTo((r.totalNovo / dados.faturamentoAnual) * 100, 2);
    });

    it('créditos recuperáveis calculados', () => {
      const r = simularComparativo(dados, 2033);
      expect(r.creditosCBSRecuperaveis).toBeGreaterThanOrEqual(0);
      expect(r.creditosIBSRecuperaveis).toBeGreaterThanOrEqual(0);
    });
  });
});
