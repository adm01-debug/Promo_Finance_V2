/**
 * Etapa 55 — itens da NF-e autorizada.
 *
 * Dois pontos que nao podem errar em silencio:
 *  1. unidade: coluna p_* e numeric(5,4) em FRACAO; o XML traz percentual.
 *     Gravar 11.30 estoura o numeric e derruba a gravacao inteira.
 *  2. totais: precisam ser a soma dos itens, senao o trigger do banco rejeita
 *     a nota com 22023 no momento da gravacao.
 */
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { extrairItens, calcularTotais } from '../itens.ts';

const FIXTURES = new URL('../../sefaz/__fixtures__/', import.meta.url);
const ler = (nome: string) => Deno.readTextFile(new URL(nome, FIXTURES));
const PROC = 'procNFe-ibscbs-2026.xml';

Deno.test('extrairItens — le os campos obrigatorios de prod', async () => {
  const r = extrairItens(await ler(PROC));
  assert(r, 'procNFe deve produzir itens');
  assertEquals(r.itens.length, 1);
  const i = r.itens[0];
  assertEquals(i.nItem, 1);
  assertEquals(i.cProd, 'P1');
  assertEquals(i.xProd, 'PRODUTO A');
  assertEquals(i.ncm, '12345678');
  assertEquals(i.cfop, '5102');
  assertEquals(i.qCom, 1);
  assertEquals(i.vUnCom, 100);
  assertEquals(i.vProd, 100);
});

Deno.test('extrairItens — percentual do XML vira fracao (11.30 -> 0.113)', async () => {
  const i = extrairItens(await ler(PROC))!.itens[0];
  assertEquals(i.pIbsUf, 0.113);
  assertEquals(i.pIbsMun, 0.05);
  assertEquals(i.pCbs, 0.09);
  assertEquals(i.pRedAliq, 0.5);
  assertEquals(i.pAliqEfet, 0.0565);
});

Deno.test('extrairItens — valores absolutos e grupo IS do item', async () => {
  const i = extrairItens(await ler(PROC))!.itens[0];
  assertEquals(i.cstIbsCbs, '200');
  assertEquals(i.cClassTrib, '000123');
  assertEquals(i.vBcIbsCbs, 100);
  assertEquals(i.vIbsUf, 5.65);
  assertEquals(i.vIbsMun, 5);
  assertEquals(i.vCbs, 9);
  assertEquals(i.vIbs, 10.65);
  assertEquals(i.cstIs, '200');
  assertEquals(i.cClassTribIs, '000123');
  assertEquals(i.vIs, 1);
  assertEquals(i.pIs, 0.01);
});

Deno.test('extrairItens — totais sao a soma dos itens, nao o IBSCBSTot', async () => {
  const r = extrairItens(await ler(PROC))!;
  assertEquals(r.totais.vBcIbsCbs, 100);
  assertEquals(r.totais.vIbs, 10.65);
  assertEquals(r.totais.vIbsUf, 5.65);
  assertEquals(r.totais.vIbsMun, 5);
  assertEquals(r.totais.vCbs, 9);
  assertEquals(r.totais.vIs, 1);
});

Deno.test('extrairItens — soma absorve ruido de ponto flutuante', () => {
  const totais = calcularTotais([
    { nItem: 1, cProd: 'A', ncm: '1', cfop: '5102', vCbs: 0.1 },
    { nItem: 2, cProd: 'B', ncm: '2', cfop: '5102', vCbs: 0.2 },
  ]);
  // 0.1 + 0.2 em JS e 0.30000000000000004; o banco grava round(sum(...), 2),
  // entao o parser precisa entregar 0.3 ou o trigger acusa divergencia.
  assertEquals(totais.vCbs, 0.3);
  assertEquals(totais.vIbs, 0);
});

Deno.test('extrairItens — resumo (resNFe) nao tem itens', async () => {
  assertEquals(extrairItens(await ler('resNFe-resumo.xml')), null);
});

Deno.test('extrairItens — XML sem infNFe devolve null', () => {
  assertEquals(extrairItens('<resNFe><chNFe>1</chNFe></resNFe>'), null);
});

Deno.test('extrairItens — det sem cProd/NCM/CFOP e descartado (colunas NOT NULL)', () => {
  const xml = [
    '<infNFe Id="NFe1">',
    '  <det nItem="1"><prod><cProd>X</cProd><xProd>SEM NCM</xProd></prod>',
    '    <imposto><IBSCBS><CST>200</CST></IBSCBS></imposto>',
    '  </det>',
    '</infNFe>',
  ].join('\n');
  assertEquals(extrairItens(xml), null);
});

Deno.test('extrairItens — item sem grupo IBS/CBS continua sendo lido', () => {
  const xml = [
    '<infNFe Id="NFe1">',
    '  <det nItem="1"><prod><cProd>X</cProd><xProd>ANTES DE 2026</xProd>',
    '    <NCM>12345678</NCM><CFOP>5102</CFOP></prod></det>',
    '</infNFe>',
  ].join('\n');
  const r = extrairItens(xml);
  assert(r);
  assertEquals(r.itens[0].cstIbsCbs, undefined);
  assertEquals(r.totais.vCbs, 0);
  assertEquals(r.totais.vIbs, 0);
});
