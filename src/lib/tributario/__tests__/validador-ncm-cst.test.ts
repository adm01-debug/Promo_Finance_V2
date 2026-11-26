import { describe, it, expect } from 'vitest';
import {
  validarConsistenciaNcmCst,
  validarItemFiscal,
  validarItensFiscais,
} from '../validador-ncm-cst';
import type { ReferenciasFiscais } from '../catalogos/cclasstrib';
import { fundamentosVazios } from '../catalogos/fundamentacao-legal';

// Etapa 46: a valida??o passou a conferir o documento contra os cat?logos
// oficiais, n?o contra regras de exemplo embutidas. As refer?ncias abaixo s?o
// o recorte vigente que `buscarReferenciasFiscais` devolveria.
const comCatalogo = (): ReferenciasFiscais => ({
  referencia: '2026-11-22',
  cclasstrib: new Map([
    [
      '200035',
      {
        cclasstrib: '200035',
        cst: '000',
        descricao: 'Tributa??o integral',
        exigeGibscbs: true,
        pRedCbs: 0,
        pRedIbsUf: 0,
        pRedIbsMun: 0,
        versaoIt: '1.0',
      },
    ],
    [
      '410001',
      {
        cclasstrib: '410001',
        cst: '410',
        descricao: 'Isen??o',
        exigeGibscbs: false,
        pRedCbs: 1,
        pRedIbsUf: 1,
        pRedIbsMun: 1,
        versaoIt: '1.0',
      },
    ],
  ]),
  ncm: new Map([['02013000', { ncm: '02013000', descricao: 'Carnes de bovino' }]]),
  // catálogo carregado: um código fora dele é divergência de verdade
  cclasstribCarregado: true,
  ncmCarregado: true,
  fundamentos: fundamentosVazios('2026-11-22'),
});

const vazio = (): ReferenciasFiscais => ({
  referencia: '2026-11-22',
  cclasstrib: new Map(),
  ncm: new Map(),
  cclasstribCarregado: false,
  ncmCarregado: false,
  fundamentos: fundamentosVazios('2026-11-22'),
});

describe('validarItemFiscal', () => {
  it('REG-011: NCM 02013000 com cClassTrib 200035 e CST divergente', () => {
    // Evid?ncia da etapa 46: o cClassTrib 200035 tem CST 000 no cat?logo; o
    // item declarou 200. Os dois campos se contradizem no pr?prio documento.
    const d = validarItemFiscal(
      { ncm: '02013000', cClassTrib: '200035', cstIbscbs: '200' },
      comCatalogo()
    );
    expect(d).toHaveLength(1);
    expect(d[0].codigo).toBe('REG-011');
    expect(d[0].campo).toBe('cClassTrib');
    expect(d[0].mensagem).toContain('tem CST 000');
  });

  it('n?o acusa quando o CST declarado bate com o do cat?logo', () => {
    const d = validarItemFiscal(
      { ncm: '02013000', cClassTrib: '200035', cstIbscbs: '000' },
      comCatalogo()
    );
    expect(d).toHaveLength(0);
  });

  it('REG-013: cClassTrib fora do cat?logo vigente', () => {
    const d = validarItemFiscal({ cClassTrib: '999999' }, comCatalogo());
    expect(d).toHaveLength(1);
    expect(d[0].codigo).toBe('REG-013');
  });

  it('REG-012: NCM de 8 d?gitos fora do cat?logo vigente', () => {
    const d = validarItemFiscal({ ncm: '99999999' }, comCatalogo());
    expect(d).toHaveLength(1);
    expect(d[0].codigo).toBe('REG-012');
  });

  it('REG-010: NCM com tamanho diferente de 8 d?gitos', () => {
    const d = validarItemFiscal({ ncm: '1234' }, vazio());
    expect(d).toHaveLength(1);
    expect(d[0].codigo).toBe('REG-010');
  });

  it('REG-010: NCM 00 é item sem produto, não erro de digitação', () => {
    // Leiaute da NF-e: item sem produto (serviço, frete) vai com NCM 00.
    // Acusar tamanho inválido aqui marcaria toda nota de serviço como suspeita.
    const d = validarItemFiscal({ ncm: '00' }, comCatalogo());
    expect(d.filter((x) => x.codigo === 'REG-010')).toHaveLength(0);
  });

  it('código fora do catálogo é divergência mesmo com outros válidos', () => {
    const d = validarItemFiscal({ ncm: '99999999', cClassTrib: '999999' }, comCatalogo());
    expect(d.map((x) => x.codigo).sort()).toEqual(['REG-012', 'REG-013']);
  });

  it('catálogo com carga mas nenhum código do lote ainda acusa', () => {
    // Regressão do mapa vazio: antes a condição era `size > 0` e este caso
    // passava sem alerta justamente por o mapa estar vazio.
    const refs: ReferenciasFiscais = {
      ...vazio(),
      cclasstribCarregado: true,
      ncmCarregado: true,
    };
    const d = validarItemFiscal({ ncm: '11111111', cClassTrib: '111111' }, refs);
    expect(d.map((x) => x.codigo).sort()).toEqual(['REG-012', 'REG-013']);
  });

  it('cat?logo vazio nunca gera diverg?ncia de conte?do', () => {
    // Carga da RFB ainda n?o executada: sem refer?ncia n?o h? o que afirmar.
    expect(
      validarItemFiscal({ ncm: '02013000', cClassTrib: '200035', cstIbscbs: '200' }, vazio())
    ).toHaveLength(0);
  });
});

