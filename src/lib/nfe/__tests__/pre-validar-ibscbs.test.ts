import { describe, it, expect } from 'vitest';
import {
  preValidarIbscbs,
  INICIO_OBRIGATORIEDADE_IBSCBS,
  type ItemNFeIbscbs,
} from '@/lib/nfe/pre-validar-ibscbs';

const itemOk: ItemNFeIbscbs = {
  nItem: 1,
  cst: '200',
  cClassTrib: '000001',
  vBC: 100,
  pIBSUF: 11.3,
  vIBSUF: 5.65,
  pIBSMun: 5,
  vIBSMun: 5,
  pCBS: 9,
  vCBS: 9,
  vIBS: 10.65,
};

describe('preValidarIbscbs', () => {
  it('nota regular completa passa sem achados', () => {
    const r = preValidarIbscbs({
      crt: 3,
      dataEmissao: '2026-08-03',
      itens: [itemOk],
      totais: { vIBS: 10.65, vCBS: 9 },
    });
    expect(r.achados).toEqual([]);
    expect(r.podeEnviar).toBe(true);
  });

  it('UB12-10: CRT 3 a partir de 03/08/2026 sem grupo bloqueia o envio', () => {
    const r = preValidarIbscbs({
      crt: 3,
      dataEmissao: INICIO_OBRIGATORIEDADE_IBSCBS,
      itens: [{ nItem: 1, vBC: 100, vCBS: 9, vIBSUF: 5.65, vIBSMun: 5 }],
    });
    expect(r.podeEnviar).toBe(false);
    expect(r.achados.some((a) => a.regra === 'UB12-10')).toBe(true);
  });

  it('UB12-10 não vale antes de 03/08/2026', () => {
    const r = preValidarIbscbs({
      crt: 3,
      dataEmissao: '2026-08-02',
      itens: [{ nItem: 1, vBC: 100 }],
    });
    expect(r.achados.some((a) => a.regra === 'UB12-10')).toBe(false);
  });

  it('CST sem cClassTrib é erro, e vice-versa', () => {
    const semClasstrib = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [{ ...itemOk, cClassTrib: undefined, vIBS: 10.65 }],
      totais: { vIBS: 10.65, vCBS: 9 },
    });
    expect(semClasstrib.podeEnviar).toBe(false);
    expect(semClasstrib.achados[0].regra).toBe('CST_CLASSTRIB');

    const semCst = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [{ ...itemOk, cst: undefined, vIBS: 10.65 }],
      totais: { vIBS: 10.65, vCBS: 9 },
    });
    expect(semCst.achados[0].regra).toBe('CST_CLASSTRIB');
  });

  it('rejeição 1091: total diferente da soma dos itens bloqueia', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [itemOk],
      totais: { vIBS: 10.66, vCBS: 9 },
    });
    expect(r.podeEnviar).toBe(false);
    const h = r.achados.find((a) => a.regra === '1091_VALOR');
    expect(h?.mensagem).toContain('10,66');
    expect(h?.mensagem).toContain('10,65');
  });

  it('1091 com dois itens: total é a soma de todos', () => {
    const segundo: ItemNFeIbscbs = {
      ...itemOk,
      nItem: 2,
      vBC: 50,
      vIBSUF: 2.83,
      vIBSMun: 2.5,
      vCBS: 4.5,
      vIBS: 5.33,
    };
    const ok = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [itemOk, segundo],
      totais: { vIBS: 15.98, vCBS: 13.5 },
    });
    expect(ok.achados.filter((a) => a.regra === '1091_VALOR')).toEqual([]);

    const errado = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [itemOk, segundo],
      totais: { vIBS: 10.65, vCBS: 13.5 },
    });
    expect(errado.achados.some((a) => a.regra === '1091_VALOR')).toBe(true);
  });

  it('vIBS do item tem de ser vIBSUF + vIBSMun', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [{ ...itemOk, vIBS: 10 }],
      totais: { vIBS: 10, vCBS: 9 },
    });
    expect(r.achados.some((a) => a.regra === 'VIBS_SOMA')).toBe(true);
  });

  it('formato de CST e cClassTrib é validado', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [{ ...itemOk, cst: '20', cClassTrib: '123', vIBS: 10.65 }],
      totais: { vIBS: 10.65, vCBS: 9 },
    });
    expect(r.achados.some((a) => a.regra === 'CST_FORMATO')).toBe(true);
    expect(r.achados.some((a) => a.regra === 'CCLASSTRIB_FORMATO')).toBe(true);
  });

  it('cClassTrib fora do catálogo vigente bloqueia', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [itemOk],
      totais: { vIBS: 10.65, vCBS: 9 },
      cclasstribVigentes: new Set(['000002', '000003']),
    });
    expect(r.podeEnviar).toBe(false);
    expect(r.achados.some((a) => a.regra === 'CCLASSTRIB_INEXISTENTE')).toBe(true);
  });

  it('catálogo vazio não bloqueia — sem referência, não há o que afirmar', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [itemOk],
      totais: { vIBS: 10.65, vCBS: 9 },
      cclasstribVigentes: new Set(),
    });
    expect(r.podeEnviar).toBe(true);
  });

  it('vCBS positivo com base zerada é payload incompleto', () => {
    const r = preValidarIbscbs({
      dataEmissao: '2026-08-10',
      itens: [{ ...itemOk, vBC: 0, vIBS: 10.65 }],
      totais: { vIBS: 10.65, vCBS: 9 },
    });
    expect(r.achados.some((a) => a.regra === 'BASE_AUSENTE')).toBe(true);
  });

  it('grupo nos itens sem totais gera aviso, não bloqueio', () => {
    const r = preValidarIbscbs({ dataEmissao: '2026-08-10', itens: [itemOk] });
    expect(r.podeEnviar).toBe(true);
    const aviso = r.achados.find((a) => a.regra === 'TOTAL_AUSENTE');
    expect(aviso?.severidade).toBe('aviso');
  });

  it('acumula todos os erros em vez de parar no primeiro', () => {
    const r = preValidarIbscbs({
      crt: 3,
      dataEmissao: '2026-09-01',
      itens: [
        { nItem: 1, vBC: 100 },
        { nItem: 2, cst: '200', vBC: 50 },
        { nItem: 3, cst: '20', cClassTrib: '12', vBC: 10, vCBS: 0.9 },
      ],
    });
    const regras = r.achados.filter((a) => a.severidade === 'erro').map((a) => a.regra);
    expect(regras).toContain('UB12-10');
    expect(regras).toContain('CST_CLASSTRIB');
    expect(regras).toContain('CST_FORMATO');
    expect(regras).toContain('CCLASSTRIB_FORMATO');
    expect(r.podeEnviar).toBe(false);
  });
});

import { adaptarItem } from '@/lib/nfe/pre-validar-ibscbs';

describe('adaptarItem (etapa 52)', () => {
  it('mapeia os campos camelCase do formulário para a validação', () => {
    expect(
      adaptarItem({
        nItem: 1,
        cstIbsCbs: '200',
        cClassTrib: '000001',
        vBCIbsCbs: 100,
        vIBSUF: 5.65,
        vIBSMun: 5,
        vCBS: 9,
        vIBS: 10.65,
      })
    ).toEqual({
      nItem: 1,
      cst: '200',
      cClassTrib: '000001',
      vBC: 100,
      pIBSUF: undefined,
      vIBSUF: 5.65,
      pIBSMun: undefined,
      vIBSMun: 5,
      pCBS: undefined,
      vCBS: 9,
      vIBS: 10.65,
    });
  });

  it('item sem grupo adapta para ausência de CST', () => {
    const adaptado = adaptarItem({ nItem: 2 });
    expect(adaptado.cst).toBeUndefined();
    expect(
      preValidarIbscbs({ crt: 3, dataEmissao: '2026-09-01', itens: [adaptado] }).podeEnviar
    ).toBe(false);
  });
});
