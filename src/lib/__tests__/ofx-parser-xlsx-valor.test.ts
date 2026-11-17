/**
 * Regressao: extrato em .xlsx entrava com valor mil vezes menor.
 *
 * O parseCSV foi corrigido em 2026-09 (parseValorCsv, com regex de milhar BRL e
 * guarda Number.isFinite) e o parseExcel ficou com a logica antiga:
 * `parseFloat(String(cell).replace(/[^\d,.-]/g,'').replace(',', '.'))`. Efeito
 * medido no main antes desta correcao:
 *   "1.234,56"  -> 1.234   (mil vezes menor)
 *   "-1.234,56" -> -1.234
 *   "abc"       -> NaN, com sucesso: true e SEM aviso
 * E e caminho de producao: ImportarExtratoDialog.tsx:135-138 desvia .xlsx/.xls
 * para parseExcel no mesmo dialogo que alimenta a conciliacao.
 */
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcel, parseCSV } from '../ofx-parser';

/** Planilha com a coluna Valor como TEXTO, que e como bancos exportam. */
function planilha(valores: string[]): ArrayBuffer {
  const linhas: unknown[][] = [['Data', 'Descricao', 'Valor']];
  for (const v of valores) linhas.push(['01/01/2026', 'Teste', v]);
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extrato');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return buf;
}

describe('parseExcel — valor monetario BRL', () => {
  it('nao perde a grandeza de 1.234,56 (antes virava 1.234)', () => {
    const r = parseExcel(planilha(['1.234,56']), 'extrato.xlsx');
    expect(r.sucesso).toBe(true);
    expect(r.extrato?.transacoes[0].valor).toBe(1234.56);
  });

  it('preserva a grandeza do negativo e o classifica como debito', () => {
    const r = parseExcel(planilha(['-1.234,56']), 'extrato.xlsx');
    expect(r.sucesso).toBe(true);
    expect(r.extrato?.transacoes[0].valor).toBe(-1234.56);
    expect(r.extrato?.transacoes[0].tipo).toBe('debito');
  });

  it('rejeita celula nao numerica em vez de criar transacao NaN', () => {
    const r = parseExcel(planilha(['abc']), 'extrato.xlsx');
    expect(r.sucesso).toBe(false);
    expect(r.avisos.some((a) => a.includes('ignorada'))).toBe(true);
    expect(r.extrato).toBeUndefined();
  });

  it('nao deixa NaN entrar junto com linha boa', () => {
    const r = parseExcel(planilha(['1.000,00', 'abc', '2.500,50']), 'extrato.xlsx');
    expect(r.sucesso).toBe(true);
    const valores = r.extrato?.transacoes.map((t) => t.valor) ?? [];
    expect(valores).toEqual([1000, 2500.5]);
    expect(valores.some((v) => Number.isNaN(v))).toBe(false);
    expect(r.avisos.some((a) => a.includes('ignorada'))).toBe(true);
  });

  it('aceita R$ e formato internacional, como o CSV', () => {
    const r = parseExcel(planilha(['R$ 1.234,56', '1234.56']), 'extrato.xlsx');
    expect(r.extrato?.transacoes.map((t) => t.valor)).toEqual([1234.56, 1234.56]);
  });

  it('celula numerica do Excel continua passando direto', () => {
    const linhas: unknown[][] = [
      ['Data', 'Descricao', 'Valor'],
      ['01/01/2026', 'Teste', 1234.56],
    ];
    const ws = XLSX.utils.aoa_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extrato');
    const r = parseExcel(
      XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer,
      'e.xlsx'
    );
    expect(r.extrato?.transacoes[0].valor).toBe(1234.56);
  });

  it('CSV e XLSX dao o mesmo numero para a mesma entrada', () => {
    const csv = parseCSV('Data;Descricao;Valor\n01/01/2026;Teste;1.234,56\n', 'e.csv');
    const xls = parseExcel(planilha(['1.234,56']), 'e.xlsx');
    expect(csv.extrato?.transacoes[0].valor).toBe(xls.extrato?.transacoes[0].valor);
    expect(xls.extrato?.transacoes[0].valor).toBe(1234.56);
  });
});

/**
 * Ressalva que manteve o achado F01 como PARCIAL: CSV com delimitador virgula e
 * valor BRL SEM aspas perdia os centavos em silencio, porque o parseCSVLine
 * quebra a coluna antes do parser de valor ver o conteudo.
 *
 * Medido no main antes desta correcao:
 *   'data,descricao,valor' + '01/01/2026,Teste,1.234,56' -> valor 1234, avisos []
 */
describe('CSV separado por virgula com valor BRL sem aspas (F01)', () => {
  it('recompoe os centavos e avisa, em vez de perder 56 centavos calado', () => {
    const r = parseCSV('data,descricao,valor\n01/01/2026,Teste,1.234,56\n', 'e.csv');
    expect(r.sucesso).toBe(true);
    expect(r.extrato?.transacoes[0].valor).toBe(1234.56);
    expect(r.avisos.join(' ')).toMatch(/centavos foram recompostos/i);
  });

  it('negativo tambem preserva a grandeza', () => {
    const r = parseCSV('data,descricao,valor\n01/01/2026,Teste,-1.234,56\n', 'e.csv');
    expect(r.extrato?.transacoes[0].valor).toBe(-1234.56);
  });

  it('com aspas continua funcionando sem aviso de recomposicao', () => {
    const r = parseCSV('data,descricao,valor\n01/01/2026,Teste,"1.234,56"\n', 'e.csv');
    expect(r.extrato?.transacoes[0].valor).toBe(1234.56);
    expect(r.avisos.join(' ')).not.toMatch(/recompostos/i);
  });

  it('coluna extra declarada no cabecalho NAO e recomposta', () => {
    // 'parcela' existe no cabecalho: a linha tem o mesmo numero de colunas,
    // entao 1.234 e o valor inteiro de verdade e 2 e a parcela.
    const r = parseCSV('data,descricao,valor,parcela\n01/01/2026,Teste,1.234,2\n', 'e.csv');
    expect(r.extrato?.transacoes[0].valor).toBe(1234);
    expect(r.avisos.join(' ')).not.toMatch(/recompostos/i);
  });

  it('ponto e virgula com valor BRL segue intacto', () => {
    const r = parseCSV('data;descricao;valor\n01/01/2026;Teste;1.234,56\n', 'e.csv');
    expect(r.extrato?.transacoes[0].valor).toBe(1234.56);
    expect(r.avisos.join(' ')).not.toMatch(/recompostos/i);
  });
});
