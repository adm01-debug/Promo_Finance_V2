import { describe, expect, it } from 'vitest';
import {
  CSRF_PISO_PAGAMENTO,
  LISTA_LC116,
  TIPI,
  buscarItemLc116,
  buscarTipi,
  calcularIpi,
  calcularIss,
  normalizarNcm,
} from '../ipi-iss';

describe('TIPI — catálogo', () => {
  it('não possui NCM duplicado e todos têm 8 dígitos', () => {
    const ncms = TIPI.map((i) => i.ncm);
    expect(new Set(ncms).size).toBe(ncms.length);
    ncms.forEach((n) => expect(n).toMatch(/^\d{8}$/));
  });

  it('normaliza NCM com máscara', () => {
    expect(normalizarNcm('9608.10.00')).toBe('96081000');
    expect(buscarTipi('9608.10.00')?.aliquota).toBe(0.0975);
  });
});

describe('IPI', () => {
  it('inclui frete e despesas acessórias na base e ignora descontos incondicionais', () => {
    const r = calcularIpi({ valorProduto: 1000, frete: 100, outrasDespesas: 50, descontosIncondicionais: 200, ncm: '96081000' });
    expect(r.baseCalculo).toBe(1150);
    expect(r.ipiDevido).toBeCloseTo(112.13, 2);
    expect(r.alertas.some((a) => a.includes('Descontos incondicionais'))).toBe(true);
  });

  it('não gera débito para NCM imune ou NT', () => {
    expect(calcularIpi({ valorProduto: 5000, ncm: '49019900' }).ipiDevido).toBe(0);
    expect(calcularIpi({ valorProduto: 5000, ncm: '61091000' }).situacao).toBe('nao_tributada');
  });

  it('apura saldo credor quando o crédito supera o débito', () => {
    const r = calcularIpi({ valorProduto: 1000, ncm: '96081000', creditoEntradas: 500 });
    expect(r.saldoApurado).toBeLessThan(0);
    expect(r.alertas.some((a) => a.includes('Saldo credor'))).toBe(true);
  });

  it('não contribuinte não apura IPI', () => {
    const r = calcularIpi({ valorProduto: 1000, ncm: '96081000', contribuinte: false });
    expect(r.ipiDevido).toBe(0);
    expect(r.situacao).toBe('nao_tributada');
  });

  it('avisa quando o NCM não está catalogado', () => {
    const r = calcularIpi({ valorProduto: 100, ncm: '00000000', aliquotaManual: 0.1 });
    expect(r.alertas.some((a) => a.includes('não catalogado'))).toBe(true);
    expect(r.ipiDevido).toBe(10);
  });

  it('valor total da nota soma IPI e subtrai desconto', () => {
    const r = calcularIpi({ valorProduto: 1000, descontosIncondicionais: 100, aliquotaManual: 0.1 });
    expect(r.valorTotalNota).toBe(1000 - 100 + 100);
  });
});

describe('ISS — competência e base', () => {
  it('construção civil é devida no local da execução e admite dedução de materiais', () => {
    const r = calcularIss({
      itemLc116: '7.02', valorServico: 100_000, materiais: 30_000, aliquotaMunicipal: 0.03,
      municipioPrestador: 'São Paulo', municipioTomador: 'Santos', municipioExecucao: 'Guarujá',
    });
    expect(r.municipioCompetente).toBe('Guarujá');
    expect(r.baseCalculo).toBe(70_000);
    expect(r.issDevido).toBe(2100);
  });

  it('consultoria é devida no estabelecimento prestador', () => {
    const r = calcularIss({
      itemLc116: '17.01', valorServico: 10_000, aliquotaMunicipal: 0.05,
      municipioPrestador: 'Barueri', municipioTomador: 'São Paulo',
    });
    expect(r.municipioCompetente).toBe('Barueri');
    expect(r.issRetidoPeloTomador).toBe(false);
  });

  it('leasing é devido no domicílio do tomador', () => {
    const r = calcularIss({
      itemLc116: '15.09', valorServico: 10_000, aliquotaMunicipal: 0.02,
      municipioPrestador: 'Osasco', municipioTomador: 'Curitiba', tomadorPessoaJuridica: true,
    });
    expect(r.municipioCompetente).toBe('Curitiba');
    expect(r.issRetidoPeloTomador).toBe(true);
  });

  it('ajusta alíquota ao piso e ao teto', () => {
    const base = { itemLc116: '17.01', valorServico: 1000, municipioPrestador: 'A', municipioTomador: 'B' } as const;
    expect(calcularIss({ ...base, aliquotaMunicipal: 0.001 }).aliquota).toBe(0.02);
    expect(calcularIss({ ...base, aliquotaMunicipal: 0.09 }).aliquota).toBe(0.05);
  });

  it('rejeita item inexistente na lista', () => {
    expect(() => calcularIss({
      itemLc116: '99.99', valorServico: 100, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B',
    })).toThrow(/não encontrado/);
  });
});

