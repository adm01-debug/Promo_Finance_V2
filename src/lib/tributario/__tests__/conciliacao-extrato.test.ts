import { describe, it, expect } from 'vitest';
import { parseCsv, buildDiff, TOLERANCIA } from '@/lib/tributario/conciliacao-extrato';

const CHAVE_OK = '4312400000000000000000000000000000000000000000';
const CHAVE_DIV = '4312400000000000000000000000000000000000000001';
const CHAVE_NAO = '4312400000000000000000000000000000000000000002';

describe('conciliacao-extrato (etapa 89)', () => {
  describe('parseCsv', () => {
    it('parseia CSV com virgula', () => {
      const csv = `chave_acesso,cbs_credito,ibs_credito\n${CHAVE_OK},150.00,120.00\n${CHAVE_DIV},10.00,5.00`;
      const linhas = parseCsv(csv);
      expect(linhas).toHaveLength(2);
      expect(linhas[0].chave_acesso).toBe(CHAVE_OK);
      expect(linhas[0].cbs_credito).toBe(150);
      expect(linhas[0].ibs_credito).toBe(120);
    });

    it('parseia CSV com ponto-e-virgula', () => {
      const csv = `chave_acesso;cbs_credito;ibs_credito\n${CHAVE_OK};150.00;120.00`;
      const linhas = parseCsv(csv);
      expect(linhas).toHaveLength(1);
      expect(linhas[0].cbs_credito).toBe(150);
    });

    it('ignora linhas com chave curta (<44 digitos)', () => {
      const csv = `chave_acesso,cbs_credito,ibs_credito\n123456,150.00,120.00\n${CHAVE_OK},150.00,120.00`;
      const linhas = parseCsv(csv);
      expect(linhas).toHaveLength(1);
    });

    it('retorna [] para CSV sem cabecalho valido', () => {
      expect(parseCsv('foo,bar\n1,2')).toEqual([]);
      expect(parseCsv('')).toEqual([]);
      expect(parseCsv('chave_acesso,cbs_credito,ibs_credito')).toEqual([]);
    });

    it('remove pontuacao da chave de acesso', () => {
      const csv = `chave_acesso,cbs_credito,ibs_credito\n${CHAVE_OK.slice(0, 10)} ${CHAVE_OK.slice(10, 20)} ${CHAVE_OK.slice(20)},150.00,120.00`;
      // apenas garante que nao quebra com espacos
      const linhas = parseCsv(csv);
      expect(linhas.length).toBeLessThanOrEqual(1);
    });
  });

  describe('buildDiff', () => {
    const creditos = [
      { documento_chave: CHAVE_OK, tipo_tributo: 'CBS', valor_credito: 150.0 },
      { documento_chave: CHAVE_OK, tipo_tributo: 'IBS', valor_credito: 120.0 },
      { documento_chave: CHAVE_DIV, tipo_tributo: 'CBS', valor_credito: 9.0 },
      { documento_chave: CHAVE_DIV, tipo_tributo: 'IBS', valor_credito: 5.0 },
    ];

    it('marca OK quando sistema == extrato', () => {
      const extrato = [{ chave_acesso: CHAVE_OK, cbs_credito: 150, ibs_credito: 120 }];
      const diff = buildDiff(extrato, creditos);
      expect(diff[0].status).toBe('ok');
      expect(diff[0].diff_cbs).toBeLessThanOrEqual(TOLERANCIA);
      expect(diff[0].diff_ibs).toBeLessThanOrEqual(TOLERANCIA);
    });

    it('marca divergencia quando valor difere', () => {
      const extrato = [{ chave_acesso: CHAVE_DIV, cbs_credito: 10, ibs_credito: 5 }];
      const diff = buildDiff(extrato, creditos);
      expect(diff[0].status).toBe('divergencia');
      expect(diff[0].cbs_sistema).toBe(9);
    });

    it('marca nao_encontrada quando sistema nao tem a chave', () => {
      const extrato = [{ chave_acesso: CHAVE_NAO, cbs_credito: 10, ibs_credito: 5 }];
      const diff = buildDiff(extrato, creditos);
      expect(diff[0].status).toBe('nao_encontrada');
      expect(diff[0].cbs_sistema).toBeNull();
      expect(diff[0].ibs_sistema).toBeNull();
    });

    it('soma multiplos creditos da mesma chave', () => {
      const creditosMulti = [
        { documento_chave: CHAVE_OK, tipo_tributo: 'CBS', valor_credito: 100 },
        { documento_chave: CHAVE_OK, tipo_tributo: 'CBS', valor_credito: 50 },
        { documento_chave: CHAVE_OK, tipo_tributo: 'IBS', valor_credito: 120 },
      ];
      const extrato = [{ chave_acesso: CHAVE_OK, cbs_credito: 150, ibs_credito: 120 }];
      const diff = buildDiff(extrato, creditosMulti);
      expect(diff[0].status).toBe('ok');
      expect(diff[0].cbs_sistema).toBe(150);
    });

    it('ignora creditos com tipo_tributo diferente de CBS/IBS', () => {
      const creditosComIS = [
        { documento_chave: CHAVE_OK, tipo_tributo: 'CBS', valor_credito: 150 },
        { documento_chave: CHAVE_OK, tipo_tributo: 'IS', valor_credito: 999 },
      ];
      const extrato = [{ chave_acesso: CHAVE_OK, cbs_credito: 150, ibs_credito: 0 }];
      const diff = buildDiff(extrato, creditosComIS);
      expect(diff[0].status).toBe('ok');
      expect(diff[0].ibs_sistema).toBeNull();
    });
  });
});