describe('validarItensFiscais', () => {
  it('agrega diverg?ncias de todos os itens e reduz o score', () => {
    const r = validarItensFiscais(
      [{ ncm: '02013000', cClassTrib: '200035', cstIbscbs: '200' }, { ncm: '99999999' }],
      comCatalogo()
    );
    expect(r.divergencias).toHaveLength(2);
    expect(r.score).toBe(70); // -15 (REG-011) -15 (REG-012)
  });

  it('nota sem diverg?ncia pontua 100', () => {
    const r = validarItensFiscais(
      [{ ncm: '02013000', cClassTrib: '200035', cstIbscbs: '000' }],
      comCatalogo()
    );
    expect(r.score).toBe(100);
    expect(r.divergencias).toHaveLength(0);
  });

  it('numera o item que gerou cada divergencia', () => {
    // Duas linhas do mesmo cClassTrib eram indistinguiveis no alerta.
    const r = validarItensFiscais(
      [
        { ncm: '02013000', cClassTrib: '200035', cstIbscbs: '000' },
        { ncm: '99999999', cClassTrib: '999999', cstIbscbs: '000' },
      ],
      comCatalogo()
    );
    expect(r.divergencias.map((d) => [d.codigo, d.item]).sort()).toEqual([
      ['REG-012', 2],
      ['REG-013', 2],
    ]);
  });
});

describe('validarConsistenciaNcmCst (compatibilidade)', () => {
  it('retorna 100 para NCM de 8 d?gitos', () => {
    const r = validarConsistenciaNcmCst('61091000', '00');
    expect(r.score).toBe(100);
    expect(r.divergencias).toHaveLength(0);
  });

  it('penaliza NCM com tamanho inv?lido', () => {
    const r = validarConsistenciaNcmCst('1234', '00');
    expect(r.score).toBe(90);
    expect(r.divergencias[0].campo).toBe('NCM');
  });

  it('n?o aplica mais as regras de exemplo de PIS/COFINS', () => {
    // Antes da etapa 46 o NCM 3004 era penalizado por ser "monof?sico" e o
    // 8517 por "exigir ST" ? regras embutidas que envelhecem sem aviso.
    expect(validarConsistenciaNcmCst('30041000', '00').score).toBe(100);
    expect(validarConsistenciaNcmCst('85171100', '00').score).toBe(100);
  });

  it('normaliza pontua??o no NCM', () => {
    expect(validarConsistenciaNcmCst('6109.10.00', '00').score).toBe(100);
  });
});

describe('fundamento legal do apontamento (etapa 82)', () => {
  const linhaFundamento = {
    cclasstrib: '200035',
    cst: '000',
    conjuntoTributo: 'CBS e IBS',
    descricaoCClassTrib: null,
    descricaoCST: null,
    texto: 'Art. 11. Texto do artigo.',
    textoCurto: 'LC 214/2025',
    referenciaNormativa: 'LC 214/2025',
  };

  it('REG-011 sai com o fundamento do cClassTrib declarado', () => {
    const refs = comCatalogo();
    refs.fundamentos = {
      referencia: '2026-11-22',
      carregado: true,
      porCst: new Map([['200035|000', linhaFundamento]]),
      porCclasstrib: new Map([['200035', [linhaFundamento]]]),
    };
    const d = validarItemFiscal({ ncm: '02013000', cClassTrib: '200035', cstIbscbs: '200' }, refs);
    expect(d[0].codigo).toBe('REG-011');
    expect(d[0].fundamento).toEqual({
      referencia: 'LC 214/2025',
      texto: 'Art. 11. Texto do artigo.',
    });
  });

  it('REG-013 sai com a norma quando o cClassTrib tem linha de outro CST', () => {
    // A RFB publica o cClassTrib com o CST do catalogo e o item declarou outro:
    // o mapa por par nao tem a chave, so a lista por cClassTrib tem a norma.
    const refs = comCatalogo();
    refs.fundamentos = {
      referencia: '2026-11-22',
      carregado: true,
      porCst: new Map(),
      porCclasstrib: new Map([['400001', [linhaFundamento]]]),
    };
    const d = validarItemFiscal({ ncm: '02013000', cClassTrib: '400001', cstIbscbs: '200' }, refs);
    const reg013 = d.find((x) => x.codigo === 'REG-013');
    expect(reg013?.fundamento).toEqual({
      referencia: 'LC 214/2025',
      texto: 'Art. 11. Texto do artigo.',
    });
  });

  it('sem linha no catalogo de fundamentacoes o alerta continua sem norma', () => {
    const d = validarItemFiscal({ ncm: '99999999', cClassTrib: '999999' }, comCatalogo());
    const reg013 = d.find((x) => x.codigo === 'REG-013');
    expect(reg013).toBeDefined();
    expect(reg013?.fundamento).toBeUndefined();
  });
});