describe('ISS — retenções federais', () => {
  it('aplica IRRF 1,5% e CSRF 4,65% para tomador PJ', () => {
    const r = calcularIss({
      itemLc116: '17.01', valorServico: 10_000, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B', tomadorPessoaJuridica: true,
    });
    expect(r.retencoes.irrf).toBe(150);
    expect(r.retencoes.pis + r.retencoes.cofins + r.retencoes.csll).toBeCloseTo(465, 2);
    expect(r.valorLiquidoRecebido).toBeCloseTo(10_000 - 615, 2);
  });

  it('dispensa CSRF em pagamento até o piso', () => {
    const r = calcularIss({
      itemLc116: '17.01', valorServico: CSRF_PISO_PAGAMENTO, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B', tomadorPessoaJuridica: true,
    });
    expect(r.retencoes.pis).toBe(0);
    expect(r.retencoes.cofins).toBe(0);
  });

  it('dispensa IRRF inferior a R$ 10,00', () => {
    const r = calcularIss({
      itemLc116: '17.01', valorServico: 500, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B', tomadorPessoaJuridica: true,
    });
    expect(r.retencoes.irrf).toBe(0);
    expect(r.alertas.some((a) => a.includes('dispensado'))).toBe(true);
  });

  it('Simples Nacional afasta IRRF, CSRF e INSS', () => {
    const r = calcularIss({
      itemLc116: '7.02', valorServico: 50_000, aliquotaMunicipal: 0.03,
      municipioPrestador: 'A', municipioTomador: 'B',
      tomadorPessoaJuridica: true, prestadorSimplesNacional: true,
    });
    expect(r.retencoes.irrf + r.retencoes.pis + r.retencoes.cofins + r.retencoes.csll + r.retencoes.inss).toBe(0);
    expect(r.retencoes.iss).toBeGreaterThan(0);
  });

  it('retém 11% de INSS em cessão de mão de obra', () => {
    const r = calcularIss({
      itemLc116: '17.05', valorServico: 20_000, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B', tomadorPessoaJuridica: true,
    });
    expect(r.retencoes.inss).toBe(2200);
  });

  it('tomador pessoa física não gera retenções federais', () => {
    const r = calcularIss({
      itemLc116: '17.01', valorServico: 10_000, aliquotaMunicipal: 0.05,
      municipioPrestador: 'A', municipioTomador: 'B',
    });
    expect(r.retencoes.total).toBe(0);
    expect(r.valorLiquidoRecebido).toBe(10_000);
  });
});

describe('Simulação exaustiva de cenários', () => {
  it('IPI: invariantes em ~1.000 combinações', () => {
    const valores = [0, 1, 99.99, 1000, 250_000];
    const fretes = [0, 37.5, 900];
    const descontos = [0, 100];
    const creditos = [0, 500, 1_000_000];
    let n = 0;
    for (const item of TIPI) {
      for (const v of valores) for (const f of fretes) for (const d of descontos) for (const c of creditos) {
        const r = calcularIpi({ valorProduto: v, frete: f, descontosIncondicionais: d, creditoEntradas: c, ncm: item.ncm });
        n++;
        expect(Number.isFinite(r.ipiDevido)).toBe(true);
        expect(r.ipiDevido).toBeGreaterThanOrEqual(0);
        expect(r.baseCalculo).toBeCloseTo(v + f, 2);
        expect(r.saldoApurado).toBeCloseTo(Math.round((r.ipiDevido - c) * 100) / 100, 2);
        if (item.situacao !== 'tributada') expect(r.ipiDevido).toBe(0);
      }
    }
    expect(n).toBeGreaterThan(500);
  });

  it('ISS: invariantes em todos os itens × cenários de retenção', () => {
    const valores = [10, 215.05, 215.06, 5_000, 1_000_000];
    const aliquotas = [0.02, 0.03, 0.05];
    let n = 0;
    for (const item of LISTA_LC116) {
      for (const v of valores) for (const a of aliquotas) for (const pj of [false, true]) for (const sn of [false, true]) {
        const r = calcularIss({
          itemLc116: item.item, valorServico: v, aliquotaMunicipal: a, materiais: v * 0.2,
          municipioPrestador: 'Prestador', municipioTomador: 'Tomador', municipioExecucao: 'Execucao',
          tomadorPessoaJuridica: pj, prestadorSimplesNacional: sn,
        });
        n++;
        expect(r.issDevido).toBeGreaterThanOrEqual(0);
        expect(r.baseCalculo).toBeLessThanOrEqual(v + 0.001);
        expect(r.retencoes.total).toBeLessThanOrEqual(v + 0.001);
        expect(r.valorLiquidoRecebido).toBeGreaterThanOrEqual(-0.001);
        if (!pj) expect(r.retencoes.total).toBe(0);
        if (sn) expect(r.retencoes.irrf + r.retencoes.inss).toBe(0);
        const esperado = item.local === 'estabelecimento_prestador'
          ? 'Prestador'
          : item.local === 'domicilio_tomador' ? 'Tomador' : 'Execucao';
        expect(r.municipioCompetente).toBe(esperado);
      }
    }
    expect(n).toBeGreaterThan(300);
  });

  it('entradas patológicas não quebram os motores', () => {
    const ipi = calcularIpi({ valorProduto: -100, frete: Number.NaN, aliquotaManual: 5 });
    expect(ipi.baseCalculo).toBe(0);
    expect(ipi.aliquota).toBe(1);

    const iss = calcularIss({
      itemLc116: '7.02', valorServico: 1000, materiais: 99_999, aliquotaMunicipal: Number.NaN,
      municipioPrestador: 'A', municipioTomador: 'B',
    });
    expect(iss.baseCalculo).toBe(0);
    expect(iss.aliquota).toBe(0.02);
  });

  it('todos os itens da lista são recuperáveis pelo índice', () => {
    LISTA_LC116.forEach((i) => expect(buscarItemLc116(` ${i.item} `)?.descricao).toBe(i.descricao));
  });
});
